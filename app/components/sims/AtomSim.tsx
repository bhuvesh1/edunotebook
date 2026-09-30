// app/components/sims/AtomSim.tsx
// Bohr atom: nucleus + electrons orbiting on shells.
// Element selector: H (1e⁻), He (2e⁻), Li (2+1e⁻).

"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

const ELEMENTS: Record<string, { name: string; z: number; shells: number[]; config: string }> = {
  H: { name: "Hydrogen", z: 1, shells: [1], config: "1s¹" },
  He: { name: "Helium", z: 2, shells: [2], config: "1s²" },
  Li: { name: "Lithium", z: 3, shells: [2, 1], config: "1s² 2s¹" },
};

const SHELL_RADIUS = [1.7, 3.0];

function ElectronShell({ radius, count, shellIndex }: { radius: number; count: number; shellIndex: number }) {
  const electrons = useRef<(THREE.Mesh | null)[]>([]);
  const angles = useRef<number[]>(Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2));

  useFrame((_, delta) => {
    const w = 1.4 / (shellIndex + 1);
    for (let i = 0; i < count; i++) {
      angles.current[i] += w * delta;
      const e = electrons.current[i];
      if (e) {
        e.position.set(
          Math.cos(angles.current[i]) * radius,
          0,
          Math.sin(angles.current[i]) * radius
        );
      }
    }
  });

  return (
    <group>
      {/* shell ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.022, 8, 72]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.45} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            electrons.current[i] = m;
          }}
        >
          <sphereGeometry args={[0.17, 20, 20]} />
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#2563eb"
            emissiveIntensity={1.2}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

export function AtomSim(props: SimProps) {
  const key = String(props.element ?? "H");
  const el = ELEMENTS[key] ?? ELEMENTS.H;

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Element", `${el.name} (${key})`],
          ["Electrons", `${el.z}`],
          ["Config", el.config],
        ]}
      />
      <SimCanvas cameraPosition={[0, 4.5, 9.5]} target={[0, 0, 0]}>
        {/* nucleus */}
        <mesh>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#7f1d1d"
            emissiveIntensity={0.6}
            roughness={0.35}
          />
        </mesh>
        {/* nucleus surface texture: proton bumps */}
        {Array.from({ length: 10 }).map((_, i) => {
          const th = (i / 10) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(th) * 0.48, Math.sin(i * 2.3) * 0.3, Math.sin(th) * 0.48]}
            >
              <sphereGeometry args={[0.14, 12, 12]} />
              <meshStandardMaterial color="#f87171" roughness={0.4} />
            </mesh>
          );
        })}
        {el.shells.map((count, si) => (
          <ElectronShell key={`${key}-${si}`} radius={SHELL_RADIUS[si]} count={count} shellIndex={si} />
        ))}
      </SimCanvas>
    </div>
  );
}
