// lib/admin.ts — server-side staff gate. NEVER trust client state:
// every admin page layout and every admin server action calls a require*
// gate, which verifies the database-backed Auth.js session and re-reads the
// user's role + ban status from the DB (never from a client-supplied value).

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export interface AdminSessionUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
}

/** Every role that is allowed inside the /admin tree. */
export const STAFF_ROLES = [
  "admin",
  "content-manager",
  "3d-manager",
  "quiz-manager",
  "seo-manager",
  "translator",
  "analyst",
] as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  "content-manager": "Content Manager",
  "3d-manager": "3D Studio Manager",
  "quiz-manager": "Quiz Manager",
  "seo-manager": "SEO Manager",
  translator: "Translator",
  analyst: "Analyst",
  user: "User",
};

export const SECTION_PERMS: Record<
  "dashboard" | "content" | "models" | "ai" | "seo" | "users" | "security",
  string[]
> = {
  dashboard: [...STAFF_ROLES],
  content: ["admin", "content-manager"],
  models: ["admin", "3d-manager"],
  ai: ["admin", "content-manager"],
  seo: ["admin", "seo-manager"],
  users: ["admin"],
  security: ["admin"],
};

/** True when `role` may access `section`. The admin role always passes. */
export function roleAllows(
  role: string,
  section: keyof typeof SECTION_PERMS
): boolean {
  if (role === "admin") return true;
  return SECTION_PERMS[section].includes(role);
}

/**
 * Return the current staff user when their role is in `roles`, or redirect
 * away. Non-logged-in users go to /login; banned users and users without a
 * matching role bounce back to the public site with an explanatory flag.
 */
export async function requireRole(
  ...roles: string[]
): Promise<AdminSessionUser> {
  const session = await auth();
  const rawId = session?.user?.id;
  if (rawId == null) {
    redirect("/login?callbackUrl=/admin&error=login-required");
  }
  // Re-read from the DB: role may have changed since the session was minted.
  const user = await prisma.user.findUnique({
    where: { id: Number(rawId) },
    select: { id: true, email: true, name: true, role: true, isBanned: true },
  });
  if (!user || user.isBanned || !roles.includes(user.role)) {
    redirect("/?error=not-admin");
  }
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/**
 * Gate on an admin section. Resolves the section to its allowed roles via
 * SECTION_PERMS, then delegates to requireRole.
 */
export async function requirePermission(
  section: keyof typeof SECTION_PERMS
): Promise<AdminSessionUser> {
  return requireRole(...SECTION_PERMS[section]);
}

/**
 * Return the current staff user, or redirect away.
 * Any STAFF_ROLES role is admitted (each /admin page further restricts via
 * Require the literal "admin" role. Prefer requirePermission(section) for
 * section-level gates; non-logged-in users go to /login, and banned users /
 * non-admin users bounce to /?error=not-admin.
 */
export async function requireAdmin(): Promise<AdminSessionUser> {
  return requireRole("admin");
}

/** Nav hrefs the given role may see. The dashboard is always included. */
export function getAllowedNav(role: string): string[] {
  const hrefs = ["/admin"];
  if (roleAllows(role, "content")) {
    hrefs.push(
      "/admin/subjects",
      "/admin/categories",
      "/admin/topics",
      "/admin/blogs",
      "/admin/suggestions",
      "/admin/questions"
    );
  }
  if (roleAllows(role, "models")) hrefs.push("/admin/3d-studio");
  if (roleAllows(role, "ai")) hrefs.push("/admin/ai-studio");
  if (roleAllows(role, "seo")) hrefs.push("/admin/seo-health");
  if (roleAllows(role, "users")) hrefs.push("/admin/users");
  if (roleAllows(role, "security")) hrefs.push("/admin/security");
  return hrefs;
}
