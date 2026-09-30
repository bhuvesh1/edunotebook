import { prisma } from "@/lib/db";

export const metadata = { title: "Leaderboard" };

// Visible to every logged-in user (proxy.ts guarantees the session).
export default async function LeaderboardPage() {
  const rows = await prisma.quizAttempt.groupBy({
    by: ["userId"],
    _sum: { score: true },
    _count: { _all: true },
    orderBy: { _sum: { score: "desc" } },
    take: 20,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div>
      <h3 className="notebook-underline inline-block pb-1 text-2xl font-bold sm:text-3xl">
        Leaderboard
      </h3>
      <p className="mt-2 text-slate-600">
        Top learners by total correct quiz answers.
      </p>

      {rows.length === 0 ? (
        <p className="mt-5 text-slate-600">
          No quiz attempts yet — take the daily quiz to claim the top spot!
        </p>
      ) : (
        <ol className="mt-5 divide-y divide-[var(--rule)] rounded-2xl border-2 border-[var(--rule)] bg-white/70">
          {rows.map((r, i) => (
            <li
              key={r.userId}
              className="flex items-center gap-4 px-4 py-3 sm:px-5"
            >
              <span
                className={`font-hand w-8 text-center text-2xl font-bold ${
                  i === 0
                    ? "text-amber-600"
                    : i === 1
                      ? "text-slate-500"
                      : i === 2
                        ? "text-amber-800"
                        : "text-slate-400"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                {nameById.get(r.userId) ?? "Learner"}
              </span>
              <span className="text-sm text-slate-500">
                {r._count._all} {r._count._all === 1 ? "quiz" : "quizzes"}
              </span>
              <span className="font-hand text-xl font-bold text-slate-800">
                {r._sum.score ?? 0} ✓
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
