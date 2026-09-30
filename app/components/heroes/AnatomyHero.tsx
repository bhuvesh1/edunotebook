"use client";

import { HeroFrame } from "./HeroFrame";
import { useHeroCanvas } from "./use-hero-canvas";

/** Rising energy particles around the silhouette (canvas-2D, rAF). */
function ParticleField() {
  const ref = useHeroCanvas((ctx, w, h, t) => {
    const N = 44;
    for (let i = 0; i < N; i++) {
      const speed = 0.1 + ((i * 37) % 10) / 55;
      const xBase = ((i * 173) % 100) / 100;
      const y = 1 - ((t * speed + i * 0.61803) % 1);
      const x = (((xBase + 0.035 * Math.sin(t * 1.6 + i)) % 1) + 1) % 1;
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 2.1);
      const edgeFade = Math.min(1, y * 5) * Math.min(1, (1 - y) * 8);
      ctx.beginPath();
      ctx.arc(x * w, y * h, 0.8 + ((i * 13) % 3) * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(103, 232, 249, ${(0.1 + 0.4 * tw * edgeFade).toFixed(3)})`;
      ctx.fill();
    }
  });
  return (
    <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
  );
}

/**
 * Biology hero — premium medical hologram of the human body:
 * glowing anatomy silhouette, pulsing heart, rising particles,
 * and a scanning light sweep. Inspired by animated anatomy viewers.
 */
export function AnatomyHero({ slug }: { slug: string }) {
  return (
    <HeroFrame
      slug={slug}
      label="Glowing human anatomy hologram with pulsing heart"
      className="bg-[radial-gradient(ellipse_at_center,#16213e_0%,#0a0f24_60%,#04060f_100%)]"
    >
      {/* faint scan grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(103,232,249,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.07) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      <ParticleField />

      {/* Anatomy silhouette */}
      <svg
        viewBox="0 0 220 440"
        className="absolute left-1/2 top-1/2 h-[92%] -translate-x-1/2 -translate-y-1/2"
        style={{ filter: "drop-shadow(0 0 12px rgba(103,232,249,0.55))" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="anat-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a5f3fc" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* head */}
        <circle cx="110" cy="40" r="22" fill="none" stroke="url(#anat-body)" strokeWidth="3" />
        {/* brain glow */}
        <circle
          cx="110"
          cy="40"
          r="9"
          fill="#f0abfc"
          opacity="0.9"
          style={{ animation: "hero-glow-pulse 3s ease-in-out infinite" }}
        />
        {/* body outline */}
        <path
          d="M110 64 C96 64 84 68 78 80 C74 88 72 100 72 112 L66 170 L64 200
             C64 206 68 210 72 208 L78 204 L82 170 L84 150
             C86 190 88 230 90 260 L92 340 L90 400
             C90 406 94 408 98 406 L102 380 L108 330 L112 330 L118 380
             C122 406 126 408 130 406 L128 340 L130 260
             C132 230 134 190 136 150 L138 170 L142 204 L148 208
             C152 210 156 206 156 200 L154 170 L148 112
             C148 100 146 88 142 80 C136 68 124 64 110 64 Z"
          fill="rgba(34,211,238,0.07)"
          stroke="url(#anat-body)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* spine */}
        <line
          x1="110"
          y1="92"
          x2="110"
          y2="300"
          stroke="#67e8f9"
          strokeWidth="2"
          strokeDasharray="6 8"
          opacity="0.7"
        />
        {/* pulsing heart */}
        <g
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            animation: "hero-pulse 1.1s ease-in-out infinite",
          }}
        >
          <path
            d="M110 172 C96 160 86 148 88 138 C90 130 98 128 104 134
               C107 137 109 140 110 142 C111 140 113 137 116 134
               C122 128 130 130 132 138 C134 148 124 160 110 172 Z"
            fill="#f87171"
            style={{ filter: "drop-shadow(0 0 10px rgba(248,113,113,0.95))" }}
          />
        </g>
      </svg>

      {/* scanning light sweep */}
      <div
        className="absolute inset-x-8 top-0 h-1/4 rounded-full bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent pointer-events-none"
        style={{ animation: "hero-scan 5.5s ease-in-out infinite" }}
      />

      {/* HUD captions */}
      <span className="absolute top-3 left-3 text-[10px] sm:text-xs font-mono tracking-[0.3em] text-cyan-300/80">
        HUMAN ANATOMY
      </span>
      <span className="absolute top-3 right-3 text-[10px] sm:text-xs font-mono tracking-[0.2em] text-rose-300/90">
        <span className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-1.5" style={{ animation: "hero-blink 1.1s ease-in-out infinite" }} />
        PULSE 72
      </span>
    </HeroFrame>
  );
}
