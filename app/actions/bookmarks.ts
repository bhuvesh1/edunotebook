"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type BookmarkKind = "topic" | "blog";

async function userIdOrNull(): Promise<number | null> {
  const session = await auth();
  const id = session?.user ? Number(session.user.id) : NaN;
  return id ? id : null;
}

function validKind(kind: string): kind is BookmarkKind {
  return kind === "topic" || kind === "blog";
}

/** Toggle a bookmark; returns the new state (true = bookmarked). */
export async function toggleBookmark(
  kind: string,
  refSlug: string
): Promise<boolean> {
  const userId = await userIdOrNull();
  if (!userId || !validKind(kind) || !refSlug) throw new Error("Not allowed.");
  const where = { userId, kind, refSlug };
  const existing = await prisma.bookmark.findUnique({ where: { userId_kind_refSlug: where } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({ data: { userId, kind, refSlug } });
  }
  revalidatePath("/panel/bookmarks");
  return !existing;
}

/** Current bookmark state for the button's initial render. */
export async function isBookmarked(
  kind: string,
  refSlug: string
): Promise<boolean> {
  const userId = await userIdOrNull();
  if (!userId || !validKind(kind) || !refSlug) return false;
  const existing = await prisma.bookmark.findUnique({
    where: { userId_kind_refSlug: { userId, kind, refSlug } },
    select: { id: true },
  });
  return !!existing;
}
