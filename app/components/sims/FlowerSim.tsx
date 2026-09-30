// app/components/sims/FlowerSim.tsx
// Flower anatomy explorer: a stylized flower (stem, sepals, petals, stamen,
// pistil). The selected part glows via emissive intensity, and turning
// pollination on animates pollen particles drifting from anther to stigma.

"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

type Part = "all" | "petals" | "stamen" | "pistil" | "sepal";

const PART_INFO: Record<Part, { name: string; fn: string }> = {
  all: { name: "Whole flower", fn: "All parts shown together" },
  petals: { name: "Petals", fn: "Bright & scented — attract pollinators" },
  stamen: { name: "Stamen (male)", fn: "Anthers make and release pollen" },
  pistil: {
    name: "Pistil (female)",
    fn: "Stigma catches pollen; ovary holds ovules",
  },
  sepal: { name: "Sepals", fn: "Green leaf-like — protect the bud" },
};

const POLLEN_COUNT = 12;
const STIGMA = new THREE.Vector3(0, 4.5, 0);

// Runs inside <Canvas> (R3F hooks are only valid there). Pollen drifts from
// the anther tips toward the stigma, looping forever.
function PollenAnimator({
  tips,
  refs,
}: {
  tips: THREE.Vector3[];
  refs: RefObject<(THREE.Mesh | null)[]>;
}) {
  const t = useRef<number[]>(
    Array.from({ length: POLLEN_COUNT }, (_, i) => (i * 0.083) % 1)
  );
  useFrame((_, delta) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      t.current[i] = (t.current[i] + delta * 0.28) % 1;
      const tt = t.current[i];
      m.position.lerpVectors(tips[i % tips.length], STIGMA, tt);
      m.position.y += Math.sin(tt * Math.PI * 3 + i) * 0.08;
      m.position.x += Math.cos(tt * Math.PI * 2 + i * 2) * 0.06;
    });
  });
  return null;
}

function PartLabel({
  position,
  text,
}: {
  position: [number, number, number];
  text: string;
}) {
  return (
    <Html
      position={position}
      center
      distanceFactor={12}
      style={{ pointerEvents: "none" }}
    >
      <div className="rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-slate-100 backdrop-blur-sm">
        {text}
      </div>
    </Html>
  );
}

export function FlowerSim(props: SimProps) {
  const rawPart = String(props.part ?? "all");
  const part: Part =
    rawPart === "petals" ||
    rawPart === "stamen" ||
    rawPart === "pistil" ||
    rawPart === "sepal"
      ? rawPart
      : "all";
  const pollenOn = String(props.pollination ?? "off") === "on";

  const hl = (p: Part) => part === "all" || part === p;

  // Anther tip positions double as pollen start points.
  const antherTips = useMemo(() => {
    const tips: THREE.Vector3[] = [];
    const tilt = -0.18;
    const dir = new THREE.Vector3(-Math.sin(tilt), Math.cos(tilt), 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const base = new THREE.Vector3(
        Math.cos(a) * 0.45,
        3.95,
        Math.sin(a) * 0.45
      );
      // Rotate the outward-tilt direction around the Y axis by the petal angle.
      const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -a);
      tips.push(base.clone().addScaledVector(d, 0.375));
    }
    return tips;
  }, []);

  const pollenRefs = useRef<(THREE.Mesh | null)[]>([]);
  const info = PART_INFO[part];

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Part", info.name],
          ["Function", info.fn],
          ["Pollination", pollenOn ? "on" : "off"],
        ]}
      />
      <SimCanvas cameraPosition={[0, 3.5, 10]} target={[0, 3.2, 0]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 24]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>

        {/* stem */}
        <mesh position={[0, 1.65, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.15, 3.3, 12]} />
          <meshStandardMaterial color="#16a34a" roughness={0.8} />
        </mesh>

        {/* leaves */}
        {[0.6, 2.6].map((a, i) => (
          <group key={a} position={[0, 1.1 + i * 0.8, 0]} rotation-y={-a}>
            <mesh
              position={[0.75, 0.1, 0]}
              rotation={[0, 0, -1.25]}
              scale={[1, 1, 0.3]}
              castShadow
            >
              <coneGeometry args={[0.28, 1.3, 10]} />
              <meshStandardMaterial color="#22c55e" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* sepals: 5 small green cones at the flower base */}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <group
              key={i}
              position={[Math.cos(a) * 0.3, 3.3, Math.sin(a) * 0.3]}
              rotation-y={-a}
            >
              <mesh position={[0.3, -0.05, 0]} rotation={[0, 0, -2.0]}>
                <coneGeometry args={[0.16, 0.55, 10]} />
                <meshStandardMaterial
                  color="#15803d"
                  emissive="#22c55e"
                  emissiveIntensity={hl("sepal") ? 1.0 : 0.05}
                  roughness={0.7}
                />
              </mesh>
            </group>
          );
        })}

        {/* petals: 5 flattened pink cones splayed radially */}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <group
              key={i}
              position={[Math.cos(a) * 0.35, 3.55, Math.sin(a) * 0.35]}
              rotation-y={-a}
            >
              <mesh
                position={[0.95, 0.35, 0]}
                rotation={[0, 0, -1.02]}
                scale={[1, 1, 0.35]}
                castShadow
              >
                <coneGeometry args={[0.5, 1.7, 16]} />
                <meshStandardMaterial
                  color="#f472b6"
                  emissive="#ec4899"
                  emissiveIntensity={hl("petals") ? 1.0 : 0.06}
                  roughness={0.6}
                />
              </mesh>
            </group>
          );
        })}

        {/* stamen: filaments around the center (anthers below, world-space) */}
        {[0, 1, 2, 3, 4].map((i) => {
          return (
            <group key={i} rotation-y={-((i / 5) * Math.PI * 2)}>
              <mesh position={[0.45, 3.95, 0]} rotation={[0, 0, -0.18]}>
                <cylinderGeometry args={[0.035, 0.035, 0.75, 8]} />
                <meshStandardMaterial
                  color="#fef9c3"
                  emissive="#facc15"
                  emissiveIntensity={hl("stamen") ? 0.7 : 0.05}
                  roughness={0.6}
                />
              </mesh>
            </group>
          );
        })}

        {/* anthers at the filament tips */}
        {antherTips.map((tip, i) => (
          <mesh key={i} position={tip}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial
              color="#fde047"
              emissive="#facc15"
              emissiveIntensity={hl("stamen") ? 1.2 : 0.25}
              roughness={0.5}
            />
          </mesh>
        ))}

        {/* pistil: ovary + style + stigma at the center */}
        <mesh position={[0, 3.6, 0]} castShadow>
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#4ade80"
            emissiveIntensity={hl("pistil") ? 0.9 : 0.05}
            roughness={0.6}
          />
        </mesh>
        <mesh position={[0, 4.05, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.75, 12]} />
          <meshStandardMaterial
            color="#d9f99d"
            emissive="#a3e635"
            emissiveIntensity={hl("pistil") ? 0.9 : 0.05}
            roughness={0.6}
          />
        </mesh>
        <mesh position={[0, 4.5, 0]}>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#facc15"
            emissiveIntensity={hl("pistil") ? 1.2 : 0.2}
            roughness={0.5}
          />
        </mesh>

        {/* pollen drift, only when pollination is on */}
        {pollenOn && (
          <>
            {Array.from({ length: POLLEN_COUNT }).map((_, i) => (
              <mesh
                key={i}
                ref={(m) => {
                  pollenRefs.current[i] = m;
                }}
              >
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshStandardMaterial
                  color="#fef08a"
                  emissive="#facc15"
                  emissiveIntensity={2.5}
                />
              </mesh>
            ))}
            <PollenAnimator tips={antherTips} refs={pollenRefs} />
          </>
        )}

        {/* part labels for the highlighted selection */}
        {(part === "all" || part === "petals") && (
          <PartLabel position={[2.2, 4.75, 0]} text="Petals" />
        )}
        {(part === "all" || part === "stamen") && (
          <PartLabel position={[1.35, 5.1, 0]} text="Stamen (male)" />
        )}
        {(part === "all" || part === "pistil") && (
          <PartLabel position={[-1.0, 5.3, 0]} text="Pistil (female)" />
        )}
        {(part === "all" || part === "sepal") && (
          <PartLabel position={[1.5, 2.7, 0]} text="Sepals" />
        )}
      </SimCanvas>
    </div>
  );
}
