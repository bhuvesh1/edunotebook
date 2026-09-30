"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function addSuggestionAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const session = await auth();
  const userId = session?.user ? Number(session.user.id) : NaN;
  if (!userId) return { error: "Please log in first.", ok: false };

  const text = String(formData.get("text") ?? "").trim();
  if (text.length < 10) {
    return { error: "Please write at least 10 characters.", ok: false };
  }
  if (text.length > 2000) {
    return { error: "Please keep suggestions under 2000 characters.", ok: false };
  }

  await prisma.suggestion.create({
    data: { userId, text, status: "new" },
  });
  revalidatePath("/panel/suggestions");
  return { error: null, ok: true };
}
