import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getTopicBySlug } from "@/lib/taxonomy";

export const metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  const session = await auth();
  const userId = Number(session!.user.id);

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const blogSlugs = bookmarks
    .filter((b) => b.kind === "blog")
    .map((b) => b.refSlug);
  const blogs = blogSlugs.length
    ? await prisma.blogPost.findMany({
        where: { slug: { in: blogSlugs } },
        select: { slug: true, title: true },
      })
    : [];
  const blogTitle = new Map(blogs.map((b) => [b.slug, b.title]));

  const items = bookmarks.map((b) => {
    if (b.kind === "topic") {
      const [subjectSlug, topicSlug] = b.refSlug.split("/");
      const topic = subjectSlug && topicSlug
        ? getTopicBySlug(subjectSlug, topicSlug)
        : undefined;
      return {
        key: `${b.kind}:${b.refSlug}`,
        href: `/topic/${b.refSlug}`,
        label: topic ? `${topic.name} (${topic.category})` : b.refSlug,
        tag: "Topic",
      };
    }
    return {
      key: `${b.kind}:${b.refSlug}`,
      href: `/blog/${b.refSlug}`,
      label: blogTitle.get(b.refSlug) ?? b.refSlug,
      tag: "Blog",
    };
  });

  return (
    <div>
      <h3 className="notebook-underline inline-block pb-1 text-2xl font-bold sm:text-3xl">
        Bookmarks
      </h3>
      <p className="mt-2 text-slate-600">
        Topics and blogs you&apos;ve saved for later.
      </p>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-[var(--rule)] bg-white/60 p-6 text-center">
          <p className="font-hand text-2xl font-bold text-slate-800">
            No bookmarks yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            When you&apos;re logged in, topic and blog pages show a ☆ Bookmark
            button — your saves land here.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((it) => (
            <li key={it.key}>
              <Link
                href={it.href}
                className="flex items-center gap-3 rounded-xl border border-[var(--rule)] bg-white/70 px-4 py-3 hover:border-amber-400 hover:bg-amber-50"
              >
                <span className="shrink-0 rounded-full border border-[var(--rule)] px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  {it.tag}
                </span>
                <span className="min-w-0 truncate font-medium text-slate-800">
                  {it.label}
                </span>
                <span aria-hidden="true" className="ml-auto font-hand text-lg text-slate-400">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
