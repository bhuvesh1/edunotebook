"use client";

import dynamic from "next/dynamic";
import { HeroFrame } from "./HeroFrame";

/**
 * Realistic interactive 3D hero models — one per subject, rendered live with
 * Three.js (PBR materials, studio lighting, environment reflections).
 * No photos, no cartoon illustration. Loaded client-side only (no SSR / WebGL).
 */
const ModelHero = dynamic(() => import("./three/ModelHero"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-amber-200 to-rose-300 opacity-60" />
    </div>
  ),
});

const MODEL_LABELS: Record<string, string> = {
  physics: "Interactive 3D solar system model",
  biology: "Interactive 3D DNA double helix model",
  chemistry: "Interactive 3D benzene molecule model",
  mathematics: "Interactive 3D torus knot model",
  engineering: "Interactive 3D interlocking gears model",
  mbbs: "Interactive 3D beating heart model",
  dental: "Interactive 3D molar tooth model",
};

const MODEL_CAPTIONS: Record<string, string> = {
  physics: "SOLAR SYSTEM",
  biology: "DNA HELIX",
  chemistry: "BENZENE",
  mathematics: "TORUS KNOT",
  engineering: "GEAR TRAIN",
  mbbs: "HEART",
  dental: "MOLAR",
};

/** Renders the realistic 3D hero model for a subject slug. */
export function SubjectHero({ slug }: { slug: string }) {
  const label = MODEL_LABELS[slug] ?? `${slug} 3D model`;
  const caption = MODEL_CAPTIONS[slug] ?? slug.toUpperCase();

  return (
    <HeroFrame slug={slug} label={label}>
      <ModelHero slug={slug} />
      {/* Caption chip */}
      <span className="absolute bottom-3 left-4 text-[11px] sm:text-xs font-bold tracking-[0.3em] text-slate-700 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
        {caption}
      </span>
      {/* 3D badge */}
      <span className="absolute top-3 right-4 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-white">
        3D
      </span>
    </HeroFrame>
  );
}
