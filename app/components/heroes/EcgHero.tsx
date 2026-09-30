"use client";

import { HeroFrame } from "./HeroFrame";
import { useHeroCanvas } from "./use-hero-canvas";

/** Scrolling ECG trace (canvas-2D, rAF): P wave, QRS complex, T wave. */
function EcgTrace() {
  const ref = useHeroCanvas((ctx, w, h, t) => {
    const gauss = (p: number, c: number, s: number) =>
      Math.exp(-((p - c) * (p - c)) / (2 * s * s));
    const ecg = (p: number) =>
      0.14 * gauss(p, 0.16, 0.025) -
      0.18 * gauss(p, 0.4, 0.01) +
      1.0 * gauss(p, 0.445, 0.011) -
      0.28 * gauss(p, 0.49, 0.011) +
      0.32 * gauss(p, 0.7, 0.045);

    const period = Math.max(150, w * 0.42);
    const speed = period / 1.15; // one heartbeat ≈ 1.15 s
    const off = (t * speed) % period;

    // faint monitor grid
    ctx.strokeStyle = "rgba(74,222,128,0.09)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 0; gx <= w; gx += 26) {
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
    }
    for (let gy = 0; gy <= h; gy += 26) {
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
    }
    ctx.stroke();

    // trace
    const base = h * 0.58;
    const amp = h * 0.32;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const phase = ((((x + off) % period) + period) % period) / period;
      const y = base - ecg(phase) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(74,222,128,0.9)";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // glowing leading dot at the right edge
    const leadPhase = ((((w + off) % period) + period) % period) / period;
    ctx.beginPath();
    ctx.arc(w - 3, base - ecg(leadPhase) * amp, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#d1fae5";
    ctx.shadowColor = "rgba(74,222,128,1)";
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  return (
    <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
  );
}

/**
 * MBBS hero — a live ECG monitor: glowing heartbeat trace sweeping
 * across a dark medical screen, with BPM readout and a pulsing
 * medical cross badge.
 */
export function EcgHero({ slug }: { slug: string }) {
  return (
    <HeroFrame
      slug={slug}
      label="Animated ECG heartbeat trace on a medical monitor"
      className="bg-[#070d1a]"
    >
      <EcgTrace />

      {/* vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* HUD */}
      <span className="absolute top-3 left-3 text-[10px] sm:text-xs font-mono tracking-[0.3em] text-green-300/80">
        ECG · LEAD II
      </span>
      <span className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] sm:text-xs font-mono tracking-[0.2em] text-red-300">
        <span
          className="inline-block w-2 h-2 rounded-full bg-red-400"
          style={{ animation: "hero-blink 1.15s ease-in-out infinite" }}
        />
        72 BPM
      </span>

      {/* pulsing medical cross badge */}
      <div
        className="absolute bottom-4 right-4 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 border-2 border-red-400/80 flex items-center justify-center"
        style={{ animation: "hero-pulse 1.15s ease-in-out infinite" }}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true">
          <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" fill="#f87171" />
        </svg>
      </div>

      <span className="absolute bottom-2 left-3 text-[10px] sm:text-xs font-mono tracking-[0.25em] text-green-200/60">
        CARDIOLOGY
      </span>
    </HeroFrame>
  );
}
