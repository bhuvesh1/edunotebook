// app/components/sims/ReproSim.tsx
// Tasteful fetal-development timeline: a translucent womb holds a growing
// fetus built from primitives, linked by an umbilical cord to a placenta
// disc. A soft pulsing glow marks the heartbeat from week 6 onward.

"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

// Approximate crown-rump / crown-heel length (cm) at key weeks.
const LENGTH_KEYS: [number, number][] = [
  [4, 0.2],
  [6, 0.6],
  [8, 1.6],
  [12, 5.4],
  [16, 11.6],
  [20, 25.6],
  [24, 30],
  [28, 37],
  [32, 42],
  [36, 47],
  [38, 49],
];

function lengthCm(week: number): number {
  const w = Math.min(38, Math.max(4, week));
  for (let i = 0; i < LENGTH_KEYS.length - 1; i++) {
    const [w0, l0] = LENGTH_KEYS[i];
    const [w1, l1] = LENGTH_KEYS[i + 1];
    if (w <= w1) return l0 + ((l1 - l0) * (w - w0)) / (w1 - w0);
  }
  return 49;
}

const SKIN = "#f6c9b8";
const PLACENTA_POS: [number, number, number] = [2.85, 1.25, -0.75];

// Runs inside <Canvas>: gentle floating of the fetus + heartbeat pulse.
function LifeAnimator({
  fetus,
  heart,
  elapsed,
  week,
}: {
  fetus: RefObject<THREE.Group>;
  heart: RefObject<THREE.Mesh>;
  elapsed: RefObject<number>;
  week: number;
}) {
  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current;
    if (fetus.current) {
      fetus.current.position.y = -0.3 + Math.sin(t * 0.8) * 0.12;
      fetus.current.rotation.y = Math.sin(t * 0.22) * 0.4;
    }
    const h = heart.current;
    if (h) {
      const beat = Math.max(0, Math.sin(t * (1.6 + week * 0.05) * Math.PI));
      const m = h.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.5 + beat * 2.4;
      h.scale.setScalar(1 + beat * 0.4);
    }
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
      distanceFactor={14}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <div
        style={{
          whiteSpace: "nowrap",
          background: "rgba(0,0,0,0.55)",
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

function FetusModel({
  week,
  scale,
  heartRef,
}: {
  week: number;
  scale: number;
  heartRef: RefObject<THREE.Mesh>;
}) {
  const embryonic = week <= 8;
  const bud = week < 12;
  return (
    <group scale={scale}>
      {embryonic ? (
        <>
          {/* curled embryo: large head, small C-shaped body, tail curl */}
          <mesh position={[0, 0.32, 0]} castShadow>
            <sphereGeometry args={[0.5, 24, 24]} />
            <meshStandardMaterial color={SKIN} roughness={0.55} />
          </mesh>
          <mesh
            position={[0.1, -0.3, 0]}
            rotation={[0, 0, -0.45]}
            scale={[1, 1.35, 1]}
            castShadow
          >
            <sphereGeometry args={[0.3, 20, 20]} />
            <meshStandardMaterial color={SKIN} roughness={0.55} />
          </mesh>
          <mesh position={[-0.12, -0.66, 0]} rotation={[0, Math.PI / 2, 0.5]}>
            <torusGeometry args={[0.24, 0.08, 10, 20, Math.PI * 1.15]} />
            <meshStandardMaterial color={SKIN} roughness={0.55} />
          </mesh>
          {[-0.18, 0.18].map((x) => (
            <mesh key={x} position={[x, 0.38, 0.44]}>
              <sphereGeometry args={[0.055, 10, 10]} />
              <meshStandardMaterial color="#3f3f46" roughness={0.4} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          {/* head */}
          <mesh position={[0, 0.78, 0]} castShadow>
            <sphereGeometry args={[0.44, 28, 24]} />
            <meshStandardMaterial color={SKIN} roughness={0.55} />
          </mesh>
          {/* body */}
          <mesh position={[0, -0.05, 0]} scale={[0.78, 1.05, 0.66]} castShadow>
            <sphereGeometry args={[0.4, 24, 20]} />
            <meshStandardMaterial color={SKIN} roughness={0.55} />
          </mesh>
          {/* eyes */}
          {[-0.16, 0.16].map((x) => (
            <mesh key={x} position={[x, 0.84, 0.38]}>
              <sphereGeometry args={[0.06, 10, 10]} />
              <meshStandardMaterial color="#3f3f46" roughness={0.4} />
            </mesh>
          ))}
          {/* arms (buds before week 12, longer limbs after) */}
          {[-1, 1].map((s) => (
            <mesh
              key={`arm${s}`}
              position={[s * 0.42, 0.08, 0.04]}
              rotation={[0, 0, s * -0.55]}
            >
              <cylinderGeometry args={[0.07, 0.055, bud ? 0.3 : 0.55, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.55} />
            </mesh>
          ))}
          {/* legs */}
          {[-1, 1].map((s) => (
            <mesh
              key={`leg${s}`}
              position={[s * 0.2, -0.72, 0.1]}
              rotation={[-0.25, 0, s * 0.12]}
            >
              <cylinderGeometry args={[0.09, 0.07, bud ? 0.35 : 0.65, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.55} />
            </mesh>
          ))}
          {/* heartbeat glow */}
          {week >= 6 && (
            <mesh ref={heartRef} position={[0, 0.18, 0.24]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#ef4444"
                emissiveIntensity={0.6}
                transparent
                opacity={0.9}
              />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}

export function ReproSim(props: SimProps) {
  const week = Math.min(38, Math.max(1, Math.round(Number(props.week ?? 12))));
  const len = lengthCm(week);
  const stage = week <= 8 ? "Embryonic period" : "Fetal period";
  const s = 0.3 + (len / 49) * 1.55;

  const fetus = useRef<THREE.Group>(null!);
  const heart = useRef<THREE.Mesh>(null!);
  const elapsed = useRef(0);

  // Umbilical cord: curved tube from the belly to the placenta disc.
  const cordGeo = useMemo(() => {
    const belly = new THREE.Vector3(0.15 * s, -0.45 * s - 0.3, 0.25 * s);
    const curve = new THREE.CatmullRomCurve3([
      belly,
      new THREE.Vector3(1.1 * s + 0.5, -1.0, 0.9),
      new THREE.Vector3(2.2, 0.1, -0.2),
      new THREE.Vector3(...PLACENTA_POS),
    ]);
    return new THREE.TubeGeometry(curve, 32, 0.07, 8, false);
  }, [s]);

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Week", `${week}`],
          ["Stage", stage],
          ["Approx. length", `≈ ${len.toFixed(1)} cm`],
        ]}
      />
      <SimCanvas cameraPosition={[0, 2, 10]} target={[0, 0.2, 0]}>
        {/* womb: large translucent sphere */}
        <mesh>
          <sphereGeometry args={[4, 48, 48]} />
          <meshStandardMaterial
            color="#f9a8d4"
            transparent
            opacity={0.14}
            roughness={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* faint amniotic-fluid glow */}
        <mesh>
          <sphereGeometry args={[3.55, 32, 32]} />
          <meshStandardMaterial
            color="#fda4af"
            transparent
            opacity={0.05}
            roughness={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* placenta disc on the womb wall */}
        <mesh position={PLACENTA_POS} rotation={[0.5, 0.3, 1.1]} castShadow>
          <cylinderGeometry args={[0.95, 0.95, 0.3, 28]} />
          <meshStandardMaterial color="#c2507a" roughness={0.65} />
        </mesh>

        {/* umbilical cord */}
        <mesh geometry={cordGeo}>
          <meshStandardMaterial color="#e8b4b8" roughness={0.6} />
        </mesh>

        {/* the growing fetus */}
        <group ref={fetus} position={[0, -0.3, 0]}>
          <FetusModel week={week} scale={s} heartRef={heart} />
        </group>
        <LifeAnimator fetus={fetus} heart={heart} elapsed={elapsed} week={week} />

        <Tag position={[2.85, 2.5, -0.75]}>Placenta</Tag>
        <Tag position={[1.7, -0.6, 0.6]}>Umbilical cord</Tag>
        <Tag position={[0, 4.35, 0]}>Womb</Tag>
      </SimCanvas>
    </div>
  );
}
