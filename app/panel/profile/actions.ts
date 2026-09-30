"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";

async function requireUserId(): Promise<number> {
  const session = await auth();
  const id = session?.user ? Number(session.user.id) : NaN;
  if (!id) throw new Error("Not signed in.");
  return id;
}

export async function updateNameAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!name) throw new Error("Name cannot be empty.");
  await prisma.user.update({ where: { id: userId }, data: { name } });
  revalidatePath("/panel/profile");
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
