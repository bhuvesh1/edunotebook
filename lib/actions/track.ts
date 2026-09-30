"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export interface ViewRecord {
  subjectSlug: string;
  topicSlug?: string;
  kind: "topic" | "blog";
}

/**
 * Record a page view for the Reading panel. No-op when logged out —
 * the whole site (including tracking) works anonymously.
 */
export async function recordView(view: ViewRecord): Promise<void> {
  if (!view.subjectSlug) return;
  if (view.kind !== "topic" && view.kind !== "blog") return;
  const session = await auth();
  const userId = session?.user ? Number(session.user.id) : NaN;
  if (!userId) return;
  try {
    await prisma.readingEvent.create({
      data: {
        userId,
        subjectSlug: view.subjectSlug,
        topicSlug: view.kind === "topic" ? (view.topicSlug ?? null) : null,
        kind: view.kind,
      },
    });
  } catch {
    /* tracking must never break the page */
  }
}
