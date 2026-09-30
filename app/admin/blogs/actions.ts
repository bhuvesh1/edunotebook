// app/admin/blogs/actions.ts — blog status toggle + delete, admin-gated.
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import type { ActionState } from "../ui";

export async function toggleBlogStatus(
  id: number,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  const b = await prisma.blogPost.findUnique({ where: { id }, select: { status: true } });
  if (!b) return { error: "Blog post not found." };
  const next = b.status === "published" ? "draft" : "published";
  await prisma.blogPost.update({
    where: { id },
    data: { status: next },
  });
  await auditLog("blog.publish", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "BlogPost",
    entityId: id,
    detail: { from: b.status, to: next },
  });
  revalidatePath("/admin/blogs");
  revalidatePath("/admin");
  revalidatePath("/blogs");
  return { error: null };
}

export async function deleteBlog(
  id: number,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  await prisma.blogPost.delete({ where: { id } });
  await auditLog("blog.delete", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "BlogPost",
    entityId: id,
  });
  revalidatePath("/admin/blogs");
  revalidatePath("/admin");
  revalidatePath("/blogs");
  return { error: null };
}
