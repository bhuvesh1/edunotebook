import type { MetadataRoute } from "next";
import { prisma } from "../lib/db";
import { getSubjectsFromDB } from "../lib/content";
import { SITE_URL } from "../lib/site";

// Static pages + every subject page + every published topic page +
// every published blog post.
// Dynamic (not prerendered): admin-added/edited content must appear in the
// sitemap immediately, without waiting for a rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const subjects = await getSubjectsFromDB();

  const [topics, posts] = await Promise.all([
    prisma.topic.findMany({
      where: {
        status: "published",
        subcategory: { category: { subject: { enabled: true } } },
      },
      select: {
        slug: true,
        subcategory: {
          select: {
            category: { select: { subject: { select: { slug: true } } } },
          },
        },
      },
      orderBy: { id: "asc" },
    }),
    prisma.blogPost.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
      orderBy: { id: "asc" },
    }),
  ]);

  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blogs`, changeFrequency: "daily", priority: 0.9 },
    ...subjects.map((s) => ({
      url: `${SITE_URL}/subject/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...topics.map((t) => ({
      url: `${SITE_URL}/topic/${t.subcategory.category.subject.slug}/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
