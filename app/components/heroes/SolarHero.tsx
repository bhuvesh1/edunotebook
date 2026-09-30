"use client";

import { HeroFrame } from "./HeroFrame";

/**
 * Physics hero — realistic solar panel array at dawn.
 * CSS/SVG only: spinning sun rays (conic gradient), drifting clouds,
 * perspective-tilted panel array with a looping shimmer sweep.
 */
export function SolarHero({ slug }: { slug: string }) {
  return (
    <HeroFrame
      slug={slug}
      label="Animated solar panel array under a shining sun"
      className="bg-gradient-to-b from-sky-300 via-amber-100 to-amber-200"
    >
      {/* Sun core */}
      <div className="absolute top-[6%] right-[8%] w-20 h-20 sm:w-28 sm:h-28">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,#fef3c7_0%,#fcd34d_45%,#f59e0b_65%,rgba(245,158,11,0)_75%)]" />
        {/* Rotating rays */}
        <div
          className="absolute -inset-10 rounded-full"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, rgba(253,224,71,0.6) 0deg 8deg, transparent 8deg 30deg)",
            WebkitMaskImage:
              "radial-gradient(circle, black 28%, transparent 68%)",
            maskImage: "radial-gradient(circle, black 28%, transparent 68%)",
            animation: "hero-spin 42s linear infinite",
          }}
        />
      </div>

      {/* Drifting clouds */}
      <div
        className="absolute top-[14%] left-0 w-28 h-7 sm:w-40 sm:h-9 bg-white/85 rounded-full blur-[3px]"
        style={{ animation: "hero-drift 34s linear infinite" }}
      />
      <div
        className="absolute top-[30%] left-0 w-20 h-5 sm:w-28 sm:h-7 bg-white/70 rounded-full blur-[3px]"
        style={{ animation: "hero-drift 48s linear infinite", animationDelay: "-22s" }}
      />

      {/* Light beams from sun toward panels */}
      <div
        className="absolute top-[10%] right-[16%] w-40 sm:w-72 h-[46%] origin-top-right bg-gradient-to-b from-amber-200/50 to-transparent"
        style={{ transform: "rotate(38deg)", animation: "hero-glow-pulse 5s ease-in-out infinite" }}
      />

      {/* Ground */}
      <div className="absolute bottom-0 inset-x-0 h-[24%] bg-gradient-to-b from-lime-200 to-green-400" />
      <div className="absolute bottom-[24%] inset-x-0 h-px bg-green-600/30" />

      {/* Solar panel array with perspective tilt */}
      <div
        className="absolute inset-x-[5%] bottom-[12%] sm:inset-x-[10%]"
        style={{ perspective: "700px" }}
      >
        <div className="relative" style={{ transform: "rotateX(26deg)" }}>
          <svg viewBox="0 0 410 118" className="w-full h-auto drop-shadow-[0_10px_16px_rgba(30,58,138,0.45)]">
            {/* panel stands */}
            {[51, 153, 255, 357].map((x) => (
              <g key={x} stroke="#475569" strokeWidth="7" strokeLinecap="round">
                <line x1={x - 22} y1="118" x2={x} y2="96" />
                <line x1={x + 22} y1="118" x2={x} y2="96" />
              </g>
            ))}
            {/* 4 panels */}
            {[0, 1, 2, 3].map((i) => (
              <g key={i} transform={`translate(${i * 103},0)`}>
                <rect
                  x="4"
                  y="4"
                  width="96"
                  height="94"
                  rx="6"
                  fill="#1e3a8a"
                  stroke="#bfdbfe"
                  strokeWidth="2.5"
                />
                {[1, 2].map((r) => (
                  <line
                    key={`h${r}`}
                    x1="4"
                    y1={4 + r * 31.3}
                    x2="100"
                    y2={4 + r * 31.3}
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                ))}
                {[1, 2, 3].map((c) => (
                  <line
                    key={`v${c}`}
                    x1={4 + c * 24}
                    y1="4"
                    x2={4 + c * 24}
                    y2="98"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                ))}
                <rect x="4" y="4" width="96" height="94" rx="6" fill="url(#solar-cell-gloss)" />
              </g>
            ))}
            <defs>
              <linearGradient id="solar-cell-gloss" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
                <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          {/* Shimmer sweep across the panels */}
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <div
              className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent"
              style={{ animation: "hero-shimmer 4.5s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>

      {/* Caption chip */}
      <span className="absolute bottom-2 left-3 text-[10px] sm:text-xs font-semibold tracking-[0.25em] text-amber-900/80">
        SOLAR ENERGY
      </span>
    </HeroFrame>
  );
}
