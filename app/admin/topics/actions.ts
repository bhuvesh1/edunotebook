// app/admin/topics/actions.ts — topic CRUD + status/3D controls, admin-gated.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import { slugify } from "@/lib/taxonomy";
import { isSimKey } from "@/lib/simulations/registry";
import type { ActionState } from "../ui";

function cleanSlug(raw: string, fallback: string): string {
  return slugify(raw) || slugify(fallback) || "topic";
}

const VALID_STATUS = ["draft", "published"] as const;

/** Normalize the sim override dropdown value: "" → null (auto), "none"/key as-is. */
function cleanSimKey(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null; // auto
  if (v === "none") return "none";
  if (isSimKey(v)) return v;
  return null;
}

export async function createTopic(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  const name = String(formData.get("name") ?? "").trim();
  const subcategoryId = parseInt(String(formData.get("subcategoryId") ?? ""), 10);
  if (!name) return { error: "Title is required." };
  if (!Number.isFinite(subcategoryId)) return { error: "Pick a subcategory." };
  const slug = cleanSlug(String(formData.get("slug") ?? ""), name);
  const status = String(formData.get("status") ?? "published");
  if (!VALID_STATUS.includes(status as (typeof VALID_STATUS)[number])) {
    return { error: "Invalid status." };
  }
  const clash = await prisma.topic.findUnique({
    where: { subcategoryId_slug: { subcategoryId, slug } },
  });
  if (clash) return { error: `A topic with slug "${slug}" already exists in this subcategory.` };

  const created = await prisma.topic.create({
    data: {
      name,
      slug,
      status,
      description: String(formData.get("description") ?? "").trim() || null,
      simKey: cleanSimKey(String(formData.get("simKey") ?? "")),
      subcategoryId,
    },
  });
  await auditLog("topic.create", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Topic",
    entityId: created.id,
    detail: { name, slug, status },
  });
  revalidatePath("/admin/topics");
  revalidatePath("/admin");
  redirect("/admin/topics");
}

export async function updateTopic(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  const existing = await prisma.topic.findUnique({
    where: { id },
    select: { subcategoryId: true },
  });
  if (!existing) return { error: "Topic not found (already deleted?)." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Title is required." };
  const slug = cleanSlug(String(formData.get("slug") ?? ""), name);
  const status = String(formData.get("status") ?? "published");
  if (!VALID_STATUS.includes(status as (typeof VALID_STATUS)[number])) {
    return { error: "Invalid status." };
  }
  const clash = await prisma.topic.findUnique({
    where: {
      subcategoryId_slug: { subcategoryId: existing.subcategoryId, slug },
    },
  });
  if (clash && clash.id !== id) {
    return { error: `A topic with slug "${slug}" already exists in this subcategory.` };
  }

  await prisma.topic.update({
    where: { id },
    data: {
      name,
      slug,
      status,
      description: String(formData.get("description") ?? "").trim() || null,
      simKey: cleanSimKey(String(formData.get("simKey") ?? "")),
    },
  });
  await auditLog("topic.update", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Topic",
    entityId: id,
    detail: { name, slug, status },
  });
  revalidatePath("/admin/topics");
  revalidatePath("/admin");
  redirect(`/admin/topics/${id}`);
}

export async function deleteTopic(
  id: number,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  // The linked auto-generated blog post survives: the relation is
  // onDelete: SetNull, so only the link is cleared.
  await prisma.topic.delete({ where: { id } });
  await auditLog("topic.delete", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Topic",
    entityId: id,
  });
  revalidatePath("/admin/topics");
  revalidatePath("/admin");
  return { error: null };
}

export async function toggleTopicStatus(
  id: number,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  const t = await prisma.topic.findUnique({ where: { id }, select: { status: true } });
  if (!t) return { error: "Topic not found." };
  const next = t.status === "published" ? "draft" : "published";
  await prisma.topic.update({
    where: { id },
    data: { status: next },
  });
  await auditLog("topic.publish", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Topic",
    entityId: id,
    detail: { from: t.status, to: next },
  });
  revalidatePath("/admin/topics");
  revalidatePath("/admin");
  return { error: null };
}
