// lib/auth/session.ts — database-session helpers for email/password auth.
//
// WHY THIS EXISTS: Auth.js v5 only supports its Credentials provider with
// the JWT session strategy ("Signing in with credentials only supported if
// JWT strategy is enabled" — @auth/core assert.ts; the credentials callback
// also always mints a JWT cookie and never touches the adapter). This project
// uses database sessions (server-side, revocable), so email/password login is
// done here instead: verify the bcrypt hash, create a Session row through the
// Prisma adapter, and set the session cookie with the exact name/options
// Auth.js itself uses — so `auth()` (pages, proxy, /api/session) and
// `signOut()` keep working unchanged.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../db";
import { sessionCookieName, shouldUseSecureCookies } from "./cookies";

export { sessionCookieName };

const adapter = PrismaAdapter(prisma);

/** Auth.js default session max age: 30 days. */
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Create a database session for the user and set the session cookie,
 * then redirect. Call at the END of a login/signup server action.
 */
export async function createSessionAndRedirect(
  userId: number,
  redirectTo: string
): Promise<never> {
  if (!adapter.createSession) throw new Error("Session adapter unavailable.");
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);
  // PrismaAdapter's types assume string user IDs; our User id is Int —
  // the adapter passes the value straight to prisma.session.create.
  await adapter.createSession({
    sessionToken,
    userId: userId as unknown as string,
    expires,
  });

  const jar = await cookies();
  jar.set(sessionCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    expires,
  });
  redirect(redirectTo.startsWith("/") ? redirectTo : "/panel/profile");
}
