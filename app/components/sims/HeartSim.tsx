// app/components/sims/HeartSim.tsx
// Stylized 3D heart built from procedural geometry, pulsing with a
// lub-dub beat at the selected heart rate. Key parts labelled with
// overlay chips (Aorta, Left Ventricle, Right Ventricle).

"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import { makeGlowTexture } from "../../../lib/simulations/textures";
import type { SimProps } from "./sim-props";

function Chip({ label, className }: { label: string; className: string }) {
  return (
    <div
      className={`pointer-events-none absolute z-10 flex items-center gap-1.5 ${className}`}
    >
      <span className="h-2 w-2 rounded-full bg-rose-400 ring-2 ring-rose-200/60" />
      <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-rose-100 backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}

export function HeartSim(props: SimProps) {
  const rate = Number(props.rate ?? 72);
  const heart = useRef<THREE.Group>(null!);
  const elapsed = useRef(0);
  const glow = useMemo(() => makeGlowTexture("#ff8a8a", "rgba(200,40,40,0)"), []);

  useFrame((_, delta) => {
    elapsed.current += delta;
    // lub-dub: two thumps per cardiac cycle
    const ph = (elapsed.current * rate * Math.PI * 2) / 60;
    const lub = Math.pow(Math.max(0, Math.sin(ph)), 8);
    const dub = Math.pow(Math.max(0, Math.sin(ph - 0.85)), 8);
    heart.current.scale.setScalar(1 + 0.09 * (lub + 0.55 * dub));
  });

  const muscle = {
    color: "#c62828",
    roughness: 0.38,
    metalness: 0.05,
  } as const;

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Heart rate", `${rate} bpm`],
          ["Cycle", `${(60 / rate).toFixed(2)} s`],
        ]}
      />
      <Chip label="Aorta" className="left-1/2 top-[8%] -translate-x-1/2" />
      <Chip label="Left ventricle" className="left-[8%] top-[62%]" />
      <Chip label="Right ventricle" className="right-[8%] top-[62%]" />

      <SimCanvas cameraPosition={[0, 0.9, 7.2]} target={[0, 0.5, 0]}>
        {/* soft red halo behind the heart */}
        <sprite position={[0, 0.5, -1.5]} scale={[7, 7, 1]}>
          <spriteMaterial map={glow} transparent depthWrite={false} opacity={0.55} />
        </sprite>

        <group ref={heart}>
          {/* upper lobes */}
          <mesh position={[-0.33, 0.5, 0]} castShadow>
            <sphereGeometry args={[0.63, 32, 32]} />
            <meshStandardMaterial {...muscle} />
          </mesh>
          <mesh position={[0.33, 0.5, 0]} castShadow>
            <sphereGeometry args={[0.63, 32, 32]} />
            <meshStandardMaterial {...muscle} />
          </mesh>
          {/* lower cone (ventricles) */}
          <mesh position={[0, -0.55, 0]} rotation={[Math.PI, 0, 0]} castShadow>
            <coneGeometry args={[0.9, 1.75, 32]} />
            <meshStandardMaterial {...muscle} />
          </mesh>
          {/* aorta arch */}
          <mesh position={[0.02, 1.28, 0]} castShadow>
            <torusGeometry args={[0.42, 0.15, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#d64545" roughness={0.35} />
          </mesh>
          {/* pulmonary trunk */}
          <mesh position={[-0.42, 1.05, 0.1]} rotation={[0, 0, 0.5]} castShadow>
            <cylinderGeometry args={[0.13, 0.16, 0.8, 14]} />
            <meshStandardMaterial color="#d64545" roughness={0.35} />
          </mesh>
          {/* surface sheen: a few lighter patches */}
          <mesh position={[0.1, 0.1, 0.72]}>
            <sphereGeometry args={[0.34, 16, 16]} />
            <meshStandardMaterial color="#e05555" roughness={0.5} transparent opacity={0.85} />
          </mesh>
        </group>
      </SimCanvas>
    </div>
  );
}
