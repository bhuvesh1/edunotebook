// app/components/sims/WaveSim.tsx
// Animated transverse wave ribbon driven by wavePoint() from
// lib/simulations/physics.ts. Amplitude and frequency are live.

"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import { wavePoint } from "../../../lib/simulations/physics";
import type { SimProps } from "./sim-props";

const WIDTH = 12;
const SEGMENTS = 160;

// Module scope: one shared ribbon; vertices are recomputed every frame from
// wavePoint(), so sharing across mounts is safe. (Mutating a render-created
// geometry trips the react-hooks/immutability lint rule.)
const ribbonGeo = new THREE.PlaneGeometry(WIDTH, 1.1, SEGMENTS, 1);

export function WaveSim(props: SimProps) {
  const amplitude = Number(props.amplitude ?? 0.5);
  const frequency = Number(props.frequency ?? 1);

  const geo = ribbonGeo;
  const mesh = useRef<THREE.Mesh>(null!);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setY(i, wavePoint(x, elapsed.current, amplitude, frequency));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Amplitude", `${amplitude.toFixed(2)} m`],
          ["Frequency", `${frequency.toFixed(1)} Hz`],
          ["Period", `${(1 / frequency).toFixed(2)} s`],
        ]}
      />
      <SimCanvas cameraPosition={[0, 2.2, 10]} target={[0, 0, 0]}>
        {/* equilibrium axis */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, WIDTH + 1.5, 8]} />
          <meshBasicMaterial color="#475569" />
        </mesh>
        {/* the travelling wave ribbon */}
        <mesh ref={mesh} geometry={geo}>
          <meshStandardMaterial
            color="#22d3ee"
            emissive="#0e7490"
            emissiveIntensity={0.7}
            roughness={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* crest markers riding the wave */}
        <CrestDots amplitude={amplitude} frequency={frequency} />
      </SimCanvas>
    </div>
  );
}

/** Two glowing dots that ride the wave crests, showing energy transport. */
function CrestDots({ amplitude, frequency }: { amplitude: number; frequency: number }) {
  const dots = useRef<THREE.Group>(null!);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current;
    dots.current.children.forEach((child, i) => {
      const x = -4 + i * 4 + ((t * frequency) % 1) * 1; // drift with the wave
      child.position.set(x, wavePoint(x, t, amplitude, frequency), 0.12);
    });
  });
  return (
    <group ref={dots}>
      {[0, 1].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshBasicMaterial color="#fde047" />
        </mesh>
      ))}
    </group>
  );
}
