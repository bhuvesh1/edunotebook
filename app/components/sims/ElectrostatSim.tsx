// app/components/sims/ElectrostatSim.tsx
// Electric field lab: two point charges (+ red / − blue) with field lines
// and small glowing test particles drifting along the field direction.
// Configs: ++ (repulsion), +− (attraction), dipole (close +− pair).

"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

type Config = "plusplus" | "plusminus" | "dipole";

const CONFIG_LABEL: Record<Config, string> = {
  plusplus: "+ / +",
  plusminus: "+ / −",
  dipole: "dipole",
};

const K = 8.988e9; // Coulomb constant, N·m²/C²
const PARTICLE_COUNT = 14;
const POINTS_PER_CURVE = 40;

// Runs inside <Canvas> (R3F hooks are only valid there).
function ParticleAnimator({
  curves,
  refs,
}: {
  curves: THREE.Vector3[][];
  refs: RefObject<(THREE.Mesh | null)[]>;
}) {
  const s = useRef<number[]>(curves.map(() => Math.random()));
  useFrame((_, delta) => {
    curves.forEach((pts, i) => {
      const mesh = refs.current[i];
      if (!mesh || pts.length < 2) return;
      // Advance proportional to curve length for roughly constant speed.
      s.current[i] = (s.current[i] + (delta * 30) / pts.length) % 1;
      const f = s.current[i] * (pts.length - 1);
      const i0 = Math.floor(f);
      const i1 = Math.min(pts.length - 1, i0 + 1);
      mesh.position.lerpVectors(pts[i0], pts[i1], f - i0);
    });
  });
  return null;
}

function ChargeLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <Html
      position={[x, y, 0]}
      center
      distanceFactor={12}
      style={{ pointerEvents: "none" }}
    >
      <div className="rounded bg-black/55 px-1.5 py-0.5 text-sm font-bold text-slate-100 backdrop-blur-sm">
        {text}
      </div>
    </Html>
  );
}

export function ElectrostatSim(props: SimProps) {
  const rawConfig = String(props.config ?? "plusminus");
  const config: Config =
    rawConfig === "plusplus" || rawConfig === "dipole" ? rawConfig : "plusminus";
  const rawCharge = Number(props.charge ?? 5);
  const charge = Number.isFinite(rawCharge)
    ? Math.min(10, Math.max(1, rawCharge))
    : 5;

  const { lines, curves, left, right, sphereR, half } = useMemo(() => {
    const halfSep = config === "dipole" ? 0.8 : 2.5;
    const r = 0.35 + 0.055 * charge;
    const left = { x: -halfSep, sign: 1 as const };
    const right = {
      x: halfSep,
      sign: (config === "plusplus" ? 1 : -1) as 1 | -1,
    };
    const curves: THREE.Vector3[][] = [];

    if (config === "plusplus") {
      // Field lines radiate outward from each + charge.
      for (const cx of [left.x, right.x]) {
        const other = cx < 0 ? right.x : left.x;
        const away = new THREE.Vector3(cx - other, 0, 0).normalize();
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const y = 1 - (2 * (i + 0.5)) / PARTICLE_COUNT;
          const rr = Math.sqrt(Math.max(0, 1 - y * y));
          const phi = i * 2.399963; // golden angle: even sphere coverage
          const dir = new THREE.Vector3(
            Math.cos(phi) * rr,
            y,
            Math.sin(phi) * rr
          );
          const start = new THREE.Vector3(cx, 0, 0).addScaledVector(
            dir,
            r * 1.02
          );
          const pts: THREE.Vector3[] = [];
          for (let j = 0; j <= 24; j++) {
            const t = j / 24;
            pts.push(
              start
                .clone()
                .addScaledVector(dir, t * 3.2)
                .addScaledVector(away, t * t * 0.9)
            );
          }
          curves.push(pts);
        }
      }
    } else {
      // Field-line arcs running from + (left) to − (right).
      const bulges =
        config === "dipole"
          ? [0.3, 0.62, 1.05, 1.6, 2.3]
          : [0.45, 0.95, 1.6, 2.4, 3.2];
      const planes = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      for (const b of bulges) {
        for (const phi of planes) {
          const pts: THREE.Vector3[] = [];
          for (let j = 0; j <= POINTS_PER_CURVE; j++) {
            const t = j / POINTS_PER_CURVE;
            const x = -halfSep + 2 * halfSep * t;
            const off = b * Math.sin(Math.PI * t);
            pts.push(
              new THREE.Vector3(x, off * Math.cos(phi), off * Math.sin(phi))
            );
          }
          curves.push(pts);
        }
      }
    }

    const lines = curves.map(
      (pts) =>
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({
            color: "#fbbf24",
            transparent: true,
            opacity: 0.5,
          })
        )
    );
    return { lines, curves, left, right, sphereR: r, half: halfSep };
  }, [config, charge]);

  // Test particles ride a spread of the field lines.
  const particleCurves = useMemo(() => {
    const n = Math.min(PARTICLE_COUNT, curves.length);
    const out: THREE.Vector3[][] = [];
    for (let i = 0; i < n; i++) {
      out.push(curves[Math.floor((i * curves.length) / n)]);
    }
    return out;
  }, [curves]);
  const particleRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Field at the midpoint: E = k·q/r² from each charge. For +−/dipole the two
  // fields point the same way and add; for ++ they cancel.
  const q = charge * 1e-6; // µC → C
  const eMid = config === "plusplus" ? 0 : (2 * K * q) / (half * half);
  const eText =
    eMid === 0
      ? "0 (cancelled)"
      : eMid >= 1000
        ? `${(eMid / 1000).toFixed(1)} kN/C`
        : `${eMid.toFixed(0)} N/C`;

  const charges = [left, right];

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Config", CONFIG_LABEL[config]],
          ["Charge", `${charge} µC`],
          ["E at midpoint", eText],
        ]}
      />
      <SimCanvas cameraPosition={[0, 2, 12]} target={[0, 0.5, 0]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 24]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>

        {/* field lines */}
        {lines.map((line, i) => (
          <primitive key={i} object={line} />
        ))}

        {/* charge spheres */}
        {charges.map((c, i) => (
          <group key={i} position={[c.x, 0, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[sphereR, 32, 32]} />
              <meshStandardMaterial
                color={c.sign === 1 ? "#ef4444" : "#3b82f6"}
                emissive={c.sign === 1 ? "#ef4444" : "#3b82f6"}
                emissiveIntensity={0.45}
                roughness={0.35}
              />
            </mesh>
            <ChargeLabel x={0} y={sphereR + 0.55} text={c.sign === 1 ? "+" : "−"} />
          </group>
        ))}

        {/* drifting test particles */}
        {particleCurves.map((_, i) => (
          <mesh
            key={i}
            ref={(m) => {
              particleRefs.current[i] = m;
            }}
          >
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial
              color="#fde68a"
              emissive="#facc15"
              emissiveIntensity={2.2}
            />
          </mesh>
        ))}
        <ParticleAnimator curves={particleCurves} refs={particleRefs} />
      </SimCanvas>
    </div>
  );
}
