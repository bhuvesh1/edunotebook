// Seed the DB from data/taxonomy.json:
// subjects → categories → subcategories → topics, with URL slugs.
// Slugs come from lib/taxonomy.ts — the SAME deterministic algorithm the
// /topic/[subject]/[topicSlug] pages use to resolve URLs, so seed and site
// can never disagree on a slug.
//
// Run: npm run db:seed   (after `npm run db:push`)

import { PrismaClient } from "@prisma/client";
import {
  getSubjects,
  getSubjectBySlug,
  getCategoriesWithSlugs,
} from "../lib/taxonomy";

const prisma = new PrismaClient();

async function main() {
  // SAFETY: this script wipes the entire taxonomy. Refuse to run against
  // anything that is not obviously a local dev database, unless the
  // operator explicitly confirms. (Pre-production audit finding: an
  // unconditional wipe here once made a test topic vanish without a trace.)
  const dbUrl = process.env.DATABASE_URL ?? "";
  const allowWipe =
    dbUrl.startsWith("file:") ||
    process.env.ALLOW_SEED_WIPE === "1" ||
    process.argv.includes("--force");
  if (!allowWipe) {
    console.error(
      "Refusing to wipe taxonomy: DATABASE_URL does not look like a local dev database.\n" +
        "Set ALLOW_SEED_WIPE=1 or pass --force if you really want to delete ALL subjects/categories/topics/blogs."
    );
    process.exit(1);
  }

  // Fresh, idempotent seed: wipe taxonomy tables first.
  await prisma.blogPost.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.subject.deleteMany();

  const summaries = getSubjects();
  let topicTotal = 0;

  for (const summary of summaries) {
    const raw = getSubjectBySlug(summary.slug);
    if (!raw) throw new Error(`Subject missing from taxonomy: ${summary.slug}`);
    const categories = getCategoriesWithSlugs(summary.slug);

    await prisma.subject.create({
      data: {
        name: raw.subject,
        slug: raw.slug,
        categories: {
          create: categories.map((c) => ({
            name: c.name,
            slug: c.slug,
            subcategories: {
              create: c.subcategories.map((sc) => ({
                name: sc.name,
                slug: sc.slug,
                topics: {
                  create: sc.topics.map((t) => ({
                    name: t.name,
                    slug: t.slug,
                  })),
                },
              })),
            },
          })),
        },
      },
    });

    topicTotal += summary.topicCount;
    console.log(
      `  seeded ${raw.subject}: ${categories.length} categories, ${summary.topicCount} topics`
    );
  }

  console.log(
    `\nDone: ${summaries.length} subjects, ${topicTotal} topics (expected 3531).`
  );
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
