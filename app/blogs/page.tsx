import Link from "next/link";
import type { Metadata } from "next";
import { getSubjectsFromDB } from "../../lib/content";
import { prisma } from "../../lib/db";
import { SITE_NAME } from "../../lib/site";
import BlogListClient from "./BlogListClient";

export const metadata: Metadata = {
  title: `Blogs | ${SITE_NAME}`,
  description: `Read ${SITE_NAME} blogs — concise, example-driven guides for every topic, from Physics to Mathematics.`,
};

const PER_PAGE = 24;

interface BlogsPageProps {
  searchParams: Promise<{ page?: string; subject?: string }>;
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const { page: pageParam, subject: subjectParam } = await searchParams;
  const subjects = await getSubjectsFromDB();

  const activeSubject = subjects.some((s) => s.slug === subjectParam)
    ? (subjectParam as string)
    : null;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // Single efficient query: only the fields the listing needs.
  const where = activeSubject
    ? { status: "published", subjectSlug: activeSubject }
    : { status: "published" };

  const [total, all] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      select: { slug: true, title: true, excerpt: true, subjectSlug: true },
      orderBy: { id: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const posts = all.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const pageLink = (p: number) =>
    `/blogs?page=${p}${activeSubject ? `&subject=${activeSubject}` : ""}`;

  // Compact pagination window.
  const windowPages: number[] = [];
  for (
    let p = Math.max(1, safePage - 2);
    p <= Math.min(totalPages, safePage + 2);
    p++
  ) {
    windowPages.push(p);
  }

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold notebook-underline inline-block pb-2">
        Blogs
      </h1>
      <p className="mt-4 max-w-2xl text-slate-700">
        {total.toLocaleString("en-IN")} concise, example-driven guides — one for
        every topic on {SITE_NAME}.
      </p>

      {/* Subject filter chips */}
      <nav
        aria-label="Filter blogs by subject"
        className="mt-6 flex flex-wrap gap-2"
      >
        <Link
          href="/blogs"
          aria-current={activeSubject ? undefined : "page"}
          className={`rounded-full border-2 px-4 py-1 text-sm font-semibold ${
            activeSubject
              ? "border-[var(--rule)] hover:bg-slate-100"
              : "border-[var(--margin-line)] bg-white shadow-sm"
          }`}
        >
          All
        </Link>
        {subjects.map((s) => (
          <Link
            key={s.slug}
            href={`/blogs?subject=${s.slug}`}
            aria-current={activeSubject === s.slug ? "page" : undefined}
            className={`rounded-full border-2 px-4 py-1 text-sm font-semibold ${
              activeSubject === s.slug
                ? "border-[var(--margin-line)] bg-white shadow-sm"
                : "border-[var(--rule)] hover:bg-slate-100"
            }`}
          >
            {s.name}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <BlogListClient posts={posts} activeSubject={activeSubject} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Blog pages"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {safePage > 1 && (
            <Link
              href={pageLink(safePage - 1)}
              className="rounded-lg border-2 border-[var(--rule)] px-4 py-1.5 font-hand text-lg hover:bg-slate-100"
            >
              ← Prev
            </Link>
          )}
          {windowPages.map((p) => (
            <Link
              key={p}
              href={pageLink(p)}
              aria-current={p === safePage ? "page" : undefined}
              className={`rounded-lg border-2 px-3.5 py-1.5 font-semibold ${
                p === safePage
                  ? "border-[var(--margin-line)] bg-white shadow-sm"
                  : "border-[var(--rule)] hover:bg-slate-100"
              }`}
            >
              {p}
            </Link>
          ))}
          {safePage < totalPages && (
            <Link
              href={pageLink(safePage + 1)}
              className="rounded-lg border-2 border-[var(--rule)] px-4 py-1.5 font-hand text-lg hover:bg-slate-100"
            >
              Next →
            </Link>
          )}
          <span className="w-full text-center text-sm text-slate-500">
            Page {safePage} of {totalPages.toLocaleString("en-IN")}
          </span>
        </nav>
      )}
    </div>
  );
}
