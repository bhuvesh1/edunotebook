/**
 * EduNotebook i18n — cookie-based, no route restructuring.
 *
 * ARCHITECTURE
 * ------------
 * - There is NO locale routing (no /hi/... prefixes). The active language is
 *   chosen by the reader and stored in a `locale` cookie (set by
 *   <LanguageSwitcher/>). Every request renders in that language; switching
 *   language only flips the cookie and refreshes the page.
 * - Supported languages live in LOCALES below. Each one needs a matching
 *   dictionary at messages/<code>.json.
 * - Server components: `const locale = await getLocale();`
 *   `const dict = await getDictionary(locale);` then read strings from `dict`
 *   (same key structure as messages/en.json). Content body text (topics,
 *   blogs, subject names from the DB) stays English for now — the honest
 *   fallback banner lives in components/HindiFallbackNotice.tsx.
 * - Client components: next/headers is imported LAZILY inside getLocale()
 *   (never statically at module top) so that LanguageSwitcher — a client
 *   component — can safely import LOCALES from this module without dragging
 *   next/headers into the browser bundle.
 *
 * ADDING A LANGUAGE (no code changes needed):
 *   1. Append { code: "<code>", name: "<native name>" } to LOCALES.
 *   2. Add messages/<code>.json with the same key structure as en.json.
 *      (Use the "subjects" map pattern for per-slug translations that have
 *      no en.json counterpart — see messages/hi.json.)
 * That's it: getLocale() validates the cookie against LOCALES, and
 * getDictionary() loads the matching file.
 */

import enMessages from "../messages/en.json";
import hiMessages from "../messages/hi.json";

// To add a language: append { code, name } here + messages/<code>.json.
// No other code changes needed.
export const LOCALES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

/** Full UI dictionary shape: en.json keys, plus optional hi-only extras
 *  (e.g. "subjects" slug→name map, which has no en.json counterpart). */
export type Dictionary = typeof enMessages & {
  subjects?: Record<string, string>;
};

const DICTIONARIES: Record<Locale, Dictionary> = {
  en: enMessages as Dictionary,
  hi: hiMessages as Dictionary,
};

/**
 * Active locale for this request, from the `locale` cookie.
 * Validates against LOCALES; anything missing/invalid falls back to "en".
 */
export async function getLocale(): Promise<Locale> {
  // Lazy import: keeps this module's static dependency graph client-safe
  // (LanguageSwitcher imports LOCALES from here in the browser).
  const { cookies } = await import("next/headers");
  const raw = (await cookies()).get("locale")?.value;
  return LOCALES.some((l) => l.code === raw) ? (raw as Locale) : "en";
}

/** Parsed dictionary for the locale. */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}

/**
 * Nested key lookup with fallback: tpick(dict, "home.heroTitle", "fallback").
 * Returns `fallback` when the path is missing or doesn't resolve to a string.
 */
export function tpick(
  dict: Dictionary,
  path: string,
  fallback: string
): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === "object" && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
  return typeof value === "string" ? value : fallback;
}
