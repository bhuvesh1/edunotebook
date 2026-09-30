// app/components/sims/EcosystemSim.tsx
// Ecological pyramid: 4 stacked trophic levels with energy-flow
// particles that shrink in count per level (the 10% rule).

"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

interface LayerDef {
  key: string;
  name: string;
  color: string;
  half: number; // half-width of the box
  energy: string;
}

const LAYERS: LayerDef[] = [
  { key: "producers", name: "Producers", color: "#22c55e", half: 2.6, energy: "100%" },
  { key: "primary", name: "Primary consumers", color: "#a3e635", half: 1.95, energy: "10%" },
  { key: "secondary", name: "Secondary consumers", color: "#f97316", half: 1.3, energy: "1%" },
  { key: "tertiary", name: "Tertiary (apex)", color: "#ef4444", half: 0.65, energy: "0.1%" },
];

const LAYER_H = 1.5;
const LAYER_GAP = 0.25;
const BASE_Y = 0.3;
const centerY = (i: number) => BASE_Y + LAYER_H / 2 + i * (LAYER_H + LAYER_GAP);

// Particle counts per layer — roughly the 10% rule of energy transfer.
const PARTICLE_COUNTS = [20, 10, 5, 2];

interface Particle {
  layer: number;
  x: number;
  z: number;
  speed: number;
  offset: number;
}

// Runs inside <Canvas> (R3F hooks are only valid there).
function ParticleFlow({ enabled }: { enabled: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const elapsed = useRef(0);

  const particles = useMemo<Particle[]>(() => {
    const arr: Particle[] = [];
    LAYERS.forEach((layer, li) => {
      const n = PARTICLE_COUNTS[li];
      for (let i = 0; i < n; i++) {
        arr.push({
          layer: li,
          x: (Math.random() * 2 - 1) * (layer.half - 0.2),
          z: (Math.random() * 2 - 1) * (layer.half - 0.2),
          speed: 0.35 + Math.random() * 0.3,
          offset: Math.random(),
        });
      }
    });
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!enabled) return;
    elapsed.current += delta;
    particles.forEach((p, i) => {
      const m = refs.current[i];
      if (!m) return;
      const bottom = centerY(p.layer) - LAYER_H / 2;
      const t = (p.offset + elapsed.current * p.speed * 0.22) % 1;
      m.position.y = bottom + t * LAYER_H;
    });
  });

  if (!enabled) return null;

  return (
    <group>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          position={[p.x, centerY(p.layer) - LAYER_H / 2, p.z]}
        >
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#facc15"
            emissiveIntensity={1.8}
          />
        </mesh>
      ))}
    </group>
  );
}

function LayerLabel({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html position={position} center distanceFactor={14} style={{ pointerEvents: "none" }}>
      <div className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
        {text}
      </div>
    </Html>
  );
}

export function EcosystemSim(props: SimProps) {
  const level = String(props.level ?? "all");
  const flow = String(props.flow ?? "on");

  const selected = LAYERS.find((l) => l.key === level) ?? null;
  const levelLabel = selected ? selected.name : "All levels";
  const energyLabel = selected ? selected.energy : "100% → 0.1%";

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Trophic level", levelLabel],
          ["Energy available", energyLabel],
        ]}
      />
      <SimCanvas cameraPosition={[8, 6, 10]} target={[0, 3.4, 0]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 24]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>

        {/* pyramid layers */}
        {LAYERS.map((layer, i) => {
          const highlighted = level === "all" || level === layer.key;
          return (
            <group key={layer.key}>
              <mesh position={[0, centerY(i), 0]} castShadow>
                <boxGeometry args={[layer.half * 2, LAYER_H, layer.half * 2]} />
                <meshStandardMaterial
                  color={layer.color}
                  roughness={0.6}
                  transparent
                  opacity={highlighted ? 0.95 : 0.45}
                  emissive={layer.color}
                  emissiveIntensity={highlighted ? 0.35 : 0.05}
                />
              </mesh>
              <LayerLabel
                position={[layer.half + 1.1, centerY(i), 0]}
                text={`${layer.name} · ${layer.energy}`}
              />
            </group>
          );
        })}

        {/* rising energy particles */}
        <ParticleFlow enabled={flow === "on"} />
      </SimCanvas>
    </div>
  );
}
