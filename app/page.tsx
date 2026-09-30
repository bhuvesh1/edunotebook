import Link from "next/link";
import { SITE_NAME } from "../lib/site";
import { getSubjectsFromDB, totalTopicsFromDB } from "../lib/content";
import { getDictionary, getLocale } from "../lib/i18n";

export default async function Home() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const home = dict.home;
  const blogs = dict.blogs;
  const isHi = locale === "hi";
  const subjects = await getSubjectsFromDB();
  const total = await totalTopicsFromDB();

  return (
    <div>
      {/* Notebook hero */}
      <section className="text-center py-10 sm:py-14">
        <p className="font-hand text-lg text-slate-500 mb-3">{home.heroKicker}</p>
        <h2 className="text-3xl sm:text-5xl font-bold notebook-underline inline-block pb-2">
          {home.heroTitle}
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-slate-700">
          {home.heroSub}{" "}
          <span className="font-semibold">
            {total.toLocaleString("en-IN")} {home.topicsSuffix}
          </span>{" "}
          {isHi ? (
            <>कुल {subjects.length} विषयों में।</>
          ) : (
            <>across {subjects.length} subjects.</>
          )}
        </p>
      </section>

      {/* Subject cards */}
      <section aria-label={home.subjectsHeading}>
        <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8">
          {home.subjectsHeading}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((s) => (
            <Link
              key={s.slug}
              href={`/subject/${s.slug}`}
              className="block rounded-lg border-2 border-[var(--rule)] bg-white/70 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <h4 className="font-hand text-2xl font-bold notebook-underline inline-block pb-1">
                {s.name}
              </h4>
              <p className="mt-3 text-slate-600 text-sm">
                {s.topicCount.toLocaleString("en-IN")} {home.topicsSuffix} ·{" "}
                {s.categoryCount} {isHi ? "अध्याय" : "chapters"}
              </p>
              <span className="mt-4 inline-block font-hand text-lg text-slate-800 underline decoration-[var(--margin-line)] underline-offset-4">
                {isHi ? (
                  <>{s.name} खोलें →</>
                ) : (
                  <>Open {s.name} →</>
                )}
              </span>
            </Link>
          ))}
          {/* 7th card spans nicely on large screens */}
          <Link
            href="/blogs"
            className="block rounded-lg border-2 border-dashed border-[var(--margin-line)] bg-white/40 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <h4 className="font-hand text-2xl font-bold">{blogs.title}</h4>
            <p className="mt-3 text-slate-600 text-sm">
              {isHi
                ? "हर टॉपिक के लिए SEO-रेडी व्याख्याएँ — 3,531 ब्लॉग प्रकाशित।"
                : "SEO-ready explainers for every topic — 3,531 blogs published."}
            </p>
            <span className="mt-4 inline-block font-hand text-lg text-slate-800 underline decoration-[var(--margin-line)] underline-offset-4">
              {isHi ? "ब्लॉग देखें →" : "Browse blogs →"}
            </span>
          </Link>
        </div>
      </section>

      <p className="sr-only">{SITE_NAME} home</p>
    </div>
  );
}
