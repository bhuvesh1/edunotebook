// app/components/sims/SimCanvas.tsx
// Shared R3F canvas for all sims: capped DPR, studio lighting, orbit controls.
// Never use drei <Environment preset=...> here — it downloads HDRs from a CDN
// at runtime. StudioEnvironment (Lightformers) + these lights are fully offline.

"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { ReactNode } from "react";
import { StudioEnvironment, StudioPerf, StudioPost, StudioShadows } from "./StudioEffects";

interface SimCanvasProps {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  target?: [number, number, number];
  background?: string;
  /** Soft floor shadow — only for sims that sit on a ground plane. */
  contactShadows?: boolean;
}

export function SimCanvas({
  children,
  cameraPosition = [8, 5, 11],
  target = [0, 1.5, 0],
  background = "#0b1020",
  contactShadows = false,
}: SimCanvasProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      shadows
      camera={{ position: cameraPosition, fov: 45 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#e8f0ff", "#1a2338", 0.55]} />
      <directionalLight
        position={[7, 12, 7]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-6, 4, -6]} intensity={0.35} />
      <StudioEnvironment />
      {children}
      {contactShadows ? <StudioShadows /> : null}
      <StudioPerf />
      <StudioPost />
      <OrbitControls
        makeDefault
        target={target}
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI * 0.55}
        minDistance={3}
        maxDistance={40}
      />
    </Canvas>
  );
}

/** Small live-readout chips overlaid in the viewport corner. */
export function SimReadout({ items }: { items: [string, string][] }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg bg-black/55 px-2.5 py-1.5 text-xs text-slate-100 backdrop-blur-sm"
        >
          <span className="text-slate-400">{label}: </span>
          <span className="font-semibold text-amber-300">{value}</span>
        </div>
      ))}
    </div>
  );
}
