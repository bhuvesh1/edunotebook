import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import SuggestionForm from "./SuggestionForm";

export const metadata = { title: "Suggestions" };

const STATUS_LABEL: Record<string, string> = {
  new: "Received",
  reviewed: "Reviewed",
  done: "Done",
};

export default async function SuggestionsPage() {
  const session = await auth();
  const userId = Number(session!.user.id);

  const suggestions = await prisma.suggestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h3 className="notebook-underline inline-block pb-1 text-2xl font-bold sm:text-3xl">
        Suggestions
      </h3>
      <p className="mt-2 text-slate-600">
        Tell us what to build next — topics, features, fixes.
      </p>

      <SuggestionForm />

      <h4 className="font-hand mt-8 text-2xl font-bold text-slate-800">
        Your past suggestions
      </h4>
      {suggestions.length === 0 ? (
        <p className="mt-3 text-slate-600">
          Nothing yet — your suggestions will show up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-[var(--rule)] bg-white/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-[var(--rule)] px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
                <time
                  dateTime={s.createdAt.toISOString()}
                  className="text-xs text-slate-500"
                >
                  {s.createdAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              <p className="mt-2 text-slate-800">{s.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
