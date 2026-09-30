"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSubjects } from "@/lib/taxonomy";
import { answerWithClaude } from "@/lib/anthropic";

export interface AskFormState {
  error: string | null;
  ok: boolean;
  answer: string | null;
  aiUnavailable: boolean;
}

/** Free-tier guard: max questions per user per day (protects the API budget). */
const DAILY_LIMIT = 20;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Save the user's question and answer it with Claude (Sonnet tier).
 * If the API key is missing or the call fails, the question is still saved
 * and the UI says so honestly instead of faking an answer.
 */
export async function askQuestionAction(
  _prev: AskFormState,
  formData: FormData
): Promise<AskFormState> {
  const session = await auth();
  const userId = session?.user ? Number(session.user.id) : NaN;
  if (!userId) return { error: "Please log in to ask a question.", ok: false, answer: null, aiUnavailable: false };

  const subjectSlug = String(formData.get("subjectSlug") ?? "").trim() || null;
  const question = String(formData.get("question") ?? "").trim();

  if (question.length < 10) {
    return { error: "Please write a question of at least 10 characters.", ok: false, answer: null, aiUnavailable: false };
  }
  if (question.length > 2000) {
    return { error: "Please keep your question under 2000 characters.", ok: false, answer: null, aiUnavailable: false };
  }

  const askedToday = await prisma.askedQuestion.count({
    where: { userId, createdAt: { gte: startOfToday() } },
  });
  if (askedToday >= DAILY_LIMIT) {
    return {
      error: `You've reached today's limit of ${DAILY_LIMIT} questions. Come back tomorrow!`,
      ok: false,
      answer: null,
      aiUnavailable: false,
    };
  }

  const subjectName = subjectSlug
    ? getSubjects().find((s) => s.slug === subjectSlug)?.name ?? null
    : null;

  // Save the question first so nothing is lost if the AI call fails.
  const saved = await prisma.askedQuestion.create({
    data: { userId, subjectSlug, question },
  });

  let answer: string | null = null;
  let aiUnavailable = false;
  try {
    answer = await answerWithClaude({ question, subjectName });
    await prisma.askedQuestion.update({
      where: { id: saved.id },
      data: { answer, answeredAt: new Date() },
    });
  } catch (err) {
    // Honest failure: question is saved, answer stays empty.
    aiUnavailable = true;
    console.error("Ask Me AI failed:", err instanceof Error ? err.message : err);
  }

  revalidatePath("/ask");
  return { error: null, ok: true, answer, aiUnavailable };
}
