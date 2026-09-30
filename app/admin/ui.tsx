// app/admin/ui.tsx — shared CLIENT components for the admin panel.
// (Server-only bits live inline in each page.)

"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ActionState {
  error: string | null;
}

/** Delete/toggle button: JS confirm first, then calls the bound server action. */
export function ConfirmAction({
  action,
  confirmMessage,
  label,
  extra,
  danger = true,
  title,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  confirmMessage: string;
  label: string;
  extra?: React.ReactNode;
  danger?: boolean;
  title?: string;
}) {
  const [state, formAction] = useFormState(action, { error: null });
  return (
    <form
      action={formAction}
      className="inline"
      title={title}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {extra}
      <button
        type="submit"
        className={`rounded-md border-2 px-2.5 py-1 text-xs font-bold ${
          danger
            ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
            : "border-[var(--rule)] bg-white hover:bg-slate-100"
        }`}
      >
        {label}
      </button>
      {state.error && (
        <p className="mt-1 max-w-55 text-xs font-semibold text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Simple one-click action button (no confirm). */
export function QuickAction({
  action,
  label,
  title,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  title?: string;
}) {
  const [state, formAction] = useFormState(action, { error: null });
  return (
    <form action={formAction} className="inline" title={title}>
      <button
        type="submit"
        className="rounded-md border-2 border-[var(--rule)] bg-white px-2.5 py-1 text-xs font-bold hover:bg-slate-100"
      >
        {label}
      </button>
      {state.error && (
        <p className="mt-1 max-w-55 text-xs font-semibold text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Sidebar / top nav for the admin panel. Highlights the active section.
 * Pass `allowed` (from getAllowedNav) to hide sections the staff role can't open. */
export function AdminNav({ allowed }: { allowed?: string[] }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/subjects", label: "Subjects" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/topics", label: "Topics" },
    { href: "/admin/blogs", label: "Blogs" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/ai-studio", label: "AI Studio" },
    { href: "/admin/3d-studio", label: "3D Studio" },
    { href: "/admin/seo-health", label: "SEO Health" },
    { href: "/admin/security", label: "Security" },
    { href: "/admin/suggestions", label: "Suggestions" },
    { href: "/admin/questions", label: "Questions" },
  ];
  const visible = allowed ? items.filter((i) => allowed.includes(i.href)) : items;
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  return (
    <nav aria-label="Admin sections" className="flex flex-wrap gap-2 md:w-48 md:shrink-0 md:flex-col">
      {visible.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`rounded-lg border-2 px-3 py-1.5 text-sm font-bold md:w-full ${
            isActive(item.href)
              ? "border-[var(--margin-line)] bg-white shadow-sm"
              : "border-transparent hover:border-[var(--rule)] hover:bg-white/60"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Shared create/edit form shell with error display via useFormState. */
export function AdminForm({
  action,
  submitLabel,
  cancelHref,
  children,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  cancelHref: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useFormState(action, { error: null });
  return (
    <form
      action={formAction}
      className="max-w-2xl rounded-xl border-2 border-[var(--rule)] bg-white/80 p-6 shadow-sm"
    >
      <div className="space-y-4">{children}</div>
      {state.error && (
        <p className="mt-4 rounded-lg border-2 border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
          {state.error}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2 font-bold text-white hover:bg-slate-700"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border-2 border-[var(--rule)] bg-white px-5 py-2 font-bold hover:bg-slate-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function Field({
  label,
  name,
  children,
  hint,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border-2 border-[var(--rule)] bg-white px-3 py-2 text-sm focus:border-[var(--margin-line)] focus:outline-none";

export const checkCls = "mr-2 inline-block h-4 w-4 align-middle accent-slate-900";
