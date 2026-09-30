"use client";

import { useMemo } from "react";
import { HeroFrame } from "./HeroFrame";

/**
 * Chemistry hero — a scientist's bench moment: beaker with bubbling
 * liquid (animated wave surface + rising bubbles) and a tilted flask
 * pouring a glowing stream into it.
 */
export function LabHero({ slug }: { slug: string }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        cx: 64 + ((i * 53) % 72),
        delay: (i * 0.47) % 3,
        duration: 2.2 + ((i * 29) % 20) / 10,
        r: 2 + ((i * 31) % 7) / 2,
      })),
    []
  );

  const molecules = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        left: 6 + ((i * 167) % 88),
        top: 8 + ((i * 89) % 34),
        delay: (i * 0.9) % 4,
        duration: 5 + ((i * 37) % 30) / 10,
        size: 5 + ((i * 23) % 9),
      })),
    []
  );

  return (
    <HeroFrame
      slug={slug}
      label="Chemistry lab: bubbling beaker with liquid being poured in"
      className="bg-gradient-to-b from-slate-50 via-cyan-50 to-emerald-50"
    >
      {/* floating molecule dots */}
      {molecules.map((m, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-emerald-300/50"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            animation: `hero-float ${m.duration}s ease-in-out ${m.delay}s infinite`,
          }}
        />
      ))}

      {/* lab bench */}
      <div className="absolute bottom-0 inset-x-0 h-[16%] bg-gradient-to-b from-amber-100 to-amber-200 border-t-2 border-amber-300/70" />

      {/* pouring flask (tilted) */}
      <div
        className="absolute left-[10%] sm:left-[16%] top-[6%] w-16 sm:w-20"
        style={{ transform: "rotate(-28deg)" }}
      >
        <div className="rounded-t-lg border-4 border-b-0 border-slate-400 bg-white/40 h-6 w-8 mx-auto" />
        <div className="relative rounded-b-3xl border-4 border-slate-400 bg-white/30 h-16 sm:h-20 overflow-hidden">
          <div
            className="absolute bottom-0 inset-x-0 h-[55%] bg-gradient-to-t from-emerald-500 to-emerald-300"
            style={{ transform: "rotate(28deg) scale(1.4)", transformOrigin: "bottom center" }}
          />
        </div>
      </div>

      {/* pouring stream */}
      <div
        className="absolute left-[21%] sm:left-[25%] top-[26%] w-1.5 h-[22%] rounded-full bg-gradient-to-b from-emerald-400 to-emerald-300/20"
        style={{ animation: "hero-glow-pulse 1.4s ease-in-out infinite" }}
      />
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute left-[21%] sm:left-[25%] top-[24%] w-1.5 h-1.5 rounded-full bg-emerald-400"
          style={{ animation: `hero-drip 1.2s ease-in ${i * 0.4}s infinite` }}
        />
      ))}

      {/* beaker */}
      <svg
        viewBox="0 0 200 250"
        className="absolute left-1/2 -translate-x-1/2 bottom-[10%] h-[68%] sm:h-[74%]"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="lab-beaker-clip">
            <path d="M62 62 L54 210 Q54 224 68 224 L132 224 Q146 224 146 210 L138 62 Z" />
          </clipPath>
          <linearGradient id="lab-liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6ee7b7" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* liquid body */}
        <g clipPath="url(#lab-beaker-clip)">
          <rect x="50" y="120" width="100" height="110" fill="url(#lab-liquid)" opacity="0.9" />
          {/* animated wave surface (period 30px, slides -60px for a seamless loop) */}
          <path
            d="M40 118 q15 -10 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V232 H40 Z"
            fill="#a7f3d0"
            opacity="0.85"
            style={{ animation: "hero-wave-slide 2.6s linear infinite" }}
          />
          {/* rising bubbles */}
          {bubbles.map((b, i) => (
            <circle
              key={i}
              cx={b.cx}
              cy={205}
              r={b.r}
              fill="rgba(255,255,255,0.6)"
              style={{
                transformBox: "fill-box",
                animation: `hero-bubble ${b.duration}s ease-in ${b.delay}s infinite`,
              }}
            />
          ))}
        </g>

        {/* glass outline */}
        <path
          d="M62 62 L54 210 Q54 224 68 224 L132 224 Q146 224 146 210 L138 62"
          fill="rgba(255,255,255,0.10)"
          stroke="#94a3b8"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <line x1="50" y1="62" x2="150" y2="62" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
        {/* measurement ticks */}
        {[150, 175, 200].map((y) => (
          <line key={y} x1="58" y1={y} x2="70" y2={y} stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        ))}
        {/* H2O label */}
        <text x="100" y="180" textAnchor="middle" fontSize="20" fill="rgba(255,255,255,0.85)" fontFamily="Georgia, serif" fontStyle="italic">
          H₂O
        </text>
      </svg>

      {/* caption chip */}
      <span className="absolute bottom-2 left-3 text-[10px] sm:text-xs font-semibold tracking-[0.25em] text-emerald-900/70">
        CHEMISTRY LAB
      </span>
    </HeroFrame>
  );
}
