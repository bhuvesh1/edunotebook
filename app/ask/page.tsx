import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSubjects } from "@/lib/taxonomy";
import AskForm from "./AskForm";

export const metadata = { title: "Ask Me Anything" };

export default async function AskPage() {
  // Belt-and-suspenders: proxy.ts already redirects logged-out users here.
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/ask");

  const userId = Number(session.user.id);
  const subjects = getSubjects().map((s) => ({ name: s.name, slug: s.slug }));
  const subjectNames = new Map(subjects.map((s) => [s.slug, s.name]));

  const questions = await prisma.askedQuestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="notebook-underline inline-block pb-2 text-3xl font-bold sm:text-4xl">
        Ask Me Anything
      </h2>
      <p className="mt-3 text-slate-600">
        Ask anything about your subjects. Your questions are saved to your
        account.
      </p>

      <AskForm subjects={subjects} />

      <h3 className="font-hand mt-10 text-2xl font-bold text-slate-800">
        Your questions
      </h3>
      {questions.length === 0 ? (
        <p className="mt-3 text-slate-600">
          You haven&apos;t asked anything yet — your questions will appear here.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {questions.map((q) => (
            <li
              key={q.id}
              className="rounded-xl border border-[var(--rule)] bg-white/70 p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {q.subjectSlug && subjectNames.has(q.subjectSlug) && (
                  <span className="rounded-full border border-[var(--rule)] px-2.5 py-0.5 font-semibold">
                    {subjectNames.get(q.subjectSlug)}
                  </span>
                )}
                <time dateTime={q.createdAt.toISOString()}>
                  {q.createdAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              <p className="mt-2 font-medium text-slate-800">{q.question}</p>
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm italic text-slate-600">
                AI answers will be enabled soon (coming in a later update).
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
