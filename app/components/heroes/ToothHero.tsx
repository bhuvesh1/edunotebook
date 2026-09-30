"use client";

import { useMemo } from "react";
import { HeroFrame } from "./HeroFrame";

/** Four-point sparkle star. */
function Sparkle({
  left,
  top,
  size,
  delay,
  duration,
}: {
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="absolute"
      style={{
        left,
        top,
        width: size,
        height: size,
        animation: `hero-twinkle ${duration}s ease-in-out ${delay}s infinite`,
      }}
      aria-hidden="true"
    >
      <path
        d="M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0 Z"
        fill="#ffffff"
        style={{ filter: "drop-shadow(0 0 6px rgba(45,212,191,0.9))" }}
      />
    </svg>
  );
}

/**
 * Dental hero — a gleaming tooth with a looping shine sweep
 * and twinkling sparkles on a fresh mint background.
 */
export function ToothHero({ slug }: { slug: string }) {
  const sparkles = useMemo(
    () => [
      { left: "18%", top: "18%", size: 26, delay: 0, duration: 2.6 },
      { left: "74%", top: "12%", size: 32, delay: 0.8, duration: 3 },
      { left: "82%", top: "58%", size: 22, delay: 1.6, duration: 2.4 },
      { left: "12%", top: "62%", size: 20, delay: 0.4, duration: 2.8 },
      { left: "64%", top: "80%", size: 24, delay: 2, duration: 3.2 },
    ],
    []
  );

  return (
    <HeroFrame
      slug={slug}
      label="Sparkling tooth with shine sweep"
      className="bg-gradient-to-b from-cyan-100 via-teal-50 to-emerald-100"
    >
      {/* soft glow behind the tooth */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 sm:w-80 sm:h-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(153,246,228,0.35)_55%,transparent_75%)]" />

      {/* tooth */}
      <svg
        viewBox="0 0 124 132"
        className="absolute left-1/2 top-1/2 h-[70%] -translate-x-1/2 -translate-y-1/2"
        style={{ filter: "drop-shadow(0 12px 18px rgba(13,148,136,0.35))" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tooth-gloss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#f0fdfa" />
            <stop offset="1" stopColor="#ccfbf1" />
          </linearGradient>
        </defs>
        <path
          d="M62 12 C46 12 35 22 36 38 C37 52 43 58 45 72 C47 88 49 112 57 110
             C63 108 63 94 67 92 C69 91 71 91 73 92 C77 94 77 108 83 110
             C91 112 93 88 95 72 C97 58 103 52 104 38 C105 22 94 12 78 12
             C72 12 68 14 62 12 Z"
          fill="url(#tooth-gloss)"
          stroke="#5eead4"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* enamel highlight */}
        <ellipse cx="50" cy="42" rx="9" ry="16" fill="#ffffff" opacity="0.7" transform="rotate(-12 50 42)" />
      </svg>

      {/* shine sweep across the whole hero */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-y-[-20%] left-0 w-1/4 bg-gradient-to-r from-transparent via-white/80 to-transparent"
          style={{ animation: "hero-shimmer 3.4s ease-in-out infinite" }}
        />
      </div>

      {/* sparkles */}
      {sparkles.map((s, i) => (
        <Sparkle key={i} {...s} />
      ))}

      {/* caption chip */}
      <span className="absolute bottom-2 left-3 text-[10px] sm:text-xs font-semibold tracking-[0.25em] text-teal-900/70">
        DENTAL CARE
      </span>
    </HeroFrame>
  );
}
