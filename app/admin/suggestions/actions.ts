// app/admin/suggestions/actions.ts — mark suggestions reviewed/done.
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import type { ActionState } from "../ui";

export async function setSuggestionStatus(
  id: number,
  status: "reviewed" | "done",
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("content");
  await prisma.suggestion.update({ where: { id }, data: { status } });
  await auditLog("suggestion.status", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "Suggestion",
    entityId: id,
    detail: { status },
  });
  revalidatePath("/admin/suggestions");
  revalidatePath("/admin");
  return { error: null };
}
