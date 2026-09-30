// app/admin/categories/actions.ts — category CRUD, admin-gated server actions.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import { slugify } from "@/lib/taxonomy";
import type { ActionState } from "../ui";

function cleanSlug(raw: string, fallback: string): string {
  return slugify(raw) || slugify(fallback) || "category";
}

function readFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: cleanSlug(String(formData.get("slug") ?? ""), String(formData.get("name") ?? "")),
    description: String(formData.get("description") ?? "").trim() || null,
    order: parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    subjectId: parseInt(String(formData.get("subjectId") ?? ""), 10),
  };
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  const f = readFields(formData);
  if (!f.name) return { error: "Name is required." };
  if (!Number.isFinite(f.subjectId)) return { error: "Pick a subject." };
  const clash = await prisma.category.findUnique({
    where: { subjectId_slug: { subjectId: f.subjectId, slug: f.slug } },
  });
  if (clash) return { error: `A category with slug "${f.slug}" already exists in this subject.` };
  const created = await prisma.category.create({ data: f });
  await auditLog("category.create", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Category",
    entityId: created.id,
    detail: { name: f.name, slug: f.slug, subjectId: f.subjectId },
  });
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  const f = readFields(formData);
  if (!f.name) return { error: "Name is required." };
  if (!Number.isFinite(f.subjectId)) return { error: "Pick a subject." };
  const clash = await prisma.category.findUnique({
    where: { subjectId_slug: { subjectId: f.subjectId, slug: f.slug } },
  });
  if (clash && clash.id !== id) {
    return { error: `A category with slug "${f.slug}" already exists in this subject.` };
  }
  await prisma.category.update({ where: { id }, data: f });
  await auditLog("category.update", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Category",
    entityId: id,
    detail: { name: f.name, slug: f.slug },
  });
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

/** Delete a category. Refuses when it has topics unless force is ticked. */
export async function deleteCategory(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  const topicCount = await prisma.topic.count({
    where: { subcategory: { categoryId: id } },
  });
  const force = formData.get("force") === "1";
  if (topicCount > 0 && !force) {
    return {
      error: `This category holds ${topicCount} topics (cascade delete). Tick "force" to delete them all.`,
    };
  }
  await prisma.category.delete({ where: { id } });
  await auditLog("category.delete", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Category",
    entityId: id,
    detail: { force },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  return { error: null };
}

/** Move a category up/down within its subject. */
export async function moveCategory(
  id: number,
  direction: "up" | "down",
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  await requirePermission("content");
  const me = await prisma.category.findUnique({
    where: { id },
    select: { subjectId: true },
  });
  if (!me) return { error: "Category not found." };
  const all = await prisma.category.findMany({
    where: { subjectId: me.subjectId },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: { id: true, order: true },
  });
  const idx = all.findIndex((c) => c.id === id);
  const other = direction === "up" ? all[idx - 1] : all[idx + 1];
  if (idx < 0 || !other) return { error: null };
  const a = all[idx];
  const newOrderA = other.order === a.order ? a.order + 1 : other.order;
  await prisma.$transaction([
    prisma.category.update({ where: { id: a.id }, data: { order: newOrderA } }),
    prisma.category.update({ where: { id: other.id }, data: { order: a.order } }),
  ]);
  revalidatePath("/admin/categories");
  return { error: null };
}
