"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSessionAndRedirect } from "@/lib/auth/session";
import type { AuthFormState } from "../login/actions";

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Server action behind the /signup form: creates the user, then signs in. */
export async function signupAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Please enter your name." };
  if (!validEmail(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      error: "An account with this email already exists. Try logging in instead.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "user" },
  });

  await createSessionAndRedirect(user.id, "/panel/profile");
  return { error: null }; // unreachable — createSessionAndRedirect redirects
}
