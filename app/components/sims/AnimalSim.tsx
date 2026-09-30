// app/components/sims/AnimalSim.tsx
// Animal-kingdom body-plan explorer: each group is a stylized model built
// from a handful of primitives, with its key features labeled.

"use client";

import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

const ORDER = ["sponge", "jellyfish", "insect", "fish", "frog", "bird", "mammal"] as const;
type GroupKey = (typeof ORDER)[number];

const INFO: Record<GroupKey, { name: string; trait: string }> = {
  sponge: { name: "Sponge", trait: "No true tissues" },
  jellyfish: { name: "Jellyfish", trait: "Radial symmetry" },
  insect: { name: "Insect", trait: "Exoskeleton, 6 legs" },
  fish: { name: "Fish", trait: "Gills, fins" },
  frog: { name: "Frog", trait: "Amphibian: water + land" },
  bird: { name: "Bird", trait: "Feathers, beak" },
  mammal: { name: "Mammal", trait: "Hair, mammary glands" },
};

// Runs inside <Canvas>: slow turntable spin of the model.
function SpinAnimator({
  model,
  elapsed,
}: {
  model: RefObject<THREE.Group>;
  elapsed: RefObject<number>;
}) {
  useFrame((_, delta) => {
    elapsed.current += delta;
    if (model.current) model.current.rotation.y = elapsed.current * 0.25;
  });
  return null;
}

function Tag({
  position,
  children,
}: {
  position: [number, number, number];
  children: string;
}) {
  return (
    <Html
      center
      position={position}
      distanceFactor={13}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <div
        style={{
          whiteSpace: "nowrap",
          background: "rgba(0,0,0,0.6)",
          borderRadius: 6,
          padding: "2px 7px",
          fontSize: 10,
          fontWeight: 600,
          color: "#fff",
        }}
      >
        {children}
      </div>
    </Html>
  );
}

const SPONGE_PORES: [number, number, number][] = [];
for (let ring = 0; ring < 3; ring++) {
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + ring * 0.5;
    const r = 1.16 - ring * 0.07;
    SPONGE_PORES.push([Math.cos(a) * r, 0.6 + ring * 0.55, Math.sin(a) * r]);
  }
}

function SpongeModel() {
  return (
    <group>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[1.0, 1.35, 2.2, 24]} />
        <meshStandardMaterial color="#d9a648" roughness={0.9} />
      </mesh>
      {/* top opening (osculum) */}
      <mesh position={[0, 2.21, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.06, 20]} />
        <meshStandardMaterial color="#8a5a1e" roughness={1} />
      </mesh>
      {/* pores */}
      {SPONGE_PORES.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshStandardMaterial color="#7c4d16" roughness={1} />
        </mesh>
      ))}
      <Tag position={[0, 2.75, 0]}>no true tissues</Tag>
      <Tag position={[1.85, 1.1, 0]}>water flows through pores</Tag>
    </group>
  );
}

function JellyfishModel() {
  return (
    <group>
      {/* bell dome */}
      <mesh position={[0, 2.6, 0]} castShadow>
        <sphereGeometry args={[1.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#f472b6"
          transparent
          opacity={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* rim */}
      <mesh position={[0, 2.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.07, 10, 32]} />
        <meshStandardMaterial color="#ec4899" roughness={0.4} />
      </mesh>
      {/* tentacles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.95, 1.55, Math.sin(a) * 0.95]}>
            <cylinderGeometry args={[0.05, 0.03, 2.1, 8]} />
            <meshStandardMaterial color="#f9a8d4" roughness={0.5} />
          </mesh>
        );
      })}
      {/* oral arms */}
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 1.9, 0]}>
          <cylinderGeometry args={[0.12, 0.08, 1.2, 10]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.5} />
        </mesh>
      ))}
      <Tag position={[0, 4.3, 0]}>radial symmetry</Tag>
      <Tag position={[1.7, 1.4, 0]}>stinging tentacles</Tag>
    </group>
  );
}

function InsectModel() {
  return (
    <group>
      {/* abdomen / thorax / head along x */}
      <mesh position={[1.0, 0.9, 0]} scale={[1.35, 1, 1]} castShadow>
        <sphereGeometry args={[0.75, 24, 24]} />
        <meshStandardMaterial color="#92400e" roughness={0.6} />
      </mesh>
      <mesh position={[-0.15, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.55, 24, 20]} />
        <meshStandardMaterial color="#92400e" roughness={0.6} />
      </mesh>
      <mesh position={[-1.05, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.4, 20, 18]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>
      {/* 6 jointed legs */}
      {[-0.55, -0.1, 0.35].map((x) =>
        [-1, 1].map((s) => (
          <mesh
            key={`${x}${s}`}
            position={[x, 0.35, s * 0.55]}
            rotation={[s * 0.7, 0, 0.25]}
          >
            <cylinderGeometry args={[0.06, 0.045, 1.1, 8]} />
            <meshStandardMaterial color="#572c0c" roughness={0.6} />
          </mesh>
        ))
      )}
      {/* antennae */}
      {[-0.12, 0.12].map((z) => (
        <mesh key={z} position={[-1.35, 1.15, z]} rotation={[0, 0, 0.7]}>
          <cylinderGeometry args={[0.03, 0.02, 0.7, 6]} />
          <meshStandardMaterial color="#572c0c" roughness={0.6} />
        </mesh>
      ))}
      {/* wings */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.9, 1.62, s * 0.3]} rotation={[s * 0.2, 0, 0]}>
          <boxGeometry args={[1.2, 0.06, 0.5]} />
          <meshStandardMaterial
            color="#fde68a"
            transparent
            opacity={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}
      <Tag position={[0.2, 2.15, 0]}>exoskeleton</Tag>
      <Tag position={[1.9, 0.6, 0]}>6 jointed legs</Tag>
    </group>
  );
}

function FishModel() {
  return (
    <group>
      {/* streamlined body */}
      <mesh position={[0, 1.0, 0]} scale={[1.7, 0.75, 0.55]} castShadow>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.45} />
      </mesh>
      {/* tail fin */}
      <mesh position={[-1.95, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.18]}>
        <coneGeometry args={[0.55, 0.9, 16]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* dorsal fin */}
      <mesh position={[0.1, 1.85, 0]} scale={[1, 1, 0.18]}>
        <coneGeometry args={[0.4, 0.6, 12]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* gill slits */}
      {[0.75, 0.6, 0.45].map((x) => (
        <mesh key={x} position={[x, 1.0, 0.5]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#0369a1" roughness={0.6} />
        </mesh>
      ))}
      {/* eyes */}
      {[-0.38, 0.38].map((z) => (
        <mesh key={z} position={[1.15, 1.25, z]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color="#082f49" roughness={0.3} />
        </mesh>
      ))}
      <Tag position={[0.6, 1.75, 0]}>gills</Tag>
      <Tag position={[-1.95, 2.0, 0]}>fins</Tag>
    </group>
  );
}

function FrogModel() {
  return (
    <group>
      {/* body */}
      <mesh position={[0, 0.75, 0]} scale={[1.25, 0.8, 0.95]} castShadow>
        <sphereGeometry args={[0.9, 28, 20]} />
        <meshStandardMaterial color="#4ade80" roughness={0.55} />
      </mesh>
      {/* head */}
      <mesh position={[0.75, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.55, 24, 18]} />
        <meshStandardMaterial color="#4ade80" roughness={0.55} />
      </mesh>
      {/* eyes on top */}
      {[-0.28, 0.28].map((z) => (
        <mesh key={z} position={[0.85, 1.62, z]}>
          <sphereGeometry args={[0.16, 14, 14]} />
          <meshStandardMaterial color="#14532d" roughness={0.3} />
        </mesh>
      ))}
      {/* hind legs: thigh + calf, front legs */}
      {[-0.75, 0.75].map((z) => (
        <group key={z}>
          <mesh position={[-0.35, 0.55, z]} rotation={[0, 0, 1.1]}>
            <cylinderGeometry args={[0.16, 0.13, 1.0, 12]} />
            <meshStandardMaterial color="#22c55e" roughness={0.6} />
          </mesh>
          <mesh position={[-0.85, 0.28, z]} rotation={[0, 0, 0.35]}>
            <cylinderGeometry args={[0.12, 0.1, 0.9, 12]} />
            <meshStandardMaterial color="#22c55e" roughness={0.6} />
          </mesh>
          <mesh position={[0.75, 0.35, z * 0.8]} rotation={[0, 0, -0.15]}>
            <cylinderGeometry args={[0.1, 0.08, 0.7, 10]} />
            <meshStandardMaterial color="#22c55e" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <Tag position={[0, 2.2, 0]}>amphibian: water + land</Tag>
      <Tag position={[-1.5, 1.0, 0]}>strong hind legs</Tag>
    </group>
  );
}

function BirdModel() {
  return (
    <group>
      {/* body */}
      <mesh position={[0, 0.95, 0]} scale={[1.15, 0.95, 0.85]} castShadow>
        <sphereGeometry args={[0.8, 28, 20]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.6} />
      </mesh>
      {/* head */}
      <mesh position={[0.75, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.45, 24, 18]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.6} />
      </mesh>
      {/* beak */}
      <mesh position={[1.25, 1.5, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.16, 0.45, 14]} />
        <meshStandardMaterial color="#f97316" roughness={0.5} />
      </mesh>
      {/* eyes */}
      {[-0.3, 0.3].map((z) => (
        <mesh key={z} position={[0.9, 1.68, z]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#451a03" roughness={0.3} />
        </mesh>
      ))}
      {/* wings */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 1.15, s * 0.85]} rotation={[s * 0.25, 0, 0]}>
          <boxGeometry args={[1.1, 0.08, 0.7]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.65} />
        </mesh>
      ))}
      {/* tail */}
      <mesh position={[-0.95, 1.05, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.7, 0.07, 0.4]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.65} />
      </mesh>
      {/* legs */}
      {[-0.25, 0.25].map((z) => (
        <mesh key={z} position={[0.15, 0.3, z]}>
          <cylinderGeometry args={[0.05, 0.04, 0.6, 8]} />
          <meshStandardMaterial color="#b45309" roughness={0.6} />
        </mesh>
      ))}
      <Tag position={[0, 2.3, 0]}>feathers</Tag>
      <Tag position={[1.5, 1.95, 0]}>beak</Tag>
    </group>
  );
}

function MammalModel() {
  return (
    <group>
      {/* body */}
      <mesh position={[0, 0.95, 0]} scale={[1.55, 0.85, 0.8]} castShadow>
        <sphereGeometry args={[0.85, 28, 20]} />
        <meshStandardMaterial color="#b08968" roughness={0.8} />
      </mesh>
      {/* head */}
      <mesh position={[1.35, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.5, 24, 18]} />
        <meshStandardMaterial color="#b08968" roughness={0.8} />
      </mesh>
      {/* ears */}
      {[-0.22, 0.22].map((z) => (
        <mesh key={z} position={[1.3, 1.95, z]} rotation={[0, 0, -0.15]}>
          <coneGeometry args={[0.14, 0.35, 12]} />
          <meshStandardMaterial color="#8a6a4a" roughness={0.8} />
        </mesh>
      ))}
      {/* snout */}
      <mesh position={[1.78, 1.35, 0]} scale={[1.2, 0.8, 0.8]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color="#8a6a4a" roughness={0.8} />
      </mesh>
      {/* 4 legs */}
      {[
        [0.75, -0.45],
        [0.75, 0.45],
        [-0.75, -0.45],
        [-0.75, 0.45],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]}>
          <cylinderGeometry args={[0.13, 0.11, 0.7, 12]} />
          <meshStandardMaterial color="#8a6a4a" roughness={0.8} />
        </mesh>
      ))}
      {/* tail */}
      <mesh position={[-1.45, 1.0, 0]} rotation={[0, 0, 1.0]}>
        <cylinderGeometry args={[0.06, 0.04, 0.9, 8]} />
        <meshStandardMaterial color="#8a6a4a" roughness={0.8} />
      </mesh>
      <Tag position={[0, 2.35, 0]}>hair / fur</Tag>
      <Tag position={[0.4, 0.5, 0.95]}>mammary glands</Tag>
    </group>
  );
}

export function AnimalSim(props: SimProps) {
  const raw = String(props.group ?? "fish");
  const group: GroupKey = (ORDER as readonly string[]).includes(raw)
    ? (raw as GroupKey)
    : "fish";
  const info = INFO[group];

  const model = useRef<THREE.Group>(null!);
  const elapsed = useRef(0);

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Group", info.name],
          ["Defining trait", info.trait],
        ]}
      />
      <SimCanvas cameraPosition={[0, 2.5, 10]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 30]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>

        <group ref={model}>
          {group === "sponge" && <SpongeModel />}
          {group === "jellyfish" && <JellyfishModel />}
          {group === "insect" && <InsectModel />}
          {group === "fish" && <FishModel />}
          {group === "frog" && <FrogModel />}
          {group === "bird" && <BirdModel />}
          {group === "mammal" && <MammalModel />}
        </group>
        <SpinAnimator model={model} elapsed={elapsed} />
      </SimCanvas>
    </div>
  );
}
