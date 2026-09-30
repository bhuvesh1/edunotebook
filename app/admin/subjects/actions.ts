// app/admin/subjects/actions.ts — subject CRUD, all admin-gated server actions.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import { slugify } from "@/lib/taxonomy";
import type { ActionState } from "../ui";

function cleanSlug(raw: string, fallback: string): string {
  return slugify(raw) || slugify(fallback) || "subject";
}

function readFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: cleanSlug(String(formData.get("slug") ?? ""), String(formData.get("name") ?? "")),
    description: String(formData.get("description") ?? "").trim() || null,
    icon: String(formData.get("icon") ?? "").trim() || null,
    order: parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    enabled: formData.get("enabled") === "on",
  };
}

export async function createSubject(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  const f = readFields(formData);
  if (!f.name) return { error: "Name is required." };
  if (await prisma.subject.findUnique({ where: { slug: f.slug } })) {
    return { error: `A subject with slug "${f.slug}" already exists.` };
  }
  const created = await prisma.subject.create({ data: f });
  await auditLog("subject.create", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Subject",
    entityId: created.id,
    detail: { name: f.name, slug: f.slug },
  });
  revalidatePath("/admin/subjects");
  redirect("/admin/subjects");
}

export async function updateSubject(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  const f = readFields(formData);
  if (!f.name) return { error: "Name is required." };
  const clash = await prisma.subject.findUnique({ where: { slug: f.slug } });
  if (clash && clash.id !== id) {
    return { error: `A subject with slug "${f.slug}" already exists.` };
  }
  await prisma.subject.update({ where: { id }, data: f });
  await auditLog("subject.update", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Subject",
    entityId: id,
    detail: { name: f.name, slug: f.slug },
  });
  revalidatePath("/admin/subjects");
  redirect("/admin/subjects");
}

/** Delete a subject. Refuses when it has categories unless force is ticked. */
export async function deleteSubject(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  const me = await prisma.subject.findUnique({
    where: { id },
    select: { slug: true, _count: { select: { categories: true } } },
  });
  if (!me) return { error: "Subject not found (already deleted?)." };
  const force = formData.get("force") === "1";
  if (me._count.categories > 0 && !force) {
    return {
      error: `This subject has ${me._count.categories} categories (with all their topics). Tick "force" to delete everything under it.`,
    };
  }
  await prisma.subject.delete({ where: { id } });
  await auditLog("subject.delete", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Subject",
    entityId: id,
    detail: { slug: me.slug, force },
  });
  revalidatePath("/admin/subjects");
  revalidatePath("/admin");
  return { error: null };
}

export async function toggleSubjectEnabled(
  id: number,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  await requirePermission("content");
  const s = await prisma.subject.findUnique({
    where: { id },
    select: { enabled: true },
  });
  if (!s) return { error: "Subject not found." };
  await prisma.subject.update({ where: { id }, data: { enabled: !s.enabled } });
  revalidatePath("/admin/subjects");
  return { error: null };
}

/** Move a subject up/down in the admin ordering. */
export async function moveSubject(
  id: number,
  direction: "up" | "down",
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  await requirePermission("content");
  const all = await prisma.subject.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: { id: true, order: true },
  });
  const idx = all.findIndex((s) => s.id === id);
  const other = direction === "up" ? all[idx - 1] : all[idx + 1];
  if (idx < 0 || !other) return { error: null }; // already at the end
  const a = all[idx];
  // Swap order values; if they tie, push one below the other.
  const newOrderOther = a.order;
  const newOrderA = other.order === a.order ? a.order + 1 : other.order;
  await prisma.$transaction([
    prisma.subject.update({ where: { id: a.id }, data: { order: newOrderA } }),
    prisma.subject.update({ where: { id: other.id }, data: { order: newOrderOther } }),
  ]);
  revalidatePath("/admin/subjects");
  return { error: null };
}
