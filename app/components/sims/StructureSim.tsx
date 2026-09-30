// app/components/sims/StructureSim.tsx
// Beam bending lab: a cantilever or simply-supported beam built from 16
// segments, deflecting along the beam-theory curve under a downward point
// load whose arrow length scales with the load.

"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

type BeamType = "cantilever" | "simply-supported";

const L = 8;
const SEG = 16;
const BEAM_Y = 3.5;

// Normalized deflection shape, u = x/L in [0, 1] from the left end.
function shape(u: number, type: BeamType): number {
  if (type === "cantilever") return (u * u * (3 - u)) / 2;
  return 4 * u * (1 - u);
}

// d(shape)/dx, used to tilt each segment along the curve.
function shapeSlope(u: number, type: BeamType): number {
  if (type === "cantilever") return (1.5 * u * (2 - u)) / L;
  return (4 * (1 - 2 * u)) / L;
}

// Runs inside <Canvas> (R3F hooks are only valid there). Eases the deflection
// toward the load target, then poses every segment on the theory curve.
function BeamAnimator({
  segRefs,
  arrowRef,
  type,
  targetD,
}: {
  segRefs: RefObject<(THREE.Mesh | null)[]>;
  arrowRef: RefObject<THREE.Group | null>;
  type: BeamType;
  targetD: number;
}) {
  const d = useRef(targetD);
  useFrame((_, delta) => {
    d.current += (targetD - d.current) * Math.min(1, delta * 3);
    segRefs.current.forEach((m, i) => {
      if (!m) return;
      const u = (i + 0.5) / SEG;
      m.position.y = BEAM_Y - d.current * shape(u, type);
      m.rotation.z = Math.atan(-d.current * shapeSlope(u, type));
    });
    // The load acts where the shape is 1 (tip / midspan), so the arrow tip
    // follows the max deflection.
    if (arrowRef.current) {
      arrowRef.current.position.y = BEAM_Y - d.current + 0.25;
    }
  });
  return null;
}

function LoadArrow({ len, load }: { len: number; load: number }) {
  const shaftLen = Math.max(0.2, len - 0.5);
  return (
    <group>
      {/* head, pointing down */}
      <mesh position={[0, 0.25, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.28, 0.5, 16]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={0.6}
          roughness={0.4}
        />
      </mesh>
      {/* shaft */}
      <mesh position={[0, 0.5 + shaftLen / 2, 0]}>
        <cylinderGeometry args={[0.09, 0.09, shaftLen, 12]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={0.6}
          roughness={0.4}
        />
      </mesh>
      <Html
        position={[0, 0.5 + shaftLen + 0.5, 0]}
        center
        distanceFactor={12}
        style={{ pointerEvents: "none" }}
      >
        <div className="rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-slate-100 backdrop-blur-sm">
          {load} kN
        </div>
      </Html>
    </group>
  );
}

export function StructureSim(props: SimProps) {
  const rawType = String(props.beamType ?? "cantilever");
  const beamType: BeamType =
    rawType === "simply-supported" ? "simply-supported" : "cantilever";
  const rawLoad = Number(props.load ?? 40);
  const load = Number.isFinite(rawLoad)
    ? Math.min(100, Math.max(0, rawLoad))
    : 40;

  const segLen = L / SEG;
  const deltaMax = load * 0.012; // scene units at 100 kN → 1.2 units
  const arrowLen = 0.8 + load * 0.024;
  const loadX = beamType === "cantilever" ? L / 2 - 0.2 : 0;

  const segRefs = useRef<(THREE.Mesh | null)[]>([]);
  const arrowRef = useRef<THREE.Group | null>(null);

  const segments = useMemo(
    () =>
      Array.from({ length: SEG }, (_, i) => {
        const u = (i + 0.5) / SEG;
        return {
          x: (i + 0.5) * segLen - L / 2,
          y: BEAM_Y - deltaMax * shape(u, beamType),
          rot: Math.atan(-deltaMax * shapeSlope(u, beamType)),
        };
      }),
    [segLen, deltaMax, beamType]
  );

  const typeLabel =
    beamType === "cantilever" ? "Cantilever" : "Simply supported";

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Beam", typeLabel],
          ["Load", `${load} kN`],
          ["Max deflection", `${(load * 2.5).toFixed(0)} mm`],
        ]}
      />
      <SimCanvas cameraPosition={[0, 3, 12]} target={[0, 2.4, 0]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 24]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>

        {/* supports */}
        {beamType === "cantilever" ? (
          <mesh position={[-L / 2 - 0.45, 3.0, 0]} castShadow>
            <boxGeometry args={[0.9, 4.5, 1.4]} />
            <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.3} />
          </mesh>
        ) : (
          [-3.5, 3.5].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.65, 3.0, 3]} />
                <meshStandardMaterial
                  color="#475569"
                  roughness={0.7}
                  metalness={0.3}
                />
              </mesh>
              <mesh position={[0, 3.1, 0]} castShadow>
                <boxGeometry args={[1.1, 0.2, 1.0]} />
                <meshStandardMaterial
                  color="#64748b"
                  roughness={0.7}
                  metalness={0.3}
                />
              </mesh>
            </group>
          ))
        )}

        {/* the beam: 16 segments on the theory curve */}
        {segments.map((s, i) => (
          <mesh
            key={i}
            ref={(m) => {
              segRefs.current[i] = m;
            }}
            position={[s.x, s.y, 0]}
            rotation={[0, 0, s.rot]}
            castShadow
          >
            <boxGeometry args={[segLen + 0.03, 0.5, 0.6]} />
            <meshStandardMaterial
              color="#7dd3fc"
              roughness={0.4}
              metalness={0.5}
            />
          </mesh>
        ))}

        {/* load arrow, tip tracking the deflection */}
        <group
          ref={arrowRef}
          position={[loadX, BEAM_Y - deltaMax + 0.25, 0]}
        >
          <LoadArrow len={arrowLen} load={load} />
        </group>

        <BeamAnimator
          segRefs={segRefs}
          arrowRef={arrowRef}
          type={beamType}
          targetD={deltaMax}
        />
      </SimCanvas>
    </div>
  );
}
