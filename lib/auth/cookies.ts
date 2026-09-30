// lib/auth/cookies.ts — single source of truth for the Auth.js session cookie.
//
// BUG THIS PREVENTS (found 2026-09-30 during integration testing):
// Auth.js core computes the session cookie name as
//   config.useSecureCookies ?? (url.protocol === "https:")
// (see @auth/core lib/init.js). It does NOT consult NODE_ENV. Our
// email/password login (lib/auth/session.ts) sets the cookie manually, so
// if the two sides compute different names, login appears to succeed but
// every subsequent auth() call sees no session — users can never stay
// logged in. The fix: auth.ts passes useSecureCookies explicitly from
// shouldUseSecureCookies() below, and the login flow uses sessionCookieName()
// from this same module. They can never disagree again.

/** Mirror of the intent behind Auth.js's useSecureCookies default. */
export function shouldUseSecureCookies(): boolean {
  const authUrl = process.env.AUTH_URL;
  if (authUrl) return authUrl.startsWith("https://");
  return process.env.NODE_ENV === "production";
}

/** Mirror of Auth.js's defaultCookies(useSecureCookies).sessionToken.name. */
export function sessionCookieName(): string {
  return `${shouldUseSecureCookies() ? "__Secure-" : ""}authjs.session-token`;
}
