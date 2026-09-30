// auth.ts — Auth.js v5 (next-auth) configuration.
// Database session strategy via the Prisma adapter (server-side sessions).
//
// NOTE: there is intentionally NO Credentials provider here. Auth.js v5 does
// not support Credentials with database sessions — its credentials callback
// always mints a JWT cookie and never creates an adapter session
// ("Signing in with credentials only supported if JWT strategy is enabled").
// Email/password login is implemented in lib/auth/session.ts + the
// /login and /signup server actions: bcrypt verification, then a real
// database Session row + Auth.js-compatible session cookie. `auth()`,
// the proxy gate, and `signOut()` all work through the adapter unchanged.
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/db";
import { shouldUseSecureCookies } from "./lib/auth/cookies";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  // Explicit single source of truth for the session cookie name.
  // Auth.js core would otherwise infer it per-request from the URL protocol
  // and disagree with our manual login cookie (see lib/auth/cookies.ts).
  useSecureCookies: shouldUseSecureCookies(),
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    // With database sessions, `user` is the full adapter user record,
    // so role comes straight from the DB without an extra query.
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: string }).role ?? "user";
      }
      return session;
    },
  },
});
