// app/admin/security/actions.ts — staff role changes + session revocation.
// Admin-only (requirePermission("security")).
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission, STAFF_ROLES } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import type { ActionState } from "../ui";

export async function changeStaffRole(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await requirePermission("security");
  const role = String(formData.get("role") ?? "").trim();
  if (!(STAFF_ROLES as readonly string[]).includes(role)) {
    return { error: "Invalid role." };
  }
  const u = await prisma.user.findUnique({
    where: { id },
    select: { role: true, email: true },
  });
  if (!u) return { error: "User not found." };
  if (id === me.id && role !== "admin") {
    return { error: "You can't remove your own admin role." };
  }
  // Never leave the system with zero admins.
  if (u.role === "admin" && role !== "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return { error: "Refusing: this is the last admin account." };
    }
  }
  await prisma.user.update({ where: { id }, data: { role } });
  await auditLog("user.role-change", {
    actorId: me.id,
    actorEmail: me.email,
    entityType: "User",
    entityId: id,
    detail: { from: u.role, to: role, targetEmail: u.email },
  });
  revalidatePath("/admin/security");
  return { error: null };
}

export async function revokeSession(
  id: string,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const me = await requirePermission("security");
  const s = await prisma.session.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!s) return { error: "Session not found (already revoked?)." };
  await prisma.session.delete({ where: { id } });
  await auditLog("session.revoke", {
    actorId: me.id,
    actorEmail: me.email,
    entityType: "Session",
    entityId: id,
    detail: { targetUserId: s.userId, targetEmail: s.user.email },
  });
  revalidatePath("/admin/security");
  return { error: null };
}
