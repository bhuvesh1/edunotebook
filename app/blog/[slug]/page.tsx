import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/db";
import { SITE_NAME, SITE_URL } from "../../../lib/site";
import { getLocale } from "../../../lib/i18n";
import { sanitizeBlogHtml } from "../../../lib/sanitize";
import BookmarkButton from "../../components/BookmarkButton";
import TrackView from "../../../components/TrackView";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      titleHi: true,
      excerpt: true,
      excerptHi: true,
    },
  });
  if (!post) return { title: "Blog post not found" };

  // Locale-aware metadata: Hindi title/excerpt when the reader's locale is
  // Hindi and Hindi content exists, otherwise English.
  const metaTitle =
    (locale === "hi" && post.titleHi) || post.title;
  const metaDesc =
    (locale === "hi" && post.excerptHi) || post.excerpt || post.title;

  const canonical = `/blog/${post.slug}`;
  return {
    title: metaTitle,
    description: metaDesc,
    alternates: { canonical },
    openGraph: {
      title: `${metaTitle} | ${SITE_NAME}`,
      description: metaDesc,
      type: "article",
      url: canonical,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary",
      title: `${metaTitle} | ${SITE_NAME}`,
      description: metaDesc,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "published") notFound();

  // Serve independent per-language blog content: Hindi fields when locale is Hindi
  // and Hindi content exists, otherwise English.
  const isHi = locale === "hi" && post.contentHtmlHi;
  const displayTitle = (isHi && post.titleHi) || post.title;
  const displayExcerpt = (isHi && post.excerptHi) || post.excerpt;
  const displayHtml = (isHi && post.contentHtmlHi) || post.contentHtml;

  // Related blogs: sibling topics from the same subcategory (real links).
  let related: { slug: string; title: string }[] = [];
  if (post.topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: post.topicId },
      include: {
        subcategory: { include: { topics: { select: { id: true } } } },
      },
    });
    if (topic) {
      const siblingIds = topic.subcategory.topics
        .map((t) => t.id)
        .filter((id) => id !== post.topicId);
      const siblings = await prisma.blogPost.findMany({
        where: {
          topicId: { in: siblingIds },
          status: "published",
        },
        select: { slug: true, title: true, titleHi: true },
        orderBy: { id: "asc" },
        take: 6,
      });
      // Locale-aware related titles: Hindi when the reader is on Hindi.
      related = siblings.map((s) => ({
        slug: s.slug,
        title: (locale === "hi" && s.titleHi) || s.title,
      }));
    }
  }

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: displayTitle,
    description: displayExcerpt ?? displayTitle,
    url: canonicalUrl,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  const topicHref =
    post.subjectSlug && post.topicSlug
      ? `/topic/${post.subjectSlug}/${post.topicSlug}`
      : null;

  return (
    <article className="max-w-3xl mx-auto">
      <TrackView
        subjectSlug={post.subjectSlug ?? "general"}
        kind="blog"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-6">
        <Link href="/blogs" className="hover:underline">
          Blogs
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="font-semibold text-slate-700">
          {displayTitle}
        </span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-bold notebook-underline inline-block pb-2">
        {displayTitle}
      </h1>
      <div className="mt-3">
        <BookmarkButton kind="blog" slug={post.slug} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <time dateTime={post.createdAt.toISOString()}>
          {post.createdAt.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
        {post.subjectSlug && (
          <Link
            href={`/blogs?subject=${post.subjectSlug}`}
            className="rounded-full border px-3 py-0.5 text-xs font-semibold hover:bg-slate-100"
          >
            {post.subjectSlug.charAt(0).toUpperCase() +
              post.subjectSlug.slice(1)}
          </Link>
        )}
        {topicHref && (
          <Link
            href={topicHref}
            className="font-hand text-base underline decoration-[var(--margin-line)] underline-offset-4 hover:text-slate-800"
          >
            Try the interactive 3D model →
          </Link>
        )}
      </div>

      {/* Per-language blog body: contentHtmlHi for Hindi locale, contentHtml otherwise.
          Generated independently per language (300-500 words each).
          Sanitized before render: only p/h2/ul/ol/li/strong survive. */}
      <div
        className="blog-body mt-8"
        dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(displayHtml) }}
      />

      {/* relatedPapers is empty for now — rendered only when non-empty. */}

      <section aria-labelledby="related-blogs" className="mt-12">
        <h2
          id="related-blogs"
          className="text-2xl font-bold notebook-underline inline-block pb-1"
        >
          Related blogs
        </h2>
        {related.length > 0 ? (
          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/blog/${r.slug}`}
                  className="block h-full rounded-lg border border-slate-200 bg-white/70 p-4 hover:border-[var(--margin-line)] hover:shadow-sm"
                >
                  <span className="font-semibold text-slate-800">
                    {r.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className="block mt-1 font-hand text-lg text-slate-500"
                  >
                    Read →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-slate-600">
            More blogs from this section are on their way.
          </p>
        )}
      </section>
    </article>
  );
}
