// app/admin/subjects/page.tsx — subject list: icon, name, topic count,
// order, enabled toggle, edit, delete (+force), reorder up/down.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import {
  deleteSubject,
  toggleSubjectEnabled,
  moveSubject,
} from "./actions";
import { ConfirmAction, QuickAction } from "../ui";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";

export default async function SubjectsPage() {
  await requirePermission("content");
  const subjects = await prisma.subject.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
    include: {
      _count: { select: { categories: true } },
      categories: {
        select: {
          subcategories: { select: { _count: { select: { topics: true } } } },
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-hand text-3xl font-bold">Subjects</h1>
        <Link
          href="/admin/subjects/new"
          className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700"
        >
          ＋ New subject
        </Link>
      </div>

      {subjects.length === 0 ? (
        <p className="text-slate-500">No subjects yet. Create the first one.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
          <table className="w-full min-w-175">
            <thead>
              <tr>
                <th className={thCls}>Subject</th>
                <th className={thCls}>Topics</th>
                <th className={thCls}>Order</th>
                <th className={thCls}>Enabled</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => {
                const topics = s.categories.reduce(
                  (n, c) =>
                    n +
                    c.subcategories.reduce((m, sc) => m + sc._count.topics, 0),
                  0
                );
                return (
                  <tr key={s.id}>
                    <td className={tdCls}>
                      <span className="mr-2 text-xl">{s.icon ?? "📚"}</span>
                      <span className="font-bold">{s.name}</span>
                      <span className="ml-2 text-xs text-slate-400">/{s.slug}</span>
                      {s.description && (
                        <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>
                      )}
                    </td>
                    <td className={tdCls}>{topics.toLocaleString("en-IN")}</td>
                    <td className={tdCls}>
                      <span className="mr-2 font-mono">{s.order}</span>
                      <QuickAction
                        action={moveSubject.bind(null, s.id, "up")}
                        label="↑"
                        title="Move up"
                      />
                      <span className="mx-1" />
                      <QuickAction
                        action={moveSubject.bind(null, s.id, "down")}
                        label="↓"
                        title="Move down"
                      />
                    </td>
                    <td className={tdCls}>
                      <QuickAction
                        action={toggleSubjectEnabled.bind(null, s.id)}
                        label={s.enabled ? "✅ on" : "🚫 off"}
                        title={s.enabled ? "Disable subject" : "Enable subject"}
                      />
                    </td>
                    <td className={tdCls}>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/subjects/${s.id}`}
                          className="rounded-md border-2 border-[var(--rule)] bg-white px-2.5 py-1 text-xs font-bold hover:bg-slate-100"
                        >
                          Edit
                        </Link>
                        <ConfirmAction
                          action={deleteSubject.bind(null, s.id)}
                          label="Delete"
                          confirmMessage={
                            s._count.categories > 0
                              ? `Delete "${s.name}" and its ${s._count.categories} categories + all topics? Tick the force checkbox first if you really mean it.`
                              : `Delete subject "${s.name}"?`
                          }
                          extra={
                            s._count.categories > 0 ? (
                              <label className="mr-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  name="force"
                                  value="1"
                                  className="mr-1 align-middle"
                                />
                                force
                              </label>
                            ) : undefined
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">
        The public site nav is untouched — ordering/enabled changes apply here
        in the admin; the public nav will read them in a later phase.
      </p>
    </div>
  );
}
