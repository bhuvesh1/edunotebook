"use client";

import { useReducer, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "../lib/i18n";

/**
 * Compact language toggle for the header. Sets the `locale` cookie
 * (1 year, site-wide) and refreshes the current route so server
 * components re-render in the new language. No route restructuring.
 *
 * The active button is driven by useSyncExternalStore reading
 * document.cookie — no setState-in-effect, and SSR-safe via the
 * server snapshot.
 */

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const code = match?.[1];
  return code && LOCALES.some((l) => l.code === code)
    ? (code as Locale)
    : "en";
}

function writeLocaleCookie(code: Locale) {
  // Intentional side effect: persists the reader's language choice.
  document.cookie = `locale=${code}; path=/; max-age=31536000; SameSite=Lax`;
}

const noopSubscribe = () => () => {};

export default function LanguageSwitcher() {
  const router = useRouter();
  const [, forceRender] = useReducer((x: number) => x + 1, 0);
  const current = useSyncExternalStore(
    noopSubscribe,
    readLocaleCookie,
    () => "en" as Locale
  );

  const switchTo = (code: Locale) => {
    if (code === current) return;
    writeLocaleCookie(code);
    forceRender();
    router.refresh();
  };

  return (
    <div
      role="group"
      aria-label="Language / भाषा"
      className="font-hand inline-flex items-center rounded-full border-2 border-[var(--rule)] bg-white/70 text-sm font-bold text-slate-700"
    >
      {LOCALES.map((l) => {
        const active = l.code === current;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => switchTo(l.code)}
            aria-pressed={active}
            className={`px-3 py-1 rounded-full transition-colors ${
              active
                ? "bg-slate-800 text-white"
                : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            {l.name}
          </button>
        );
      })}
    </div>
  );
}
