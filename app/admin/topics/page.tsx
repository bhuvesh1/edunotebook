// app/admin/topics/page.tsx — server-side filters (subject, category, ?q=
// search) + pagination, 3D + status badges, edit/delete.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import {
  effectiveSim,
  isSimKey,
  SIM_META,
} from "@/lib/simulations/registry";
import { deleteTopic, toggleTopicStatus } from "./actions";
import { ConfirmAction, QuickAction } from "../ui";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";

const PER_PAGE = 50;

function SimBadge({ name, simKey }: { name: string; simKey: string | null }) {
  const eff = effectiveSim(name, simKey);
  if (simKey === "none") {
    return (
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-500">
        3D: none
      </span>
    );
  }
  if (simKey && isSimKey(simKey)) {
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
        3D: {SIM_META[simKey].title}
      </span>
    );
  }
  if (eff) {
    return (
      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800" title="Auto-matched from the topic name">
        auto→{eff}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-400">
      3D soon
    </span>
  );
}

function pageLink(
  base: Record<string, string | undefined>,
  page: number
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
  p.set("page", String(page));
  return `/admin/topics?${p.toString()}`;
}

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{
    subject?: string;
    category?: string;
    q?: string;
    page?: string;
  }>;
}) {
  await requirePermission("content");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const subjectSlug = sp.subject || undefined;
  const categoryId = sp.category ? parseInt(sp.category, 10) : undefined;

  const subjects = await prisma.subject.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: { id: true, name: true, slug: true },
  });
  const activeSubject = subjects.find((s) => s.slug === subjectSlug) ?? null;

  const categories = activeSubject
    ? await prisma.category.findMany({
        where: { subjectId: activeSubject.id },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: { id: true, name: true },
      })
    : [];

  const where = {
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    subcategory: {
      ...(categoryId && Number.isFinite(categoryId)
        ? { categoryId }
        : {}),
      ...(activeSubject
        ? { category: { subjectId: activeSubject.id } }
        : {}),
    },
  };

  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const [total, topics] = await Promise.all([
    prisma.topic.count({ where }),
    prisma.topic.findMany({
      where,
      orderBy: { id: "asc" },
      skip: (pageNum - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        subcategory: {
          select: {
            name: true,
            category: {
              select: { name: true, subject: { select: { name: true, slug: true } } },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(pageNum, totalPages);
  const filterBase: Record<string, string | undefined> = {
    subject: subjectSlug,
    category: sp.category,
    q: q || undefined,
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-hand text-3xl font-bold">Topics</h1>
        <Link
          href="/admin/topics/new"
          className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700"
        >
          ＋ New topic
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500" htmlFor="f-subject">
            Subject
          </label>
          <select
            id="f-subject"
            name="subject"
            defaultValue={subjectSlug ?? ""}
            className="rounded-lg border-2 border-[var(--rule)] bg-white px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500" htmlFor="f-category">
            Category
          </label>
          <select
            id="f-category"
            name="category"
            defaultValue={sp.category ?? ""}
            disabled={!activeSubject}
            className="rounded-lg border-2 border-[var(--rule)] bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500" htmlFor="f-q">
            Search
          </label>
          <input
            id="f-q"
            name="q"
            defaultValue={q}
            placeholder="topic title…"
            className="rounded-lg border-2 border-[var(--rule)] bg-white px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border-2 border-[var(--rule)] bg-white px-4 py-1.5 text-sm font-bold hover:bg-slate-100"
        >
          Filter
        </button>
        {(q || subjectSlug || sp.category) && (
          <Link href="/admin/topics" className="text-sm font-bold text-slate-500 hover:underline">
            Clear
          </Link>
        )}
      </form>

      <p className="mb-3 text-xs text-slate-500">
        {total.toLocaleString("en-IN")} topics · page {safePage} of{" "}
        {totalPages.toLocaleString("en-IN")}
      </p>

      {topics.length === 0 ? (
        <p className="text-slate-500">No topics match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
          <table className="w-full min-w-200">
            <thead>
              <tr>
                <th className={thCls}>Title</th>
                <th className={thCls}>Subject / Category</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>3D</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.id}>
                  <td className={tdCls}>
                    <span className="font-bold">{t.name}</span>
                    <span className="ml-2 text-xs text-slate-400">#{t.id}</span>
                  </td>
                  <td className={tdCls}>
                    {t.subcategory.category.subject.name}
                    <span className="text-slate-400"> / </span>
                    {t.subcategory.category.name}
                  </td>
                  <td className={tdCls}>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        t.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className={tdCls}>
                    <SimBadge name={t.name} simKey={t.simKey} />
                  </td>
                  <td className={tdCls}>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/topics/${t.id}`}
                        className="rounded-md border-2 border-[var(--rule)] bg-white px-2.5 py-1 text-xs font-bold hover:bg-slate-100"
                      >
                        Edit
                      </Link>
                      <QuickAction
                        action={toggleTopicStatus.bind(null, t.id)}
                        label={t.status === "published" ? "→ draft" : "→ publish"}
                        title="Toggle published/draft"
                      />
                      <ConfirmAction
                        action={deleteTopic.bind(null, t.id)}
                        label="Delete"
                        confirmMessage={`Delete topic "${t.name}"? (Its blog post survives.)`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Topic pages" className="mt-6 flex flex-wrap items-center gap-2">
          {safePage > 1 && (
            <Link
              href={pageLink(filterBase, safePage - 1)}
              className="rounded-lg border-2 border-[var(--rule)] px-3 py-1.5 text-sm font-bold hover:bg-slate-100"
            >
              ← Prev
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Page {safePage} of {totalPages.toLocaleString("en-IN")}
          </span>
          {safePage < totalPages && (
            <Link
              href={pageLink(filterBase, safePage + 1)}
              className="rounded-lg border-2 border-[var(--rule)] px-3 py-1.5 text-sm font-bold hover:bg-slate-100"
            >
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
