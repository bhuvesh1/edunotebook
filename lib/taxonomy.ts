// Taxonomy helpers — read-only access to data/taxonomy.json.
// URL slugs are generated deterministically here AND in prisma/seed.ts
// (seed imports slugify + the with-slugs helpers from this file),
// so /topic/[subject]/[topicSlug] URLs always resolve.

import rawTaxonomy from "../data/taxonomy.json";

export interface SubcategoryData {
  name: string;
  topics: string[];
}

export interface CategoryData {
  name: string;
  subcategories: SubcategoryData[];
}

export interface SubjectData {
  subject: string;
  slug: string;
  categories: CategoryData[];
}

const taxonomy = rawTaxonomy as SubjectData[];

/** Convert any taxonomy name into a URL-safe slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "") // drop punctuation/symbols
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

/** Ensure slugs are unique within a scope, appending -2, -3… on collision. */
function makeUnique(names: string[]): string[] {
  const seen = new Set<string>();
  return names.map((name) => {
    const base = slugify(name) || "item";
    let slug = base;
    let n = 2;
    while (seen.has(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    seen.add(slug);
    return slug;
  });
}

export interface SubjectSummary {
  name: string;
  slug: string;
  topicCount: number;
  categoryCount: number;
}

export function getSubjects(): SubjectSummary[] {
  return taxonomy.map((s) => ({
    name: s.subject,
    slug: s.slug,
    categoryCount: s.categories.length,
    topicCount: s.categories.reduce(
      (acc, c) =>
        acc + c.subcategories.reduce((a, sc) => a + sc.topics.length, 0),
      0
    ),
  }));
}

export function getSubjectBySlug(slug: string): SubjectData | undefined {
  return taxonomy.find((s) => s.slug === slug);
}

export interface SubcategoryWithSlugs {
  name: string;
  slug: string;
  topics: { name: string; slug: string }[];
}

export interface CategoryWithSlugs {
  name: string;
  slug: string;
  subcategories: SubcategoryWithSlugs[];
}

/** Categories with deterministic unique slugs (same algorithm as the seeder). */
export function getCategoriesWithSlugs(
  subjectSlug: string
): CategoryWithSlugs[] {
  const subject = getSubjectBySlug(subjectSlug);
  if (!subject) return [];
  const categorySlugs = makeUnique(subject.categories.map((c) => c.name));
  return subject.categories.map((c, ci) => {
    const subcategorySlugs = makeUnique(c.subcategories.map((sc) => sc.name));
    return {
      name: c.name,
      slug: categorySlugs[ci],
      subcategories: c.subcategories.map((sc, sci) => {
        const topicSlugs = makeUnique(sc.topics);
        return {
          name: sc.name,
          slug: subcategorySlugs[sci],
          topics: sc.topics.map((t, ti) => ({ name: t, slug: topicSlugs[ti] })),
        };
      }),
    };
  });
}

/** Alias kept for page code readability. */
export const getCategories = getCategoriesWithSlugs;

export interface TopicRef {
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  subcategorySlug: string;
}

/** Flat list of every topic in a subject, in taxonomy order. */
export function getTopicsFlat(subjectSlug: string): TopicRef[] {
  const flat: TopicRef[] = [];
  for (const c of getCategoriesWithSlugs(subjectSlug)) {
    for (const sc of c.subcategories) {
      for (const t of sc.topics) {
        flat.push({
          name: t.name,
          slug: t.slug,
          category: c.name,
          categorySlug: c.slug,
          subcategory: sc.name,
          subcategorySlug: sc.slug,
        });
      }
    }
  }
  return flat;
}

export function getTopicBySlug(
  subjectSlug: string,
  topicSlug: string
): TopicRef | undefined {
  return getTopicsFlat(subjectSlug).find((t) => t.slug === topicSlug);
}

export function totalTopics(): number {
  return getSubjects().reduce((acc, s) => acc + s.topicCount, 0);
}
