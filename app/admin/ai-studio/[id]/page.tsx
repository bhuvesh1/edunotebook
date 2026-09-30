// app/admin/ai-studio/[id]/page.tsx — job detail: fields, output/error,
// and the run → review → approve → publish lifecycle buttons.
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { ConfirmAction } from "../../ui";
import { runAiJob, approveAiJob, publishAiJob, deleteAiJob } from "./actions";

const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";
const labelCls = "w-36 shrink-0 font-bold text-slate-600";

function Hidden({ id }: { id: number }) {
  return <input type="hidden" name="id" value={id} />;
}

export default async function AiJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("ai");
  const { id } = await params;
  const job = await prisma.aiJob.findUnique({
    where: { id: Number(id) },
    include: { topic: { select: { id: true, name: true, slug: true } } },
  });
  if (!job) notFound();

  return (
    <div>
      <Link href="/admin/ai-studio" className="text-sm font-bold text-indigo-700 hover:underline">
        ← Back to AI Studio
      </Link>
      <h1 className="mt-2 font-hand text-2xl font-bold">AI job #{job.id}</h1>

      <table className="mt-4 w-full max-w-3xl border-collapse">
        <tbody>
          <tr>
            <td className={`${tdCls} ${labelCls}`}>Kind</td>
            <td className={tdCls}>{job.kind}</td>
          </tr>
          <tr>
            <td className={`${tdCls} ${labelCls}`}>Status</td>
            <td className={tdCls}>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
                {job.status}
              </span>
            </td>
          </tr>
          <tr>
            <td className={`${tdCls} ${labelCls}`}>Subject slug</td>
            <td className={tdCls}>{job.subjectSlug ?? "—"}</td>
          </tr>
          <tr>
            <td className={`${tdCls} ${labelCls}`}>Topic</td>
            <td className={tdCls}>
              {job.topic ? (
                <>
                  {job.topic.name} <span className="text-slate-500">(#{job.topic.id})</span>
                </>
              ) : (
                "—"
              )}
            </td>
          </tr>
          <tr>
            <td className={`${tdCls} ${labelCls}`}>Provider / model</td>
            <td className={tdCls}>
              {job.provider}
              {job.model ? ` / ${job.model}` : ""}
            </td>
          </tr>
          <tr>
            <td className={`${tdCls} ${labelCls}`}>Input</td>
            <td className={tdCls}>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">
                {job.input ?? "—"}
              </pre>
            </td>
          </tr>
        </tbody>
      </table>

      {job.error && (
        <div className="mt-4 max-w-3xl rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {job.error}
        </div>
      )}

      {job.output && (
        <div className="mt-4 max-w-3xl">
          <h2 className="mb-2 font-hand text-lg font-bold">Generated output</h2>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border-2 border-[var(--rule)] bg-white p-4 text-sm">
            {job.output}
          </pre>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {(job.status === "queued" || job.status === "failed") && (
          <ConfirmAction
            action={runAiJob}
            label={job.status === "failed" ? "↻ Retry run" : "▶ Run"}
            confirmMessage="Generate content for this job with the configured AI provider?"
            danger={false}
            title="Generate with the configured AI provider"
            extra={<Hidden id={job.id} />}
          />
        )}
        {job.status === "review" && (
          <ConfirmAction
            action={approveAiJob}
            label="✓ Approve"
            confirmMessage="Mark this output as approved?"
            danger={false}
            title="Mark output as approved"
            extra={<Hidden id={job.id} />}
          />
        )}
        {job.status === "approved" && (
          <ConfirmAction
            action={publishAiJob}
            label="⬆ Publish"
            confirmMessage={
              job.kind === "quiz" || job.kind === "translation"
                ? "Publish this job? Quiz/translation jobs have no auto-target — the output stays on this job for you to copy manually."
                : job.kind === "blog"
                  ? "Publish this blog job? This will create/update a published blog post for the linked topic."
                  : "Publish this topic-content job? This will overwrite the linked topic's description."
            }
            danger={false}
            title="Apply the publish step for this kind"
          extra={<Hidden id={job.id} />}
          />
        )}
        {(job.kind === "quiz" || job.kind === "translation") && job.status === "published" && (
          <p className="w-full text-xs text-slate-500">
            Quiz/translation jobs have no auto-publish target — the output above
            stays on this job record for you to copy where needed.
          </p>
        )}
        <ConfirmAction
          action={deleteAiJob}
          label="Delete job"
          confirmMessage="Delete this job record? Any published content it created stays live."
        extra={<Hidden id={job.id} />}
        />
      </div>
    </div>
  );
}
