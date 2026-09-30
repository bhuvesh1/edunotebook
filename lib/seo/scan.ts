// lib/seo/scan.ts — SEO health scanner for the admin SEO Health page.
// Detects: orphan topics (published, no blog post), duplicate blog titles,
// broken internal links inside blog HTML, and published blogs missing excerpts.
// Findings are persisted as SeoIssue rows, deduped on (kind, ref) so a
// re-run never piles up duplicate open issues for the same problem.

import { prisma } from "@/lib/db";

export interface SeoScanResult {
  orphans: number;
  duplicates: number;
  brokenLinks: number;
  missingMeta: number;
}

/** Internal paths that always resolve (no DB lookup needed). */
const STATIC_OK_PATHS = new Set(["/", "/blogs", "/ask", "/panel", "/login", "/signup"]);

/** Extract internal href targets from an HTML fragment. */
function extractInternalHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const re = /href="(\/[^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) hrefs.push(m[1]);
  return hrefs;
}

/** Normalise an href for comparison: drop query/hash and trailing slash. */
function normaliseHref(href: string): string {
  let h = href.split(/[?#]/, 1)[0];
  if (h.length > 1 && h.endsWith("/")) h = h.slice(0, -1);
  return h;
}

interface NewIssue {
  kind: string;
  entityType: string;
  ref: string;
  url: string;
  detail: string;
}

export async function runSeoScan(): Promise<SeoScanResult> {
  const result: SeoScanResult = { orphans: 0, duplicates: 0, brokenLinks: 0, missingMeta: 0 };

  // Existing open issues — keyed so we never recreate a live issue.
  const open = await prisma.seoIssue.findMany({
    where: { status: "open" },
    select: { kind: true, ref: true },
  });
  const seen = new Set(open.map((i) => `${i.kind}|${i.ref ?? ""}`));
  const pending: NewIssue[] = [];
  const queue = (issue: NewIssue): boolean => {
    const key = `${issue.kind}|${issue.ref}`;
    if (seen.has(key)) return false;
    seen.add(key);
    pending.push(issue);
    return true;
  };

  // ---- 1. Orphan topics: published, no blog post ----
  const orphans = await prisma.topic.findMany({
    where: { status: "published", blogPost: null },
    select: {
      name: true,
      slug: true,
      subcategory: {
        select: {
          category: { select: { subject: { select: { slug: true } } } },
        },
      },
    },
  });
  for (const t of orphans) {
    const subjectSlug = t.subcategory.category.subject.slug;
    if (
      queue({
        kind: "orphan",
        entityType: "topic",
        ref: `${subjectSlug}/${t.slug}`,
        url: `/topic/${subjectSlug}/${t.slug}`,
        detail: `${t.name} has no blog post.`,
      })
    ) {
      result.orphans += 1;
    }
  }

  // ---- 2. Duplicate titles among published blogs ----
  const dupTitles = await prisma.blogPost.groupBy({
    by: ["title"],
    where: { status: "published" },
    _count: { _all: true },
    having: { title: { _count: { gt: 1 } } },
  });
  if (dupTitles.length > 0) {
    const colliding = await prisma.blogPost.findMany({
      where: {
        status: "published",
        title: { in: dupTitles.map((d) => d.title) },
      },
      select: { slug: true, title: true },
      orderBy: { id: "asc" },
    });
    const byTitle = new Map<string, string[]>();
    for (const b of colliding) {
      const list = byTitle.get(b.title) ?? [];
      list.push(b.slug);
      byTitle.set(b.title, list);
    }
    for (const b of colliding) {
      const slugs = (byTitle.get(b.title) ?? []).filter((s) => s !== b.slug);
      if (
        queue({
          kind: "duplicate",
          entityType: "blog",
          ref: b.slug,
          url: `/blog/${b.slug}`,
          detail: `Title "${b.title}" is also used by: ${slugs.join(", ")}.`,
        })
      ) {
        result.duplicates += 1;
      }
    }
  }

  // ---- 3. Broken internal links + 4. missing meta ----
  const [subjects, topicPaths, blogs] = await Promise.all([
    prisma.subject.findMany({ select: { slug: true } }),
    prisma.topic.findMany({
      where: { status: "published" },
      select: {
        slug: true,
        subcategory: {
          select: { category: { select: { subject: { select: { slug: true } } } } },
        },
      },
    }),
    prisma.blogPost.findMany({
      where: { status: "published" },
      select: { slug: true, excerpt: true, contentHtml: true },
    }),
  ]);

  const validTopicPaths = new Set(
    topicPaths.map((t) => `/topic/${t.subcategory.category.subject.slug}/${t.slug}`)
  );
  const validBlogPaths = new Set(blogs.map((b) => `/blog/${b.slug}`));
  const validSubjectPaths = new Set(subjects.map((s) => `/subject/${s.slug}`));

  for (const b of blogs) {
    // Missing meta (excerpt used as the meta description).
    if (!b.excerpt || b.excerpt.trim() === "") {
      if (
        queue({
          kind: "missing-meta",
          entityType: "blog",
          ref: b.slug,
          url: `/blog/${b.slug}`,
          detail: "Published blog post has no excerpt (used as the meta description).",
        })
      ) {
        result.missingMeta += 1;
      }
    }

    // Broken internal links: one open issue per blog at a time (dedupe key),
    // recording the first unresolvable href found.
    if (b.contentHtml) {
      for (const raw of extractInternalHrefs(b.contentHtml)) {
        const href = normaliseHref(raw);
        if (STATIC_OK_PATHS.has(href)) continue;
        if (
          href.startsWith("/topic/") ||
          href.startsWith("/blog/") ||
          href.startsWith("/subject/")
        ) {
          const ok =
            (href.startsWith("/topic/") && validTopicPaths.has(href)) ||
            (href.startsWith("/blog/") && validBlogPaths.has(href)) ||
            (href.startsWith("/subject/") && validSubjectPaths.has(href));
          if (!ok) {
            if (
              queue({
                kind: "broken-link",
                entityType: "blog",
                ref: b.slug,
                url: `/blog/${b.slug}`,
                detail: `Link ${raw} does not resolve.`,
              })
            ) {
              result.brokenLinks += 1;
            }
            break; // one open broken-link issue per blog per scan
          }
        }
      }
    }
  }

  if (pending.length > 0) {
    // SQLite-safe batching for createMany.
    for (let i = 0; i < pending.length; i += 500) {
      await prisma.seoIssue.createMany({ data: pending.slice(i, i + 500) });
    }
  }

  return result;
}
