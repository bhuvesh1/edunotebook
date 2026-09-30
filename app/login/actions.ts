"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createSessionAndRedirect } from "@/lib/auth/session";

export interface AuthFormState {
  error: string | null;
}

/** Server action behind the /login form: bcrypt check → database session. */
export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "") || "/panel/profile";

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const ok =
    user?.passwordHash != null
      ? await bcrypt.compare(password, user.passwordHash)
      : false;
  if (!user || !ok) {
    // Same message either way — don't reveal which emails have accounts.
    return { error: "Invalid email or password. Please try again." };
  }
  if (user.isBanned) {
    await auditLog("auth.login-blocked-banned", { actorEmail: user.email });
    return {
      error: "This account has been suspended. Contact support.",
    };
  }

  await createSessionAndRedirect(user.id, callbackUrl);
  return { error: null }; // unreachable — createSessionAndRedirect redirects
}
