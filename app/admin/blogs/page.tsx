// app/admin/blogs/page.tsx — status filter, publish/draft toggle, delete.
// Content regeneration comes in a later phase.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { toggleBlogStatus, deleteBlog } from "./actions";
import { ConfirmAction, QuickAction } from "../ui";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";

const PER_PAGE = 50;

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requirePermission("content");
  const sp = await searchParams;
  const statusFilter = sp.status === "draft" ? "draft" : sp.status === "all" ? "all" : "published";
  const where = statusFilter === "all" ? {} : { status: statusFilter };
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [total, blogs] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy: { id: "asc" },
      skip: (pageNum - 1) * PER_PAGE,
      take: PER_PAGE,
      select: { id: true, slug: true, title: true, subjectSlug: true, status: true, source: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(pageNum, totalPages);
  const link = (p: number) =>
    `/admin/blogs?status=${statusFilter}&page=${p}`;

  const tab = (value: string, label: string) => (
    <Link
      key={value}
      href={`/admin/blogs?status=${value}`}
      aria-current={statusFilter === value ? "page" : undefined}
      className={`rounded-full border-2 px-4 py-1 text-sm font-bold ${
        statusFilter === value
          ? "border-[var(--margin-line)] bg-white shadow-sm"
          : "border-[var(--rule)] hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <h1 className="font-hand mb-6 text-3xl font-bold">Blogs</h1>

      <div className="mb-4 flex gap-2">
        {tab("published", "Published")}
        {tab("draft", "Drafts")}
        {tab("all", "All")}
      </div>

      <p className="mb-3 text-xs text-slate-500">
        {total.toLocaleString("en-IN")} posts · page {safePage} of{" "}
        {totalPages.toLocaleString("en-IN")}
      </p>

      {blogs.length === 0 ? (
        <p className="text-slate-500">No blog posts in this view.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
          <table className="w-full min-w-175">
            <thead>
              <tr>
                <th className={thCls}>Title</th>
                <th className={thCls}>Subject</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((b) => (
                <tr key={b.id}>
                  <td className={tdCls}>
                    <span className="font-bold">{b.title}</span>
                    <span className="ml-2 text-xs text-slate-400">/{b.slug}</span>
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      {b.source}
                    </span>
                  </td>
                  <td className={tdCls}>{b.subjectSlug ?? "—"}</td>
                  <td className={tdCls}>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        b.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className={tdCls}>
                    <div className="flex flex-wrap gap-2">
                      <QuickAction
                        action={toggleBlogStatus.bind(null, b.id)}
                        label={b.status === "published" ? "→ draft" : "→ publish"}
                        title="Toggle published/draft"
                      />
                      <ConfirmAction
                        action={deleteBlog.bind(null, b.id)}
                        label="Delete"
                        confirmMessage={`Delete blog post "${b.title}"?`}
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
        <nav aria-label="Blog pages" className="mt-6 flex items-center gap-2">
          {safePage > 1 && (
            <Link
              href={link(safePage - 1)}
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
              href={link(safePage + 1)}
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
