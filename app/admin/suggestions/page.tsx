// app/admin/suggestions/page.tsx — user suggestions with mark reviewed/done.
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { setSuggestionStatus } from "./actions";
import { QuickAction } from "../ui";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";

const STATUS_CLS: Record<string, string> = {
  new: "bg-amber-100 text-amber-800",
  reviewed: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

export default async function SuggestionsPage() {
  await requirePermission("content");
  const suggestions = await prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <div>
      <h1 className="font-hand mb-6 text-3xl font-bold">Suggestions</h1>

      {suggestions.length === 0 ? (
        <p className="text-slate-500">No suggestions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
          <table className="w-full min-w-175">
            <thead>
              <tr>
                <th className={thCls}>Suggestion</th>
                <th className={thCls}>User</th>
                <th className={thCls}>Date</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => (
                <tr key={s.id}>
                  <td className={tdCls} style={{ maxWidth: 420 }}>
                    <p className="whitespace-pre-wrap">{s.text}</p>
                  </td>
                  <td className={tdCls}>
                    <span className="font-semibold">{s.user.name ?? "—"}</span>
                    <p className="text-xs text-slate-500">{s.user.email}</p>
                  </td>
                  <td className={tdCls}>{s.createdAt.toLocaleString("en-IN")}</td>
                  <td className={tdCls}>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        STATUS_CLS[s.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className={tdCls}>
                    <div className="flex flex-wrap gap-2">
                      {s.status === "new" && (
                        <QuickAction
                          action={setSuggestionStatus.bind(null, s.id, "reviewed")}
                          label="Mark reviewed"
                        />
                      )}
                      {s.status !== "done" && (
                        <QuickAction
                          action={setSuggestionStatus.bind(null, s.id, "done")}
                          label="Mark done"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
