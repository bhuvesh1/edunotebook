"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/panel/profile", label: "Profile" },
  { href: "/panel/quiz", label: "Quiz" },
  { href: "/panel/suggestions", label: "Suggestions" },
  { href: "/panel/leaderboard", label: "Leaderboard" },
  { href: "/panel/reading", label: "Reading" },
  { href: "/panel/bookmarks", label: "Bookmarks" },
];

/** Side nav on desktop, scrollable top tabs on mobile. */
export default function PanelNav() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop: side nav */}
      <nav aria-label="User panel" className="hidden w-52 shrink-0 md:block">
        <ul className="sticky top-24 space-y-1 rounded-2xl border-2 border-[var(--rule)] bg-white/70 p-3">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`font-hand block rounded-lg px-4 py-2 text-lg font-semibold transition ${
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Mobile: top tabs */}
      <nav aria-label="User panel" className="mb-6 md:hidden">
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <li key={t.href} className="shrink-0">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`font-hand block rounded-full border-2 px-4 py-1.5 text-base font-semibold transition ${
                    active
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-[var(--rule)] bg-white/70 text-slate-700"
                  }`}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
