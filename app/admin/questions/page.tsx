// app/admin/questions/page.tsx — read-only list of asked questions.
// (Answers arrive with the later AI phase.)
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";

export default async function QuestionsPage() {
  await requirePermission("content");
  const questions = await prisma.askedQuestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <div>
      <h1 className="font-hand mb-2 text-3xl font-bold">Questions</h1>
      <p className="mb-6 text-sm text-slate-500">
        Questions users asked via /ask. Answering them comes with the AI phase.
      </p>

      {questions.length === 0 ? (
        <p className="text-slate-500">No questions asked yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
          <table className="w-full min-w-175">
            <thead>
              <tr>
                <th className={thCls}>Question</th>
                <th className={thCls}>Subject</th>
                <th className={thCls}>User</th>
                <th className={thCls}>Date</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td className={tdCls} style={{ maxWidth: 480 }}>
                    <p className="whitespace-pre-wrap">{q.question}</p>
                  </td>
                  <td className={tdCls}>{q.subjectSlug ?? "—"}</td>
                  <td className={tdCls}>
                    <span className="font-semibold">{q.user.name ?? "—"}</span>
                    <p className="text-xs text-slate-500">{q.user.email}</p>
                  </td>
                  <td className={tdCls}>{q.createdAt.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
