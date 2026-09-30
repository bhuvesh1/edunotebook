// app/admin/categories/page.tsx — subject filter dropdown + category table.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { deleteCategory, moveCategory } from "./actions";
import { ConfirmAction, QuickAction } from "../ui";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  await requirePermission("content");
  const { subject: subjectSlug } = await searchParams;
  const subjects = await prisma.subject.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: { id: true, name: true, slug: true },
  });
  const activeSubject =
    subjects.find((s) => s.slug === subjectSlug) ?? null;

  const categories = await prisma.category.findMany({
    where: activeSubject ? { subjectId: activeSubject.id } : undefined,
    orderBy: [
      { subject: { order: "asc" } },
      { order: "asc" },
      { id: "asc" },
    ],
    include: {
      subject: { select: { name: true, slug: true } },
      subcategories: { select: { _count: { select: { topics: true } } } },
    },
    take: activeSubject ? undefined : 200,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-hand text-3xl font-bold">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700"
        >
          ＋ New category
        </Link>
      </div>

      <form method="GET" className="mb-4">
        <label className="mr-2 text-sm font-bold text-slate-600" htmlFor="subject-filter">
          Subject:
        </label>
        <select
          id="subject-filter"
          name="subject"
          defaultValue={activeSubject?.slug ?? ""}
          className="rounded-lg border-2 border-[var(--rule)] bg-white px-3 py-1.5 text-sm"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="ml-2 rounded-lg border-2 border-[var(--rule)] bg-white px-3 py-1.5 text-sm font-bold hover:bg-slate-100"
        >
          Filter
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="text-slate-500">No categories found.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
            <table className="w-full min-w-175">
              <thead>
                <tr>
                  <th className={thCls}>Category</th>
                  <th className={thCls}>Subject</th>
                  <th className={thCls}>Topics</th>
                  <th className={thCls}>Order</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const topics = c.subcategories.reduce(
                    (n, sc) => n + sc._count.topics,
                    0
                  );
                  return (
                    <tr key={c.id}>
                      <td className={tdCls}>
                        <span className="font-bold">{c.name}</span>
                        <span className="ml-2 text-xs text-slate-400">/{c.slug}</span>
                        {c.description && (
                          <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>
                        )}
                      </td>
                      <td className={tdCls}>{c.subject.name}</td>
                      <td className={tdCls}>{topics.toLocaleString("en-IN")}</td>
                      <td className={tdCls}>
                        <span className="mr-2 font-mono">{c.order}</span>
                        <QuickAction
                          action={moveCategory.bind(null, c.id, "up")}
                          label="↑"
                          title="Move up"
                        />
                        <span className="mx-1" />
                        <QuickAction
                          action={moveCategory.bind(null, c.id, "down")}
                          label="↓"
                          title="Move down"
                        />
                      </td>
                      <td className={tdCls}>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/categories/${c.id}`}
                            className="rounded-md border-2 border-[var(--rule)] bg-white px-2.5 py-1 text-xs font-bold hover:bg-slate-100"
                          >
                            Edit
                          </Link>
                          <ConfirmAction
                            action={deleteCategory.bind(null, c.id)}
                            label="Delete"
                            confirmMessage={
                              topics > 0
                                ? `Delete "${c.name}" and its ${topics} topics? Tick the force checkbox first if you really mean it.`
                                : `Delete category "${c.name}"?`
                            }
                            extra={
                              topics > 0 ? (
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
          {!activeSubject && (
            <p className="mt-3 text-xs text-slate-500">
              Showing the first 200 categories — pick a subject to see them all.
            </p>
          )}
        </>
      )}
    </div>
  );
}
