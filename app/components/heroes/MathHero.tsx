"use client";

import { useMemo } from "react";
import { HeroFrame } from "./HeroFrame";
import { useHeroCanvas } from "./use-hero-canvas";

/** Layered animated sine waves (canvas-2D, rAF). */
function WaveField() {
  const ref = useHeroCanvas((ctx, w, h, t) => {
    const mid = h * 0.56;
    // faint axis
    ctx.strokeStyle = "rgba(100,116,139,0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();
    ctx.setLineDash([]);

    const waves = [
      { amp: h * 0.1, k: (2 * Math.PI) / (w * 0.55), speed: 1.1, color: "rgba(79,70,229,0.85)", width: 2.5 },
      { amp: h * 0.14, k: (2 * Math.PI) / (w * 0.85), speed: -0.65, color: "rgba(14,165,233,0.5)", width: 2 },
      { amp: h * 0.06, k: (2 * Math.PI) / (w * 0.32), speed: 1.9, color: "rgba(236,72,153,0.45)", width: 2 },
    ];
    for (const wv of waves) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = mid + wv.amp * Math.sin(wv.k * x + t * wv.speed);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = wv.color;
      ctx.lineWidth = wv.width;
      ctx.stroke();
    }
  });
  return (
    <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
  );
}

/**
 * Mathematics hero — flowing sine waves, floating formulas,
 * and a compass drawing a circle (geometric construction).
 */
export function MathHero({ slug }: { slug: string }) {
  const formulas = useMemo(
    () =>
      [
        { s: "π", left: 8, top: 12, size: 30, delay: 0, dur: 6 },
        { s: "∑", left: 22, top: 62, size: 26, delay: 1.2, dur: 7 },
        { s: "e", left: 38, top: 18, size: 24, delay: 0.6, dur: 5.5 },
        { s: "∞", left: 55, top: 68, size: 28, delay: 2, dur: 6.5 },
        { s: "√2", left: 70, top: 14, size: 22, delay: 1.6, dur: 7.5 },
        { s: "φ", left: 84, top: 58, size: 26, delay: 0.3, dur: 6 },
        { s: "Δ", left: 12, top: 74, size: 22, delay: 2.4, dur: 5 },
        { s: "θ", left: 92, top: 30, size: 24, delay: 1, dur: 6.8 },
      ].map((f) => ({ ...f, left: `${f.left}%`, top: `${f.top}%` })),
    []
  );

  return (
    <HeroFrame
      slug={slug}
      label="Flowing sine waves with floating mathematical formulas"
      className="bg-[#fffdf5]"
    >
      {/* faint notebook rules inside the hero */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(207,220,240,0.45) 27px, rgba(207,220,240,0.45) 28px)",
        }}
      />

      <WaveField />

      {/* floating formulas */}
      {formulas.map((f, i) => (
        <span
          key={i}
          className="absolute font-hand font-bold text-indigo-900/60 select-none"
          style={{
            left: f.left,
            top: f.top,
            fontSize: f.size,
            animation: `hero-float ${f.dur}s ease-in-out ${f.delay}s infinite`,
          }}
        >
          {f.s}
        </span>
      ))}

      {/* compass construction */}
      <svg
        viewBox="0 0 120 120"
        className="absolute right-[5%] top-[6%] w-24 h-24 sm:w-32 sm:h-32"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="#4f46e9"
          strokeWidth="2.5"
          strokeDasharray="277"
          strokeDashoffset="277"
          style={{ animation: "hero-draw 3.2s ease-out forwards" }}
        />
        <circle cx="60" cy="60" r="44" fill="none" stroke="#c7d2fe" strokeWidth="1" strokeDasharray="4 5" />
        <line
          x1="60"
          y1="60"
          x2="104"
          y2="60"
          stroke="#ec4899"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            transformBox: "view-box",
            transformOrigin: "60px 60px",
            animation: "hero-spin 14s linear infinite",
          }}
        />
        <circle cx="60" cy="60" r="4" fill="#4f46e9" />
      </svg>

      {/* caption chip */}
      <span className="absolute bottom-2 left-3 text-[10px] sm:text-xs font-semibold tracking-[0.25em] text-indigo-900/60">
        PURE MATHEMATICS
      </span>
    </HeroFrame>
  );
}
