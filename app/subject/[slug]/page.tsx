import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubjectDetail } from "../../../lib/content";
import { getSubjectsFromDB } from "../../../lib/content";
import { getSubjectMeta } from "../../../lib/subject-meta";
import { getDictionary, getLocale, tpick } from "../../../lib/i18n";
import { SubjectHero } from "../../components/heroes/SubjectHero";

interface SubjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const subjects = await getSubjectsFromDB();
  const slugs =
    subjects.length > 0
      ? subjects.map((s) => s.slug)
      : [
          "physics",
          "chemistry",
          "biology",
          "mathematics",
          "engineering",
          "mbbs",
          "dental",
        ];
  return slugs.map((slug) => ({ slug }));
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { slug } = await params;
  const subject = await getSubjectDetail(slug);
  if (!subject) notFound();

  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const t = dict.subject;
  const isHi = locale === "hi";
  // Hindi display name for the subject; falls back to the DB English name
  // (e.g. admin-added subjects with no hi.json entry).
  const displayName = tpick(dict, `subjects.${slug}`, subject.name);

  // Every seeded subject slug has an entry in lib/subject-meta.ts;
  // admin-added subjects fall back to a neutral accent tagline.
  const meta = getSubjectMeta(slug) ?? {
    tagline: `Open the ${subject.name} notebook — every topic, one page at a time.`,
    accent: "#23272f",
  };

  const topicCount = subject.categories.reduce(
    (acc, c) =>
      acc + c.subcategories.reduce((a, sc) => a + sc.topics.length, 0),
    0
  );

  return (
    <div>
      {/* Hero + tagline section */}
      <section
        aria-label={isHi ? `${displayName} परिचय` : `${subject.name} introduction`}
        className="grid gap-6 lg:grid-cols-5 lg:gap-8 items-center pt-2 pb-10"
      >
        <div className="lg:col-span-3">
          <SubjectHero slug={slug} />
        </div>
        <div className="lg:col-span-2 text-center lg:text-left">
          <p className="font-hand text-sm sm:text-base text-slate-500 tracking-wide mb-2">
            {isHi ? "विषय नोटबुक" : "Subject notebook"}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold notebook-underline inline-block pb-2">
            {displayName}
          </h2>
          <p className="mt-4 font-hand text-lg sm:text-xl text-slate-700 italic leading-relaxed">
            “{meta.tagline}”
          </p>
          <p className="mt-4 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">
              {topicCount.toLocaleString("en-IN")}
            </span>{" "}
            {isHi ? "टॉपिक" : "topics"} ·{" "}
            <span className="font-semibold text-slate-700">
              {subject.categories.length}
            </span>{" "}
            {isHi ? t.categoriesLabel : t.categoriesLabel.toLowerCase()}
          </p>
          <span
            aria-hidden="true"
            className="mt-5 inline-block h-1.5 w-24 rounded-full"
            style={{ backgroundColor: meta.accent }}
          />
        </div>
      </section>

      {/* Centered topics heading */}
      <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8">
        {isHi ? `${displayName} ${t.topicsHeading}` : `${t.topicsHeading} ${subject.name}`}
      </h3>

      {/* Categories → subcategories → topic links, notebook-styled */}
      <div className="space-y-12">
        {subject.categories.map((category, ci) => (
          <section
            key={`${category.name}-${ci}`}
            aria-label={category.name}
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="font-hand text-sm font-bold text-white bg-[var(--margin-line)] rounded-full px-3 py-1 -rotate-2 shadow-sm shrink-0">
                {isHi ? `अ. ${ci + 1}` : `Ch. ${ci + 1}`}
              </span>
              <h4 className="font-hand text-xl sm:text-2xl font-bold notebook-underline pb-1">
                {category.name}
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {category.subcategories.map((sc) => (
                <div
                  key={`${category.name}-${sc.name}`}
                  className="relative rounded-lg border border-[var(--rule)] bg-white/70 p-4 pl-5 shadow-sm"
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-[var(--margin-line)]"
                  />
                  <h5 className="font-hand text-lg font-semibold text-slate-800 mb-1">
                    {sc.name}
                  </h5>
                  <p className="text-xs text-slate-500 mb-2">
                    {sc.topics.length}{" "}
                    {isHi
                      ? "टॉपिक"
                      : sc.topics.length === 1
                        ? "topic"
                        : "topics"}
                  </p>
                  <ul className="space-y-1.5">
                    {sc.topics.map((topic) => (
                      <li key={topic.slug}>
                        <Link
                          href={`/topic/${slug}/${topic.slug}`}
                          className="topic-link text-[15px] text-slate-700 rounded px-1 -mx-1"
                        >
                          {topic.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
