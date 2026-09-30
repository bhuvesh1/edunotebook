// app/admin/users/page.tsx — user table: ban/unban, role, delete (guarded).
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { toggleBan, changeRole, deleteUser } from "./actions";
import { ConfirmAction, QuickAction } from "../ui";

const thCls =
  "border-b-2 border-[var(--rule)] px-3 py-2 text-left text-xs font-bold tracking-wide text-slate-500 uppercase";
const tdCls = "border-b border-[var(--rule)] px-3 py-2 align-top text-sm";

export default async function UsersPage() {
  await requirePermission("users");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isBanned: true,
      createdAt: true,
      _count: { select: { quizAttempts: true } },
    },
  });

  return (
    <div>
      <h1 className="font-hand mb-6 text-3xl font-bold">Users</h1>

      {users.length === 0 ? (
        <p className="text-slate-500">No registered users yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border-2 border-[var(--rule)] bg-white/80">
            <table className="w-full min-w-200">
              <thead>
                <tr>
                  <th className={thCls}>User</th>
                  <th className={thCls}>Role</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Quiz attempts</th>
                  <th className={thCls}>Joined</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className={tdCls}>
                      <span className="font-bold">{u.name ?? "—"}</span>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className={tdCls}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className={tdCls}>
                      {u.isBanned ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                          banned
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">active</span>
                      )}
                    </td>
                    <td className={tdCls}>{u._count.quizAttempts}</td>
                    <td className={tdCls}>
                      {u.createdAt.toLocaleDateString("en-IN")}
                    </td>
                    <td className={tdCls}>
                      <div className="flex flex-wrap gap-2">
                        <QuickAction
                          action={toggleBan.bind(null, u.id)}
                          label={u.isBanned ? "Unban" : "Ban"}
                          title={u.isBanned ? "Lift the ban" : "Ban this account"}
                        />
                        {u.role === "admin" ? (
                          <QuickAction
                            action={changeRole.bind(null, u.id, "user")}
                            label="Remove admin"
                            title="Demote to regular user"
                          />
                        ) : (
                          <QuickAction
                            action={changeRole.bind(null, u.id, "admin")}
                            label="Make admin"
                            title="Promote to admin"
                          />
                        )}
                        <ConfirmAction
                          action={deleteUser.bind(null, u.id)}
                          label="Delete"
                          confirmMessage={`Delete user "${u.email}" and all their data? This can't be undone.`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Showing the latest 200 users. Safety: you can&apos;t delete yourself or
            another admin, and you can&apos;t remove your own admin role.
          </p>
        </>
      )}
    </div>
  );
}
