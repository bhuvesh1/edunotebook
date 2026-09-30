// lib/content.ts — DB-first public content layer.
//
// Public pages read subjects / topics from the Prisma DB so admin-added or
// admin-edited content appears on the site immediately. taxonomy.json stays
// as a seed fallback: every function falls back to lib/taxonomy when the
// DB has no data for it (empty DB → seeded taxonomy view).

import { prisma } from "./db";
import {
  getSubjects,
  getCategoriesWithSlugs,
  getTopicBySlug,
  totalTopics,
  type CategoryWithSlugs,
} from "./taxonomy";

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

export interface SubjectSummaryDB {
  slug: string;
  name: string;
  topicCount: number;
  order: number;
  categoryCount: number;
}

// Raw Prisma query for enabled subjects (extracted so the caller can
// catch connection failures and fall back to taxonomy instead of throwing).
async function querySubjects() {
  return prisma.subject.findMany({
    where: { enabled: true },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: {
      slug: true,
      name: true,
      order: true,
      categories: {
        select: {
          subcategories: {
            select: {
              topics: {
                where: { status: "published" },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });
}

/** Enabled subjects ordered by admin `order`; DB topic counts. */
export async function getSubjectsFromDB(): Promise<SubjectSummaryDB[]> {
  // Connection failures (e.g. unreachable DB at Docker build time) fall
  // back to the taxonomy instead of throwing — the build must not need a
  // live database.
  let subjects: Awaited<ReturnType<typeof querySubjects>> = [];
  try {
    subjects = await querySubjects();
  } catch {
    subjects = [];
  }

  // Empty DB (not seeded yet) → seed fallback so the site still renders.
  if (subjects.length === 0) {
    return getSubjects().map((s) => ({
      slug: s.slug,
      name: s.name,
      topicCount: s.topicCount,
      order: 0,
      categoryCount: s.categoryCount,
    }));
  }

  return subjects.map((s) => {
    const topicCount = s.categories.reduce(
      (acc, c) =>
        acc + c.subcategories.reduce((a, sc) => a + sc.topics.length, 0),
      0
    );
    return {
      slug: s.slug,
      name: s.name,
      topicCount,
      order: s.order,
      categoryCount: s.categories.length,
    };
  });
}

/** Total published topics across enabled subjects (DB, fallback: taxonomy). */
async function querySubjectTrees() {
  return prisma.subject.findMany({
    where: { enabled: true },
    select: {
      categories: {
        select: {
          subcategories: {
            select: {
              topics: {
                where: { status: "published" },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function totalTopicsFromDB(): Promise<number> {
  let dbSubjects: Awaited<ReturnType<typeof querySubjectTrees>> = [];
  try {
    dbSubjects = await querySubjectTrees();
  } catch {
    return totalTopics();
  }
  if (dbSubjects.length === 0) return totalTopics();
  return dbSubjects.reduce(
    (acc, s) =>
      acc +
      s.categories.reduce(
        (a, c) =>
          a + c.subcategories.reduce((x, sc) => x + sc.topics.length, 0),
        0
      ),
    0
  );
}

// ---------------------------------------------------------------------------
// Subject detail
// ---------------------------------------------------------------------------

export interface SubjectDetailTopic {
  name: string;
  slug: string;
}

export interface SubjectDetailSubcategory {
  name: string;
  topics: SubjectDetailTopic[];
}

export interface SubjectDetailCategory {
  name: string;
  subcategories: SubjectDetailSubcategory[];
}

export interface SubjectDetail {
  slug: string;
  name: string;
  description: string | null;
  categories: SubjectDetailCategory[];
}

/**
 * Full category tree for a subject (published topics only, admin ordering).
 * Returns null when the slug has no enabled DB subject AND no taxonomy data.
 */
async function querySubjectDetail(slug: string) {
  return prisma.subject.findFirst({
    where: { slug, enabled: true },
    select: {
      slug: true,
      name: true,
      description: true,
      categories: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          name: true,
          subcategories: {
            orderBy: { id: "asc" },
            select: {
              name: true,
              topics: {
                where: { status: "published" },
                orderBy: { id: "asc" },
                select: { name: true, slug: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getSubjectDetail(
  slug: string
): Promise<SubjectDetail | null> {
  // Connection failure → null → taxonomy fallback below (build-safe).
  let subject: Awaited<ReturnType<typeof querySubjectDetail>> = null;
  try {
    subject = await querySubjectDetail(slug);
  } catch {
    subject = null;
  }

  if (subject) {
    return {
      slug: subject.slug,
      name: subject.name,
      description: subject.description,
      categories: subject.categories.map((c) => ({
        name: c.name,
        subcategories: c.subcategories.map((sc) => ({
          name: sc.name,
          topics: sc.topics.map((t) => ({ name: t.name, slug: t.slug })),
        })),
      })),
    };
  }

  // DB has no enabled subject for this slug: fall back to the seeded
  // taxonomy shape so legacy content still renders.
  const taxonomyCategories: CategoryWithSlugs[] =
    getCategoriesWithSlugs(slug);
  if (taxonomyCategories.length === 0) return null;
  const fallback = getSubjects().find((s) => s.slug === slug);
  return {
    slug,
    name: fallback?.name ?? slug,
    description: null,
    categories: taxonomyCategories.map((c) => ({
      name: c.name,
      subcategories: c.subcategories.map((sc) => ({
        name: sc.name,
        topics: sc.topics.map((t) => ({ name: t.name, slug: t.slug })),
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Topic detail
// ---------------------------------------------------------------------------

export interface TopicDetail {
  id: number | null; // null when resolved from the taxonomy fallback
  name: string;
  slug: string;
  description: string | null;
  simKey: string | null;
  subjectSlug: string;
  subjectName: string;
  categoryName: string;
  subcategoryName: string;
  subcategorySlug: string;
  siblings: SubjectDetailTopic[];
}

async function queryTopicDetail(subjectSlug: string, topicSlug: string) {
  return prisma.topic.findFirst({
    where: {
      slug: topicSlug,
      status: "published",
      subcategory: {
        category: { subject: { slug: subjectSlug, enabled: true } },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      simKey: true,
      subcategoryId: true,
      subcategory: {
        select: {
          name: true,
          slug: true,
          category: {
            select: {
              name: true,
              subject: { select: { slug: true, name: true } },
            },
          },
        },
      },
    },
  });
}

async function queryTopicSiblings(subcategoryId: number) {
  return prisma.topic.findMany({
    where: { status: "published", subcategoryId },
    orderBy: { id: "asc" },
    select: { name: true, slug: true },
  });
}

/**
 * One topic's page data. DB first (published status required); taxonomy
 * fallback keeps the page working before/while the DB is seeded.
 */
export async function getTopicDetail(
  subjectSlug: string,
  topicSlug: string
): Promise<TopicDetail | null> {
  // Connection failure → null → taxonomy fallback below (build-safe).
  let dbTopic: Awaited<ReturnType<typeof queryTopicDetail>> = null;
  try {
    dbTopic = await queryTopicDetail(subjectSlug, topicSlug);
  } catch {
    dbTopic = null;
  }

  if (dbTopic) {
    let siblings: Awaited<ReturnType<typeof queryTopicSiblings>> = [];
    try {
      siblings = await queryTopicSiblings(dbTopic.subcategoryId);
    } catch {
      siblings = [];
    }
    return {
      id: dbTopic.id,
      name: dbTopic.name,
      slug: dbTopic.slug,
      description: dbTopic.description,
      simKey: dbTopic.simKey,
      subjectSlug,
      subjectName: dbTopic.subcategory.category.subject.name,
      categoryName: dbTopic.subcategory.category.name,
      subcategoryName: dbTopic.subcategory.name,
      subcategorySlug: dbTopic.subcategory.slug,
      siblings: siblings
        .filter((s) => s.slug !== topicSlug)
        .slice(0, 6)
        .map((s) => ({ name: s.name, slug: s.slug })),
    };
  }

  // Taxonomy fallback: no DB id, no simKey override, no description.
  const fallback = getTopicBySlug(subjectSlug, topicSlug);
  if (!fallback) return null;
  const fallbackCategories = getCategoriesWithSlugs(subjectSlug);
  const sc = fallbackCategories
    .flatMap((c) => c.subcategories)
    .find((x) => x.slug === fallback.subcategorySlug);
  const fallbackSubject = getSubjects().find((s) => s.slug === subjectSlug);
  return {
    id: null,
    name: fallback.name,
    slug: fallback.slug,
    description: null,
    simKey: null,
    subjectSlug,
    subjectName: fallbackSubject?.name ?? subjectSlug,
    categoryName: fallback.category,
    subcategoryName: fallback.subcategory,
    subcategorySlug: fallback.subcategorySlug,
    siblings: (sc?.topics ?? [])
      .filter((t) => t.slug !== topicSlug)
      .slice(0, 6)
      .map((t) => ({ name: t.name, slug: t.slug })),
  };
}
