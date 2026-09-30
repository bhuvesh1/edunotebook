import { getSubjects } from "@/lib/taxonomy";
import { getQuizPrefs, getRecentAttempts } from "./actions";
import QuizPrefsForm from "./QuizPrefsForm";
import QuizClient from "./QuizClient";

export const metadata = { title: "Daily Quiz" };

export default async function QuizPage() {
  const subjects = getSubjects().map((s) => ({ name: s.name, slug: s.slug }));
  const prefs = await getQuizPrefs();
  const attempts = await getRecentAttempts(10);

  return (
    <div>
      <h3 className="notebook-underline inline-block pb-1 text-2xl font-bold sm:text-3xl">
        Daily quiz
      </h3>
      <p className="mt-2 text-slate-600">
        A fresh 10-question quiz every day, drawn from your chosen subjects.
      </p>

      <div className="mt-5">
        <QuizPrefsForm subjects={subjects} initial={prefs} />
      </div>

      <QuizClient />

      {attempts.length > 0 && (
        <div className="mt-10">
          <h4 className="font-hand text-2xl font-bold text-slate-800">
            Your recent attempts
          </h4>
          <ul className="mt-3 divide-y divide-[var(--rule)] rounded-xl border border-[var(--rule)] bg-white/70">
            {attempts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-slate-500">{a.date}</span>
                <span className="font-semibold text-slate-800">
                  {a.score} / {a.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
