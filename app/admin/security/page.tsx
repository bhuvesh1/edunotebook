// app/admin/security/page.tsx — admin-only security center:
// 1) audit log viewer with filters + pagination,
// 2) staff role management (last-admin protected),
// 3) session revocation.
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePermission, STAFF_ROLES, ROLE_LABELS } from "@/lib/admin";
import { changeStaffRole, revokeSession } from "./actions";
import { AdminForm, QuickAction, Field, inputCls } from "../ui";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";
const PER_PAGE = 100;

function qs(params: Record<string, string | undefined>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) s.set(k, v);
  return s.toString() ? `?${s.toString()}` : "?";
}

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    actor?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  await requirePermission("security");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const actor = (sp.actor ?? "").trim();
  const from = (sp.from ?? "").trim();
  const to = (sp.to ?? "").trim();
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.AuditLogWhereInput = {};
  if (q) where.action = { contains: q };
  if (actor) where.actorEmail = { contains: actor };
  const fromDate = from ? new Date(`${from}T00:00:00`) : null;
  const toDate = to ? new Date(`${to}T00:00:00`) : null;
  if ((fromDate && !Number.isNaN(+fromDate)) || (toDate && !Number.isNaN(+toDate))) {
    where.createdAt = {};
    if (fromDate && !Number.isNaN(+fromDate)) where.createdAt.gte = fromDate;
    if (toDate && !Number.isNaN(+toDate)) {
      const end = new Date(toDate);
      end.setDate(end.getDate() + 1);
      where.createdAt.lt = end;
    }
  }

  const [total, logs, staff, sessions] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (pageNum - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.user.findMany({
      where: { role: { not: "user" } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, email: true, name: true, role: true, updatedAt: true },
    }),
    prisma.session.findMany({
      orderBy: { expires: "desc" },
      take: 100,
      include: { user: { select: { email: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(pageNum, totalPages);
  const pageLink = (p: number) =>
    `/admin/security${qs({ q, actor, from, to, page: String(p) })}`;

  return (
    <div className="space-y-10">
      <h1 className="font-hand mb-6 text-3xl font-bold">Security</h1>

      {/* ——— Audit log ——— */}
      <section>
        <h2 className="mb-3 text-xl font-bold">Audit log</h2>
        <form
          method="get"
          action="/admin/security"
          className="mb-4 flex flex-wrap items-end gap-3"
        >
          <label className="text-xs font-bold text-slate-600">
            Action contains
            <input name="q" defaultValue={q} className={`${inputCls} mt-1`} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Actor email contains
            <input name="actor" defaultValue={actor} className={`${inputCls} mt-1`} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            From
            <input type="date" name="from" defaultValue={from} className={`${inputCls} mt-1`} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            To
            <input type="date" name="to" defaultValue={to} className={`${inputCls} mt-1`} />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
          >
            Filter
          </button>
          <Link
            href="/admin/security"
            className="rounded-lg border-2 border-[var(--rule)] bg-white px-4 py-1.5 text-sm font-bold hover:bg-slate-100"
          >
            Clear
          </Link>
        </form>

        <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
          <table className="w-full min-w-220">
            <thead>
              <tr>
                <th className={thCls}>Time</th>
                <th className={thCls}>Actor</th>
                <th className={thCls}>Action</th>
                <th className={thCls}>Entity</th>
                <th className={thCls}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className={`${tdCls} whitespace-nowrap text-xs text-slate-500`}>
                    {l.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td className={tdCls}>{l.actorEmail ?? "—"}</td>
                  <td className={tdCls}>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold">
                      {l.action}
                    </code>
                  </td>
                  <td className={tdCls}>
                    {l.entityType ? (
                      <span className="text-xs">
                        {l.entityType}
                        {l.entityId ? ` #${l.entityId}` : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={tdCls}>
                    {l.detail ? (
                      <details>
                        <summary className="cursor-pointer text-xs font-bold text-slate-600">
                          view
                        </summary>
                        <pre className="mt-1 max-h-40 max-w-80 overflow-auto rounded bg-slate-50 p-2 text-xs">
                          {l.detail}
                        </pre>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">No audit entries match.</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-sm font-bold">
          <span>
            Page {safePage} of {totalPages} ({total} entries)
          </span>
          {safePage > 1 && <Link href={pageLink(safePage - 1)}>← Prev</Link>}
          {safePage < totalPages && <Link href={pageLink(safePage + 1)}>Next →</Link>}
        </div>
      </section>

      {/* ——— Staff roles ——— */}
      <section>
        <h2 className="mb-3 text-xl font-bold">Staff roles</h2>
        <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
          <table className="w-full min-w-200">
            <thead>
              <tr>
                <th className={thCls}>User</th>
                <th className={thCls}>Role</th>
                <th className={thCls}>Updated</th>
                <th className={thCls}>Change role</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id}>
                  <td className={tdCls}>
                    <span className="font-bold">{u.name ?? "—"}</span>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className={tdCls}>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className={tdCls}>
                    {u.updatedAt.toISOString().slice(0, 10)}
                  </td>
                  <td className={tdCls}>
                    <AdminForm
                      action={changeStaffRole.bind(null, u.id)}
                      submitLabel="Save"
                      cancelHref="/admin/security"
                    >
                      <Field label="Role" name={`role-${u.id}`}>
                        <select
                          name="role"
                          defaultValue={u.role}
                          className={inputCls}
                        >
                          {STAFF_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </AdminForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ——— Sessions ——— */}
      <section>
        <h2 className="mb-3 text-xl font-bold">Active sessions (latest 100)</h2>
        <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
          <table className="w-full min-w-180">
            <thead>
              <tr>
                <th className={thCls}>User</th>
                <th className={thCls}>Expires</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className={tdCls}>
                    {s.user.email}{" "}
                    <span className="text-xs text-slate-500">#{s.userId}</span>
                  </td>
                  <td className={`${tdCls} whitespace-nowrap text-xs text-slate-500`}>
                    {s.expires.toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td className={tdCls}>
                    <QuickAction
                      action={revokeSession.bind(null, s.id)}
                      label="Revoke"
                      title={`Revoke session for ${s.user.email}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sessions.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">No sessions.</p>
        )}
      </section>
    </div>
  );
}
