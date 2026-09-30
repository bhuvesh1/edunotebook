// app/admin/ai-studio/[id]/actions.ts — job lifecycle: run, approve, publish, delete.
// Nothing auto-publishes: each transition is a separate admin action.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import { getAIProvider } from "@/lib/ai/provider";
import { buildPrompt, type AiJobKind } from "@/lib/ai/prompts";
import type { ActionState } from "../../ui";

async function loadJob(id: number) {
  const job = await prisma.aiJob.findUnique({
    where: { id },
    include: { topic: { select: { id: true, name: true, slug: true } } },
  });
  return job;
}

/** queued/failed → running → review (output set) or failed (error set). */
export async function runAiJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("ai");
  const id = Number(formData.get("id"));
  const job = await loadJob(id);
  if (!job) return { error: "Job not found." };
  if (!["queued", "failed"].includes(job.status)) {
    return { error: `Only queued or failed jobs can be run (current: ${job.status}).` };
  }

  await auditLog("ai-job.run", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "AiJob",
    entityId: job.id,
    detail: { kind: job.kind },
  });

  await prisma.aiJob.update({
    where: { id: job.id },
    data: { status: "running", error: null },
  });

  try {
    const provider = getAIProvider();
    const prompt = buildPrompt(job.kind as AiJobKind, {
      subjectSlug: job.subjectSlug ?? undefined,
      topicName: job.topic?.name,
      input: job.input ?? undefined,
    });
    const output = await provider.generateText(prompt);
    await prisma.aiJob.update({
      where: { id: job.id },
      data: {
        status: "review",
        output,
        provider: provider.name,
        model: provider.name === "gemini" ? "gemini-2.0-flash" : null,
        error: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown generation failure.";
    // The NullProvider's error message says honestly that GEMINI_API_KEY is missing.
    await prisma.aiJob.update({
      where: { id: job.id },
      data: { status: "failed", error: message },
    });
  }

  revalidatePath(`/admin/ai-studio/${job.id}`);
  revalidatePath("/admin/ai-studio");
  return { error: null };
}

/** review → approved. */
export async function approveAiJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("ai");
  const id = Number(formData.get("id"));
  const job = await loadJob(id);
  if (!job) return { error: "Job not found." };
  if (job.status !== "review") {
    return { error: `Only jobs in review can be approved (current: ${job.status}).` };
  }
  await prisma.aiJob.update({ where: { id: job.id }, data: { status: "approved" } });
  await auditLog("ai-job.approve", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "AiJob",
    entityId: job.id,
    detail: { kind: job.kind },
  });
  revalidatePath(`/admin/ai-studio/${job.id}`);
  revalidatePath("/admin/ai-studio");
  return { error: null };
}

/**
 * approved → published, plus the kind-specific apply step:
 * - blog → upsert BlogPost (slug subjectSlug-topicSlug)
 * - topic-content → topic.description = first 500 chars of output
 * - quiz | translation → no auto-target: output stays on the job for the
 *   admin to copy; the job is simply marked published (stated honestly in UI).
 */
export async function publishAiJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("ai");
  const id = Number(formData.get("id"));
  const job = await loadJob(id);
  if (!job) return { error: "Job not found." };
  if (job.status !== "approved") {
    return { error: `Only approved jobs can be published (current: ${job.status}).` };
  }
  if (!job.output) {
    return { error: "This job has no output to publish." };
  }

  let detail: Record<string, unknown> = { kind: job.kind };

  if (job.kind === "blog") {
    if (!job.topic) {
      return {
        error: "Blog publish needs a linked topic (topicId) to build the post slug.",
      };
    }
    const slug = `${job.subjectSlug ?? "general"}-${job.topic.slug}`;
    const post = await prisma.blogPost.upsert({
      where: { slug },
      update: {
        title: job.topic.name,
        contentHtml: job.output,
        status: "published",
        source: "ai",
        subjectSlug: job.subjectSlug,
        topicSlug: job.topic.slug,
        topicId: job.topic.id,
      },
      create: {
        slug,
        title: job.topic.name,
        contentHtml: job.output,
        status: "published",
        source: "ai",
        subjectSlug: job.subjectSlug,
        topicSlug: job.topic.slug,
        topicId: job.topic.id,
      },
    });
    detail = { ...detail, blogPostId: post.id, slug };
  } else if (job.kind === "topic-content") {
    if (!job.topic) {
      return {
        error: "Topic-content publish needs a linked topic (topicId) to update.",
      };
    }
    await prisma.topic.update({
      where: { id: job.topic.id },
      data: { description: job.output.slice(0, 500) },
    });
    detail = { ...detail, topicId: job.topic.id };
  } else {
    // quiz | translation: no auto-target. The output stays on the job record
    // for the admin to copy manually; we say so honestly on the page.
    detail = { ...detail, applied: false, reason: "manual copy — no auto-target" };
  }

  await prisma.aiJob.update({ where: { id: job.id }, data: { status: "published" } });
  await auditLog("ai-job.publish", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "AiJob",
    entityId: job.id,
    detail,
  });
  revalidatePath(`/admin/ai-studio/${job.id}`);
  revalidatePath("/admin/ai-studio");
  return { error: null };
}

/** Delete a job record. Published content it created is left untouched. */
export async function deleteAiJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("ai");
  const id = Number(formData.get("id"));
  const job = await prisma.aiJob.findUnique({ where: { id } });
  if (!job) return { error: "Job not found." };
  await prisma.aiJob.delete({ where: { id } });
  await auditLog("ai-job.delete", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "AiJob",
    entityId: id,
    detail: { kind: job.kind, status: job.status },
  });
  redirect("/admin/ai-studio");
}
