// app/components/sims/StudioEffects.tsx
// Shared realism layer for every 3D canvas: offline studio environment
// (procedural Lightformers, NO CDN HDRI), soft contact shadows, and light
// postprocessing (bloom, vignette, filmic tone mapping). Keep it cheap:
// one env bake, no SSAO, adaptive DPR.

"use client";

import { AdaptiveDpr, ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

export function StudioEnvironment({ intensity = 0.9 }: { intensity?: number }) {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={intensity}>
      <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
      <Lightformer form="rect" intensity={2} position={[-7, 3, 4]} rotation-y={Math.PI / 2} scale={[10, 5, 1]} color="#cfe0ff" />
      <Lightformer form="rect" intensity={1.5} position={[7, 2, -4]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} color="#ffe6c4" />
      <Lightformer form="ring" intensity={2} position={[0, 4, -9]} scale={6} color="#ffffff" />
    </Environment>
  );
}

export function StudioShadows({ y = 0.01, size = 30 }: { y?: number; size?: number }) {
  return (
    <ContactShadows
      position={[0, y, 0]}
      opacity={0.55}
      scale={size}
      blur={2.4}
      far={8}
      resolution={512}
      frames={1}
    />
  );
}

// Weak devices (<=4 cores, typical low-end phones) skip MSAA to stay smooth.
const LOW_END =
  typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) <= 4;

export function StudioPost() {
  return (
    <EffectComposer multisampling={LOW_END ? 0 : 4}>
      <Bloom intensity={0.22} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette eskil={false} offset={0.2} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

export function StudioPerf() {
  return <AdaptiveDpr pixelated={false} />;
}
