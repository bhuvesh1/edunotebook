// app/admin/layout.tsx — admin shell.
// Calls requireRole(...STAFF_ROLES) first: the whole /admin tree is login +
// staff-role gated (any STAFF_ROLES role admitted; per-section access is
// enforced by each page's requirePermission gate plus the filtered nav below).
// Visually distinct from the public site: a dark slate header band
// so an admin never confuses it with the notebook-styled public pages.
import Link from "next/link";
import { requireRole, getAllowedNav, ROLE_LABELS, STAFF_ROLES } from "@/lib/admin";
import { AdminNav } from "./ui";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireRole(...STAFF_ROLES);
  const allowed = getAllowedNav(admin.role);

  return (
    <div>
      <header className="mb-6 rounded-xl bg-slate-900 px-4 py-3 text-slate-100 shadow sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-hand text-2xl font-bold tracking-wide">
              🛠 Admin control
            </p>
            <p className="text-xs text-slate-400">
              Content &amp; user management — internal area, not part of the
              public site.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold">
              {admin.email}
            </span>
            <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold">
              {ROLE_LABELS[admin.role] ?? admin.role}
            </span>
            <Link
              href="/"
              className="rounded-lg border border-slate-600 px-3 py-1.5 font-bold hover:bg-slate-700"
            >
              ← Back to site
            </Link>
          </div>
        </div>
      </header>
      <div className="md:flex md:gap-8">
        <AdminNav allowed={allowed} />
        <div className="mt-6 min-w-0 flex-1 md:mt-0">{children}</div>
      </div>
    </div>
  );
}
