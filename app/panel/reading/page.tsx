import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSubjectBySlug, getTopicBySlug } from "@/lib/taxonomy";

export const metadata = { title: "Reading stats" };

// Built from ReadingEvent rows recorded by <TrackView /> on topic/blog pages.
export default async function ReadingPage() {
  const session = await auth();
  const userId = Number(session!.user.id);

  const bySubject = await prisma.readingEvent.groupBy({
    by: ["subjectSlug"],
    where: { userId },
    _count: { _all: true },
    orderBy: { _count: { subjectSlug: "desc" } },
  });

  const byTopic = await prisma.readingEvent.groupBy({
    by: ["subjectSlug", "topicSlug"],
    where: { userId, kind: "topic", topicSlug: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { subjectSlug: "desc" } },
    take: 10,
  });

  const maxSubject = Math.max(1, ...bySubject.map((r) => r._count._all));

  return (
    <div>
      <h3 className="notebook-underline inline-block pb-1 text-2xl font-bold sm:text-3xl">
        Reading
      </h3>
      <p className="mt-2 text-slate-600">
        What you&apos;ve been reading, from your topic and blog visits.
      </p>

      {bySubject.length === 0 ? (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-[var(--rule)] bg-white/60 p-6 text-center">
          <p className="font-hand text-2xl font-bold text-slate-800">
            No reading activity yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            Visit some topics or blogs and your most-read subjects will appear
            here.
          </p>
        </div>
      ) : (
        <>
          <h4 className="font-hand mt-8 text-2xl font-bold text-slate-800">
            Most-read subjects
          </h4>
          <ul className="mt-4 space-y-3">
            {bySubject.map((r) => {
              const name =
                getSubjectBySlug(r.subjectSlug)?.subject ?? r.subjectSlug;
              const pct = Math.round((r._count._all / maxSubject) * 100);
              return (
                <li key={r.subjectSlug}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{name}</span>
                    <span className="text-slate-500">
                      {r._count._all} {r._count._all === 1 ? "view" : "views"}
                    </span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[var(--margin-line)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {byTopic.length > 0 && (
            <>
              <h4 className="font-hand mt-8 text-2xl font-bold text-slate-800">
                Most-read topics
              </h4>
              <ul className="mt-4 divide-y divide-[var(--rule)] rounded-xl border border-[var(--rule)] bg-white/70">
                {byTopic
                  .filter((r) => r.topicSlug)
                  .map((r) => {
                    const topic = getTopicBySlug(
                      r.subjectSlug,
                      r.topicSlug as string
                    );
                    const label = topic
                      ? `${topic.name} (${getSubjectBySlug(r.subjectSlug)?.subject ?? r.subjectSlug})`
                      : `${r.topicSlug}`;
                    return (
                      <li
                        key={`${r.subjectSlug}/${r.topicSlug}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                      >
                        <span className="min-w-0 truncate font-medium text-slate-800">
                          {label}
                        </span>
                        <span className="shrink-0 text-slate-500">
                          {r._count._all} {r._count._all === 1 ? "view" : "views"}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
