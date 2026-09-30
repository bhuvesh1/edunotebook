"use client";

import { HeroFrame } from "./HeroFrame";

interface GearProps {
  left: string;
  top: string;
  size: number;
  teeth: number;
  duration: number;
  reverse?: boolean;
  color: string;
}

/** A meshing-style gear drawn in SVG, rotated with CSS. */
function Gear({ left, top, size, teeth, duration, reverse = false, color }: GearProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${color}`}
      style={{ left, top, width: size, height: size }}
      aria-hidden="true"
    >
      <g
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          animation: `${reverse ? "hero-spin-rev" : "hero-spin"} ${duration}s linear infinite`,
        }}
      >
        {Array.from({ length: teeth }).map((_, i) => (
          <rect
            key={i}
            x="55"
            y="4"
            width="10"
            height="18"
            rx="2.5"
            fill="currentColor"
            transform={`rotate(${(360 / teeth) * i} 60 60)`}
          />
        ))}
        <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="11" />
        {[0, 60, 120].map((a) => (
          <line
            key={a}
            x1="60"
            y1="60"
            x2={60 + 34 * Math.cos((a * Math.PI) / 180)}
            y2={60 + 34 * Math.sin((a * Math.PI) / 180)}
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
          />
        ))}
        <circle cx="60" cy="60" r="12" fill="none" stroke="currentColor" strokeWidth="7" />
      </g>
    </svg>
  );
}

/**
 * Engineering hero — blueprint sheet with three meshing gears
 * turning at different speeds, plus drafting dimension lines.
 */
export function BlueprintHero({ slug }: { slug: string }) {
  return (
    <HeroFrame
      slug={slug}
      label="Engineering blueprint with rotating gears"
      className="bg-[#1d4ed8]"
    >
      {/* blueprint grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.13) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)",
          backgroundSize: "140px 140px",
        }}
      />

      {/* meshing gears */}
      <Gear left="30%" top="56%" size={150} teeth={12} duration={16} color="text-amber-300" />
      <Gear left="54%" top="38%" size={104} teeth={10} duration={11} reverse color="text-slate-100" />
      <Gear left="72%" top="64%" size={80} teeth={8} duration={8} color="text-sky-200" />
      <Gear left="82%" top="26%" size={56} teeth={8} duration={6.5} reverse color="text-amber-200" />

      {/* dimension line */}
      <div className="absolute bottom-[14%] inset-x-[8%] hidden sm:block">
        <div className="border-t-2 border-dashed border-white/60" />
        <div className="flex justify-between text-[10px] font-mono text-white/70 mt-1">
          <span>0</span>
          <span>SCALE 1:1</span>
          <span>120</span>
        </div>
      </div>

      {/* drafting caption */}
      <span className="absolute top-3 left-3 text-[10px] sm:text-xs font-mono tracking-[0.3em] text-white/85">
        DWG-2026-001
      </span>
      <span className="absolute bottom-2 right-3 text-[10px] sm:text-xs font-mono tracking-[0.25em] text-white/70">
        MECHANICAL
      </span>
    </HeroFrame>
  );
}
