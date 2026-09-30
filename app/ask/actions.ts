"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export interface AskFormState {
  error: string | null;
  ok: boolean;
}

/** Save the user's question. Answers are NOT generated yet (honest placeholder). */
export async function askQuestionAction(
  _prev: AskFormState,
  formData: FormData
): Promise<AskFormState> {
  const session = await auth();
  const userId = session?.user ? Number(session.user.id) : NaN;
  if (!userId) return { error: "Please log in to ask a question.", ok: false };

  const subjectSlug = String(formData.get("subjectSlug") ?? "").trim() || null;
  const question = String(formData.get("question") ?? "").trim();

  if (question.length < 10) {
    return { error: "Please write a question of at least 10 characters.", ok: false };
  }
  if (question.length > 2000) {
    return { error: "Please keep your question under 2000 characters.", ok: false };
  }

  await prisma.askedQuestion.create({
    data: { userId, subjectSlug, question },
  });
  revalidatePath("/ask");
  return { error: null, ok: true };
}
