// app/admin/users/actions.ts — ban/unban, role change, delete.
// Safety rules: never delete yourself or another admin; never remove your
// own admin role.
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import type { ActionState } from "../ui";

export async function toggleBan(
  id: number,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const me = await requirePermission("users");
  if (id === me.id) return { error: "You can't ban yourself." };
  const u = await prisma.user.findUnique({
    where: { id },
    select: { isBanned: true, role: true },
  });
  if (!u) return { error: "User not found." };
  if (u.role === "admin") return { error: "Admins can't be banned here — remove their role first." };
  const banning = !u.isBanned;
  await prisma.user.update({ where: { id }, data: { isBanned: banning } });
  if (banning) {
    // Immediate lockout: kill every live session so the user can't keep
    // browsing on an existing session after being banned.
    await prisma.session.deleteMany({ where: { userId: id } });
  }
  await auditLog(banning ? "user.ban" : "user.unban", {
    actorId: me.id,
    actorEmail: me.email,
    entityType: "User",
    entityId: id,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { error: null };
}

export async function changeRole(
  id: number,
  role: "admin" | "user",
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const me = await requirePermission("users");
  if (id === me.id && role !== "admin") {
    return { error: "You can't remove your own admin role." };
  }
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!u) return { error: "User not found." };
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { error: null };
}

export async function deleteUser(
  id: number,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const me = await requirePermission("users");
  if (id === me.id) return { error: "You can't delete your own account." };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!u) return { error: "User not found (already deleted?)." };
  if (u.role === "admin") {
    return { error: "Refusing to delete another admin. Remove their admin role first." };
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { error: null };
}
