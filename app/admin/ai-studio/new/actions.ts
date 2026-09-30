// app/admin/ai-studio/new/actions.ts — create a queued AI generation job.
// The job is NEVER auto-run: the admin clicks Run from the job detail page,
// then reviews, approves and publishes in separate steps.
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import type { ActionState } from "../../ui";
import type { AiJobKind } from "@/lib/ai/prompts";

const VALID_KINDS: AiJobKind[] = ["topic-content", "blog", "quiz", "translation"];

export async function createAiJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("ai");

  const kind = String(formData.get("kind") ?? "").trim();
  if (!(VALID_KINDS as string[]).includes(kind)) {
    return { error: `Invalid kind. Choose one of: ${VALID_KINDS.join(", ")}.` };
  }

  const subjectSlug = String(formData.get("subjectSlug") ?? "").trim() || null;

  const topicRaw = String(formData.get("topicId") ?? "").trim();
  let topicId: number | null = null;
  if (topicRaw) {
    const parsed = Number(topicRaw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return { error: "Topic ID must be a positive integer." };
    }
    const topic = await prisma.topic.findUnique({ where: { id: parsed } });
    if (!topic) {
      return { error: `No topic exists with ID ${parsed}.` };
    }
    topicId = parsed;
  }

  const input = String(formData.get("input") ?? "").trim() || null;

  const job = await prisma.aiJob.create({
    data: {
      kind,
      subjectSlug,
      topicId,
      input,
      status: "queued",
      createdById: admin.id,
    },
  });

  await auditLog("ai-job.create", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "AiJob",
    entityId: job.id,
    detail: { kind, subjectSlug, topicId },
  });

  redirect(`/admin/ai-studio/${job.id}`);
}
