"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface BlogCard {
  slug: string;
  title: string;
  excerpt: string | null;
  subjectSlug: string | null;
}

function subjectLabel(slug: string | null): string {
  if (!slug) return "Blog";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export default function BlogListClient({
  posts,
  activeSubject,
}: {
  posts: BlogCard[];
  activeSubject: string | null;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => p.title.toLowerCase().includes(q));
  }, [query, posts]);

  return (
    <div>
      <label className="block">
        <span className="sr-only">Search blogs on this page</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search these blogs by title…"
          className="w-full max-w-xl rounded-lg border-2 border-[var(--rule)] bg-white/80 px-4 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--margin-line)]"
        />
      </label>

      {query.trim() && (
        <p className="mt-3 text-sm text-slate-600">
          {filtered.length === 0
            ? "No blogs on this page match your search."
            : `${filtered.length} of ${posts.length} blogs on this page match.`}
        </p>
      )}

      <div
        className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left"
        role="list"
        aria-label="Blog posts"
      >
        {filtered.map((post) => (
          <article
            key={post.slug}
            role="listitem"
            className="flex flex-col rounded-lg border-2 border-[var(--rule)] bg-white/70 p-6 hover:shadow-md transition-shadow"
          >
            <Link
              href={
                activeSubject
                  ? `/blogs?subject=${activeSubject}`
                  : "/blogs"
              }
              onClick={(e) => e.stopPropagation()}
              className="self-start rounded-full border px-2.5 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              {subjectLabel(post.subjectSlug)}
            </Link>
            <h3 className="mt-3 font-hand text-xl font-bold leading-snug">
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h3>
            <p className="mt-2 text-sm text-slate-600 line-clamp-3 flex-1">
              {post.excerpt}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-4 font-hand text-lg underline decoration-[var(--margin-line)] underline-offset-4"
            >
              Read more →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
