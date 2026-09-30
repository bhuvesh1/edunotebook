// app/admin/seo-health/page.tsx — SEO Health Center: scan, triage, fix.
// Stat cards by kind, kind/status filters, 50-row pages, per-issue detail
// via <details>. Auto-fix is offered for orphan topics and missing excerpts;
// duplicates and broken links are fixed manually in the blog editor.
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  requireSeo,
  rescanAction,
  fixAction,
  ignoreAction,
  reopenAction,
} from "./actions";
import { QuickAction } from "../ui";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";

const PER_PAGE = 50;
const KINDS = ["orphan", "duplicate", "broken-link", "missing-meta"] as const;
const STATUSES = ["open", "ignored", "fixed"] as const;

const KIND_LABEL: Record<string, string> = {
  orphan: "Orphan topic",
  duplicate: "Duplicate title",
  "broken-link": "Broken link",
  "missing-meta": "Missing meta",
};

const KIND_BADGE: Record<string, string> = {
  orphan: "bg-amber-100 text-amber-800",
  duplicate: "bg-purple-100 text-purple-800",
  "broken-link": "bg-red-100 text-red-700",
  "missing-meta": "bg-blue-100 text-blue-800",
};

const STATUS_BADGE: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  ignored: "bg-slate-200 text-slate-600",
  fixed: "bg-emerald-100 text-emerald-800",
};

export default async function SeoHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; page?: string }>;
}) {
  await requireSeo();
  const sp = await searchParams;
  const kindFilter = (KINDS as readonly string[]).includes(sp.kind ?? "")
    ? sp.kind!
    : "all";
  const statusFilter = (STATUSES as readonly string[]).includes(sp.status ?? "")
    ? sp.status!
    : "open";
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where = {
    ...(kindFilter === "all" ? {} : { kind: kindFilter }),
    status: statusFilter,
  };

  const [openByKind, total, issues] = await Promise.all([
    prisma.seoIssue.groupBy({
      by: ["kind"],
      where: { status: "open" },
      _count: { _all: true },
    }),
    prisma.seoIssue.count({ where }),
    prisma.seoIssue.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (pageNum - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);
  const openCounts = new Map(openByKind.map((g) => [g.kind, g._count._all]));

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(pageNum, totalPages);
  const link = (p: number, kind = kindFilter, status = statusFilter) =>
    `/admin/seo-health?kind=${kind}&status=${status}&page=${p}`;

  const tab = (
    href: string,
    label: string,
    active: boolean,
    key: string
  ) => (
    <Link
      key={key}
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border-2 px-4 py-1 text-sm font-bold ${
        active
          ? "border-[var(--margin-line)] bg-white shadow-sm"
          : "border-[var(--rule)] hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-hand text-3xl font-bold">SEO Health</h1>
        <QuickAction
          action={rescanAction}
          label="⟳ Run scan"
          title="Scan all published topics and blogs for SEO issues"
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KINDS.map((kind) => (
          <div
            key={kind}
            className="rounded-xl border-2 border-[var(--rule)] bg-white/80 p-4 shadow-sm"
          >
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              {KIND_LABEL[kind]} · open
            </p>
            <p className="mt-1 text-3xl font-bold">
              {(openCounts.get(kind) ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tab(link(1, "all"), "All kinds", kindFilter === "all", "kind-all")}
        {KINDS.map((kind) =>
          tab(
            link(1, kind),
            KIND_LABEL[kind],
            kindFilter === kind,
            `kind-${kind}`
          )
        )}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((status) =>
          tab(
            link(1, kindFilter, status),
            status[0].toUpperCase() + status.slice(1),
            statusFilter === status,
            `status-${status}`
          )
        )}
      </div>

      <p className="mb-3 text-xs text-slate-500">
        {total.toLocaleString("en-IN")} issues · page {safePage} of{" "}
        {totalPages.toLocaleString("en-IN")}
      </p>

      {issues.length === 0 ? (
        <p className="text-slate-500">
          {total === 0 && statusFilter === "open"
            ? "No open issues. Run a scan to check the site."
            : "No issues in this view."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
          <table className="w-full min-w-175">
            <thead>
              <tr>
                <th className={thCls}>Kind</th>
                <th className={thCls}>Entity</th>
                <th className={thCls}>Ref</th>
                <th className={thCls}>Created</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td className={tdCls}>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap ${
                        KIND_BADGE[issue.kind] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {KIND_LABEL[issue.kind] ?? issue.kind}
                    </span>
                  </td>
                  <td className={tdCls}>{issue.entityType ?? "—"}</td>
                  <td className={tdCls}>
                    {issue.url ? (
                      <Link
                        href={issue.url}
                        className="font-mono text-xs font-bold text-blue-700 underline break-all"
                      >
                        {issue.ref ?? issue.url}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs">{issue.ref ?? "—"}</span>
                    )}
                    {issue.detail && (
                      <details className="mt-1 text-xs text-slate-600">
                        <summary className="cursor-pointer font-semibold text-slate-500">
                          Detail
                        </summary>
                        <p className="mt-1 max-w-80 break-words">{issue.detail}</p>
                      </details>
                    )}
                  </td>
                  <td className={tdCls}>
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      {issue.createdAt.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <br />
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        STATUS_BADGE[issue.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {issue.status}
                    </span>
                  </td>
                  <td className={tdCls}>
                    <div className="flex flex-wrap gap-2">
                      {issue.status === "open" ? (
                        <>
                          {issue.kind === "duplicate" ||
                          issue.kind === "broken-link" ? (
                            <Link
                              href="/admin/blogs"
                              className="rounded-md border-2 border-[var(--rule)] bg-white px-2.5 py-1 text-xs font-bold hover:bg-slate-100"
                              title={
                                issue.kind === "duplicate"
                                  ? "Edit one of the blogs to differentiate titles"
                                  : "Fix the link in the blog editor"
                              }
                            >
                              Fix in blog editor →
                            </Link>
                          ) : (
                            <QuickAction
                              action={fixAction.bind(null, issue.id)}
                              label="Fix"
                              title="Apply the automatic fix"
                            />
                          )}
                          <QuickAction
                            action={ignoreAction.bind(null, issue.id)}
                            label="Ignore"
                            title="Dismiss this issue"
                          />
                        </>
                      ) : (
                        <QuickAction
                          action={reopenAction.bind(null, issue.id)}
                          label="Reopen"
                          title="Move this issue back to open"
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

      {totalPages > 1 && (
        <nav aria-label="Issue pages" className="mt-6 flex items-center gap-2">
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
