// app/components/sims/DnaSim.tsx
// Rotating DNA double helix with base-pair rungs.
// Speed slider controls rotation; readout shows structural facts.

"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

const BASE_COLORS = {
  A: "#22c55e", // adenine — green
  T: "#ef4444", // thymine — red
  G: "#3b82f6", // guanine — blue
  C: "#eab308", // cytosine — yellow
};
const PAIRS: [keyof typeof BASE_COLORS, keyof typeof BASE_COLORS][] = [
  ["A", "T"],
  ["T", "A"],
  ["G", "C"],
  ["C", "G"],
];

const TURNS = 2.5;
const BP_PER_TURN = 10;
const COUNT = Math.floor(TURNS * BP_PER_TURN);
const RISE = 0.55; // vertical rise per base pair
const RADIUS = 1.6;

function Helix({ speed }: { speed: number }) {
  const group = useRef<THREE.Group>(null);

  const backbone = useMemo(() => {
    const pts: THREE.Vector3[][] = [[], []];
    for (let i = 0; i <= COUNT * 4; i++) {
      const t = (i / (COUNT * 4)) * COUNT;
      const th = (t / BP_PER_TURN) * Math.PI * 2;
      const y = (t - COUNT / 2) * RISE;
      pts[0].push(new THREE.Vector3(Math.cos(th) * RADIUS, y, Math.sin(th) * RADIUS));
      pts[1].push(new THREE.Vector3(Math.cos(th + Math.PI) * RADIUS, y, Math.sin(th + Math.PI) * RADIUS));
    }
    return pts.map((p) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 200, 0.09, 8));
  }, []);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * speed;
  });

  return (
    <group ref={group}>
      {/* sugar-phosphate backbones */}
      {backbone.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial color={i === 0 ? "#f59e0b" : "#8b5cf6"} roughness={0.35} />
        </mesh>
      ))}
      {/* base-pair rungs */}
      {Array.from({ length: COUNT }).map((_, i) => {
        const th = (i / BP_PER_TURN) * Math.PI * 2;
        const y = (i - COUNT / 2) * RISE;
        const [b1, b2] = PAIRS[i % PAIRS.length];
        const p1: [number, number, number] = [Math.cos(th) * RADIUS, y, Math.sin(th) * RADIUS];
        const p2: [number, number, number] = [Math.cos(th + Math.PI) * RADIUS, y, Math.sin(th + Math.PI) * RADIUS];
        const mid1: [number, number, number] = [p1[0] / 2, y, p1[2] / 2];
        const mid2: [number, number, number] = [p2[0] / 2, y, p2[2] / 2];
        const len = RADIUS;
        const mkQuat = (from: [number, number, number], to: [number, number, number]) => {
          const dir = new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
          return new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir.normalize()
          );
        };
        return (
          <group key={i}>
            <mesh position={[(p1[0] + mid1[0]) / 2, y, (p1[2] + mid1[2]) / 2]} quaternion={mkQuat(p1, mid1)}>
              <cylinderGeometry args={[0.13, 0.13, len / 2, 10]} />
              <meshStandardMaterial color={BASE_COLORS[b1]} roughness={0.4} />
            </mesh>
            <mesh position={[(p2[0] + mid2[0]) / 2, y, (p2[2] + mid2[2]) / 2]} quaternion={mkQuat(p2, mid2)}>
              <cylinderGeometry args={[0.13, 0.13, len / 2, 10]} />
              <meshStandardMaterial color={BASE_COLORS[b2]} roughness={0.4} />
            </mesh>
            {/* base spheres at the joint */}
            <mesh position={mid1}>
              <sphereGeometry args={[0.22, 14, 14]} />
              <meshStandardMaterial color={BASE_COLORS[b1]} roughness={0.4} />
            </mesh>
            <mesh position={mid2}>
              <sphereGeometry args={[0.22, 14, 14]} />
              <meshStandardMaterial color={BASE_COLORS[b2]} roughness={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function DnaSim(props: SimProps) {
  const speed = Number(props.speed ?? 0.6);
  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Base pairs", `${COUNT}`],
          ["Twist", "10 bp / turn"],
          ["Pairs", "A–T · G–C"],
        ]}
      />
      <SimCanvas cameraPosition={[0, 2, 13]} target={[0, 0, 0]}>
        <Helix speed={speed} />
      </SimCanvas>
    </div>
  );
}
