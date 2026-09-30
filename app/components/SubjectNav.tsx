"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SubjectNavProps {
  subjects: { name: string; slug: string }[];
  /** Screen-reader label for the nav strip. Defaults to "Subjects". */
  ariaLabel?: string;
}

// Fixed strip along the notebook border with all 7 subjects.
// Renders from the root layout on EVERY page; never re-renders content,
// only highlights the active subject.
export default function SubjectNav({ subjects, ariaLabel = "Subjects" }: SubjectNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabel}
      className="subject-nav sticky top-0 z-50 overflow-x-auto"
    >
      <ul className="flex items-stretch justify-start sm:justify-center min-w-max">
        {subjects.map((s) => {
          const href = `/subject/${s.slug}`;
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={s.slug} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="font-hand whitespace-nowrap px-4 sm:px-6 py-3 text-base sm:text-lg font-semibold text-slate-800 border-l border-[var(--rule)] first:border-l-0"
              >
                {s.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
