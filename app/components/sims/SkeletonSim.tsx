// app/components/sims/SkeletonSim.tsx
// Stylized human skeleton built from primitives. Selecting a region
// highlights its bones with an amber emissive glow.

"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

const REGIONS = ["skull", "spine", "ribcage", "arm", "leg"] as const;
type Region = (typeof REGIONS)[number];

const REGION_LABELS: Record<string, string> = {
  all: "All regions",
  skull: "Skull",
  spine: "Spine",
  ribcage: "Ribcage",
  arm: "Arms",
  leg: "Legs",
};

const REGION_BONES: Record<string, string> = {
  all: "206 bones",
  skull: "22 bones",
  spine: "26 bones",
  ribcage: "25 bones",
  arm: "60 bones (30 × 2)",
  leg: "60 bones (30 × 2)",
};

function boneMaterial(region: Region, selected: string) {
  const m = new THREE.MeshStandardMaterial({
    color: "#ece5d8",
    roughness: 0.55,
    metalness: 0.05,
  });
  if (selected === "all" || selected === region) {
    m.emissive = new THREE.Color("#f59e0b");
    m.emissiveIntensity = 0.5;
  }
  return m;
}

function BoneLabel({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html position={position} center distanceFactor={13} style={{ pointerEvents: "none" }}>
      <div className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
        {text}
      </div>
    </Html>
  );
}

export function SkeletonSim(props: SimProps) {
  const region = String(props.region ?? "all");
  const labels = String(props.labels ?? "on");

  const mats = useMemo(
    () => ({
      skull: boneMaterial("skull", region),
      spine: boneMaterial("spine", region),
      ribcage: boneMaterial("ribcage", region),
      arm: boneMaterial("arm", region),
      leg: boneMaterial("leg", region),
    }),
    [region]
  );

  const dark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.8 }),
    []
  );

  const ribs = useMemo(
    () => [0.74, 0.7, 0.64, 0.56, 0.47].map((r, i) => ({ r, y: 4.55 - i * 0.34 })),
    []
  );
  const vertebrae = useMemo(
    () => Array.from({ length: 8 }, (_, i) => 4.82 - i * 0.3),
    []
  );

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Region", REGION_LABELS[region] ?? "All regions"],
          ["Bones", REGION_BONES[region] ?? "206 bones"],
        ]}
      />
      <SimCanvas cameraPosition={[0, 3, 11]} target={[0, 2.8, 0]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 24]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>

        {/* skull */}
        <group>
          <mesh material={mats.skull} position={[0, 5.55, 0]} castShadow>
            <sphereGeometry args={[0.52, 32, 24]} />
          </mesh>
          <mesh material={mats.skull} position={[0, 5.08, 0.18]} castShadow>
            <boxGeometry args={[0.42, 0.22, 0.3]} />
          </mesh>
          {[-0.19, 0.19].map((x) => (
            <mesh key={x} material={dark} position={[x, 5.62, 0.44]}>
              <sphereGeometry args={[0.09, 16, 12]} />
            </mesh>
          ))}
        </group>

        {/* spine: 8 vertebrae */}
        {vertebrae.map((y, i) => (
          <mesh key={i} material={mats.spine} position={[0, y, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.24, 16]} />
          </mesh>
        ))}

        {/* ribcage: 5 arcs */}
        {ribs.map(({ r, y }, i) => (
          <mesh
            key={i}
            material={mats.ribcage}
            position={[0, y, 0]}
            rotation={[Math.PI / 2, 1.0, 0]}
            castShadow
          >
            <torusGeometry args={[r, 0.07, 12, 32, Math.PI * 1.65]} />
          </mesh>
        ))}

        {/* pelvis */}
        <mesh
          material={mats.leg}
          position={[0, 2.42, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1.15, 0.8, 1]}
          castShadow
        >
          <torusGeometry args={[0.5, 0.16, 14, 32]} />
        </mesh>

        {/* arms */}
        {[1, -1].map((s) => (
          <group key={s}>
            <mesh
              material={mats.arm}
              position={[s * 1.18, 4.02, 0]}
              rotation={[0, 0, s * 0.16]}
              castShadow
            >
              <cylinderGeometry args={[0.11, 0.11, 0.95, 14]} />
            </mesh>
            <mesh material={mats.arm} position={[s * 1.32, 3.5, 0]}>
              <sphereGeometry args={[0.11, 16, 12]} />
            </mesh>
            <mesh
              material={mats.arm}
              position={[s * 1.38, 3.05, 0]}
              rotation={[0, 0, s * 0.1]}
              castShadow
            >
              <cylinderGeometry args={[0.09, 0.09, 0.85, 14]} />
            </mesh>
            <mesh material={mats.arm} position={[s * 1.42, 2.58, 0]} castShadow>
              <sphereGeometry args={[0.16, 16, 12]} />
            </mesh>
          </group>
        ))}

        {/* legs */}
        {[1, -1].map((s) => (
          <group key={s}>
            <mesh material={mats.leg} position={[s * 0.34, 1.58, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 1.15, 14]} />
            </mesh>
            <mesh material={mats.leg} position={[s * 0.34, 0.98, 0]}>
              <sphereGeometry args={[0.13, 16, 12]} />
            </mesh>
            <mesh material={mats.leg} position={[s * 0.34, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.11, 0.11, 1.0, 14]} />
            </mesh>
            <mesh material={mats.leg} position={[s * 0.34, 0.07, 0.15]} castShadow>
              <boxGeometry args={[0.26, 0.14, 0.52]} />
            </mesh>
          </group>
        ))}

        {/* labels */}
        {labels === "on" && (
          <group>
            <BoneLabel position={[0.8, 5.8, 0]} text="Skull" />
            <BoneLabel position={[0.55, 3.7, 0]} text="Spine" />
            <BoneLabel position={[1.15, 4.25, 0]} text="Ribcage" />
            <BoneLabel position={[1.78, 4.05, 0]} text="Humerus" />
            <BoneLabel position={[1.98, 2.58, 0]} text="Hand" />
            <BoneLabel position={[-1.05, 2.42, 0]} text="Pelvis" />
            <BoneLabel position={[-0.88, 1.58, 0]} text="Femur" />
            <BoneLabel position={[0.9, 0.15, 0.15]} text="Foot" />
          </group>
        )}
      </SimCanvas>
    </div>
  );
}
