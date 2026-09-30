import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicDetail } from "../../../../lib/content";
import { effectiveSim } from "../../../../lib/simulations/registry";
import { getTopicContent } from "../../../../lib/topic-content";
import { getModelForTopic } from "../../../../lib/models";
import { SITE_NAME } from "../../../../lib/site";
import { SimSection } from "../../../components/sims/SimSection";
import { SimErrorBoundary } from "../../../components/sims/SimErrorBoundary";
// Lazy wrapper (client component): the real UploadedModelViewer statically
// imports @react-three/fiber, so importing it here would bundle three.js into
// EVERY topic page — including mathematics, which must never load 3D.
import { LazyUploadedModelViewer } from "../../../components/sims/LazyUploadedModelViewer";
import { TopicAccordion } from "../../../components/topic/TopicAccordion";
import BookmarkButton from "../../../components/BookmarkButton";
import TrackView from "../../../../components/TrackView";
import HindiFallbackNotice from "../../../../components/HindiFallbackNotice";

interface TopicPageProps {
  params: Promise<{ subject: string; topicSlug: string }>;
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { subject: subjectSlug, topicSlug } = await params;
  const topic = await getTopicDetail(subjectSlug, topicSlug);
  if (!topic) return { title: "Topic not found" };
  // Mathematics never has 3D — don't advertise it in the meta description.
  const fallbackDesc =
    subjectSlug === "mathematics"
      ? `Worked example, theory, key equations and quiz for ${topic.name} — ${SITE_NAME}.`
      : `Interactive 3D model, worked example, theory, key equations and quiz for ${topic.name} — ${SITE_NAME}.`;
  return {
    title: `${topic.name} | ${topic.subjectName}`,
    description: topic.description ?? fallbackDesc,
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { subject: subjectSlug, topicSlug } = await params;
  const topic = await getTopicDetail(subjectSlug, topicSlug);
  if (!topic) notFound();

  // Maths rule: mathematics topics render NO 3D viewport at all —
  // only the Example / Theory / Equations / Quiz accordion.
  // DB override (admin): simKey "none" forces no 3D, a registry
  // key forces that sim; null/undefined falls back to auto matching.
  const isMaths = subjectSlug === "mathematics";
  const simKey = isMaths ? null : effectiveSim(topic.name, topic.simKey, topic.categoryName);
  const content = await getTopicContent(simKey, topic.id);

  // 3D Studio hook: an admin-mapped uploaded model takes precedence over the
  // registry sim. Mathematics never renders 3D; taxonomy-fallback topics
  // (id null) have no DB mapping.
  const uploadedModel =
    !isMaths && topic.id != null
      ? await getModelForTopic(topic.id)
      : null;

  // Related topics: siblings from the same subcategory (real links).
  const related = topic.siblings;

  return (
    <div>
      <TrackView subjectSlug={subjectSlug} topicSlug={topicSlug} kind="topic" />
      {/* Breadcrumb: Home / Subject / Category / Topic */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/subject/${subjectSlug}`} className="hover:underline">
              {topic.subjectName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-400">{topic.categoryName}</li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-slate-700">
            {topic.name}
          </li>
        </ol>
      </nav>

      {/* Only warn Hindi readers when Hindi study content is genuinely missing —
          the accordion serves theoryHi/exampleHi once imported. */}
      {!content.theoryHi && <HindiFallbackNotice />}

      <h2 className="notebook-underline inline-block pb-2 text-3xl font-bold sm:text-4xl">
        {topic.name}
      </h2>
      <div className="mt-3">
        <BookmarkButton kind="topic" slug={`${subjectSlug}/${topicSlug}`} />
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {topic.subcategoryName} · {topic.subjectName}
      </p>

      {/* 3D viewport (skipped entirely for mathematics) */}
      <div className="mt-8">
        {uploadedModel ? (
          <SimErrorBoundary>
            <LazyUploadedModelViewer url={uploadedModel.url} />
          </SimErrorBoundary>
        ) : simKey ? (
          <SimSection simKey={simKey} topicSlug={topicSlug} />
        ) : null}
      </div>

      {/* Accordion study sections */}
      <TopicAccordion content={content} />

      {/* Related topics */}
      {related.length > 0 && (
        <div className="mt-10">
          <h3 className="font-hand text-2xl font-bold text-slate-800">
            Related topics
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {related.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/topic/${subjectSlug}/${t.slug}`}
                  className="block rounded-lg border border-[var(--rule)] bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-amber-400 hover:bg-amber-50"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-8 text-center">
        <Link
          href={`/subject/${subjectSlug}`}
          className="font-hand text-lg underline decoration-[var(--margin-line)] underline-offset-4"
        >
          ← Back to topics for {topic.subjectName}
        </Link>
      </p>
    </div>
  );
}
