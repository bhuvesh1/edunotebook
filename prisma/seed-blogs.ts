// Seed one SEO-ready blog post per topic (3531 topics).
// Deterministic: generator output depends only on taxonomy data.
// Idempotent: wipes BlogPost first, then inserts in ~200-row chunks.
//
// Run: npm run db:seed:blogs   (after `npm run db:seed`)

import { createRequire } from "module";
// dotenv is optional: it only loads a local .env file for dev. The
// production runner provides env vars directly and does not ship dotenv,
// so a hard import would crash container boot.
try {
  createRequire(import.meta.url)("dotenv/config");
} catch {
  /* dotenv not installed — env vars come from the environment */
}
import { PrismaClient } from "@prisma/client";
import {
  buildBlogPost,
  assembleContentHtml,
  type SiblingRef,
} from "../lib/blogs/generator";

const prisma = new PrismaClient();
const CHUNK = 200;

async function main() {
  const topics = await prisma.topic.findMany({
    orderBy: { id: "asc" },
    include: {
      subcategory: {
        include: {
          category: {
            include: { subject: true },
          },
        },
      },
    },
  });

  console.log(`Loaded ${topics.length} topics.`);

  // Blog slug = "<subjectSlug>-<topicSlug>", deduplicated across ALL topics
  // (topic slugs are only unique per subcategory, so collisions happen).
  const seenSlugs = new Set<string>();
  const blogSlug = (t: (typeof topics)[number]) => {
    const base = `${t.subcategory.category.subject.slug}-${t.slug}`;
    let slug = base;
    let n = 2;
    while (seenSlugs.has(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    seenSlugs.add(slug);
    return slug;
  };
  // Compute all blog slugs FIRST (in id order), so sibling references below
  // use the same deduplicated slugs.
  const blogSlugsByTopicId = new Map<number, string>();
  for (const t of topics) blogSlugsByTopicId.set(t.id, blogSlug(t));

  // Deterministic sibling blog slugs, same subcategory first,
  // then same subject to fill up to 6.
  const relatedSlugsFor = (
    t: (typeof topics)[number],
    index: Map<number, number>
  ): SiblingRef[] => {
    const refFor = (o: (typeof topics)[number]): SiblingRef => ({
      name: o.name,
      slug: blogSlugsByTopicId.get(o.id)!,
    });
    const scTopics = topics.filter(
      (o) => o.subcategoryId === t.subcategoryId && o.id !== t.id
    );
    let refs: SiblingRef[] = scTopics.map(refFor);
    if (refs.length < 6) {
      const subjectId = t.subcategory.category.subject.id;
      const extra = topics
        .filter(
          (o) =>
            o.subcategory.category.subject.id === subjectId &&
            o.subcategoryId !== t.subcategoryId &&
            o.id !== t.id
        )
        .slice(0, 6 - refs.length)
        .map(refFor);
      refs = refs.concat(extra);
    }
    void index;
    return refs.slice(0, 6);
  };

  const index = new Map<number, number>();
  topics.forEach((t, i) => index.set(t.id, i));

  const rows = topics.map((t) => {
    const subject = t.subcategory.category.subject;
    const slug = blogSlugsByTopicId.get(t.id)!;
    const post = buildBlogPost({
      slug,
      subject: subject.name,
      subjectSlug: subject.slug,
      category: t.subcategory.category.name,
      subcategory: t.subcategory.name,
      topic: t.name,
      topicSlug: t.slug,
      siblings: relatedSlugsFor(t, index),
    });
    return {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      summary: post.summary,
      contentHtml: assembleContentHtml(post),
      subjectSlug: subject.slug,
      topicSlug: t.slug,
      status: "published",
      source: "auto",
      topicId: t.id,
    };
  });

  console.log(`Generated ${rows.length} blog posts. Wiping BlogPost…`);
  await prisma.blogPost.deleteMany();

  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await prisma.blogPost.createMany({ data: chunk });
    inserted += chunk.length;
    console.log(`  inserted ${inserted}/${rows.length}`);
  }

  const count = await prisma.blogPost.count();
  console.log(`\nDone: BlogPost count = ${count} (expected ${topics.length}).`);
  if (count !== topics.length) {
    throw new Error(`Count mismatch: ${count} !== ${topics.length}`);
  }
}

main()
  .catch((e) => {
    console.error("Blog seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
