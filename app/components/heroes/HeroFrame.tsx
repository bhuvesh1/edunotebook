import type { ReactNode } from "react";

interface HeroFrameProps {
  slug: string;
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Shared hero container. The root element always carries
 * data-hero="{slug}" for verification, plus a consistent
 * notebook-friendly frame and responsive aspect ratio.
 */
export function HeroFrame({ slug, label, children, className = "" }: HeroFrameProps) {
  return (
    <div
      data-hero={slug}
      role="img"
      aria-label={label}
      className={`relative w-full overflow-hidden rounded-2xl border-2 border-[var(--rule)] shadow-sm aspect-[4/3] sm:aspect-[16/8] ${className}`}
    >
      {children}
    </div>
  );
}
