// proxy.ts — auth gate for login-required routes.
// NOTE (Phase 5): the task brief says "middleware.ts", but Next.js 16
// deprecated middleware.ts in favour of proxy.ts (same API, renamed export).
// Proxy runs in the Node.js runtime, so the Prisma-backed database session
// lookup inside `auth` works here (it cannot run on the Edge runtime with
// a local SQLite database).
//
// ONLY /ask* and /panel* require login. Everything else stays public —
// the entire site works without an account.
import { auth } from "@/auth";

export const proxy = auth((req) => {
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search
    );
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/ask/:path*", "/panel/:path*", "/admin/:path*"],
};
