// app/admin/ai-studio/page.tsx — AI Content Studio dashboard.
// Provider status (configured? boolean only — the key is never shown),
// job counts by status, the review queue, and recent jobs.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { isProviderConfigured } from "@/lib/ai/provider";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  review: "In review",
  approved: "Approved",
  published: "Published",
  failed: "Failed",
};

const STATUS_BADGE: Record<string, string> = {
  queued: "bg-slate-200 text-slate-700",
  running: "bg-blue-100 text-blue-800",
  review: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  published: "bg-indigo-100 text-indigo-800",
  failed: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_BADGE[status] ?? "bg-slate-200 text-slate-700"}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function JobRow({ job }: { job: { id: number; kind: string; status: string; createdAt: Date } }) {
  return (
    <tr key={job.id}>
      <td className={tdCls}>
        <Link href={`/admin/ai-studio/${job.id}`} className="font-bold text-indigo-700 hover:underline">
          #{job.id}
        </Link>
      </td>
      <td className={tdCls}>{job.kind}</td>
      <td className={tdCls}>
        <StatusBadge status={job.status} />
      </td>
      <td className={`${tdCls} whitespace-nowrap text-slate-500`}>
        {job.createdAt.toLocaleString()}
      </td>
    </tr>
  );
}

export default async function AiStudioPage() {
  await requirePermission("ai");

  const configured = isProviderConfigured();

  const counts = await prisma.aiJob.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.status] = c._count.status;

  const reviewQueue = await prisma.aiJob.findMany({
    where: { status: "review" },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });

  const recent = await prisma.aiJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-hand text-2xl font-bold">AI Content Studio</h1>
        <Link
          href="/admin/ai-studio/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
        >
          + New AI job
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="rounded-xl border-2 border-[var(--rule)] bg-white/80 px-5 py-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Provider</p>
          <p className="mt-1 font-bold">
            {configured ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm text-emerald-800">
                Gemini configured
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm text-red-800">
                Not configured
              </span>
            )}
          </p>
          {!configured && (
            <p className="mt-2 max-w-xs text-xs text-slate-600">
              Jobs can be queued, but Run will fail honestly until{" "}
              <code className="rounded bg-slate-100 px-1">GEMINI_API_KEY</code> is
              set in the server environment.
            </p>
          )}
        </div>
        <div className="rounded-xl border-2 border-[var(--rule)] bg-white/80 px-5 py-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Jobs by status</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.keys(STATUS_LABEL).map((s) => (
              <span key={s} className="text-sm">
                <StatusBadge status={s} />{" "}
                <span className="font-bold">{countMap[s] ?? 0}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mb-3 font-hand text-xl font-bold">
        Review queue{" "}
        <span className="text-sm font-normal text-slate-500">
          ({reviewQueue.length} awaiting your review)
        </span>
      </h2>
      {reviewQueue.length === 0 ? (
        <p className="mb-8 rounded-xl border-2 border-dashed border-[var(--rule)] px-4 py-6 text-sm text-slate-500">
          No jobs waiting for review. Run a queued job from its detail page and
          it will appear here once generation finishes.
        </p>
      ) : (
        <table className="mb-8 w-full border-collapse">
          <thead>
            <tr>
              <th className={thCls}>Job</th>
              <th className={thCls}>Kind</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Created</th>
            </tr>
          </thead>
          <tbody>
            {reviewQueue.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mb-3 font-hand text-xl font-bold">Recent jobs</h2>
      {recent.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-[var(--rule)] px-4 py-6 text-sm text-slate-500">
          No AI jobs yet. Queue your first job with the button above.
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={thCls}>Job</th>
              <th className={thCls}>Kind</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Created</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
