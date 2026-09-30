// app/components/sims/CircuitSim.tsx
// Simple DC circuit: battery + resistor on a rectangular loop.
// Electrons (dots) flow around the loop; voltage slider changes
// current per Ohm's law I = V/R, shown live.

"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

const R_OHMS = 10;
// Rectangle loop path in the XZ... actually XY plane, y up.
const W = 7; // width
const H = 4; // height

function loopPoint(t: number): THREE.Vector3 {
  // t in [0,1) around rectangle, starting at battery (left middle)
  const per = 2 * (W + H);
  let d = t * per;
  const hw = W / 2;
  const hh = H / 2;
  // go: left edge up, top edge right, right edge down, bottom edge left
  if (d < H) return new THREE.Vector3(-hw, -hh + d, 0);
  d -= H;
  if (d < W) return new THREE.Vector3(-hw + d, hh, 0);
  d -= W;
  if (d < H) return new THREE.Vector3(hw, hh - d, 0);
  d -= H;
  return new THREE.Vector3(hw - d, -hh, 0);
}

function Electrons({ current }: { current: number }) {
  const COUNT = 42;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const t = useRef<number[]>(Array.from({ length: COUNT }, (_, i) => i / COUNT));
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    // electron drift speed proportional to current
    const speed = 0.02 + current * 0.05;
    for (let i = 0; i < COUNT; i++) {
      t.current[i] = (t.current[i] + speed * delta) % 1;
      const p = loopPoint(t.current[i]);
      dummy.position.copy(p);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.14, 12, 12]} />
      <meshBasicMaterial color="#38bdf8" />
    </instancedMesh>
  );
}

function Wire() {
  const pts = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) arr.push(loopPoint(i / 120));
    return arr;
  }, []);
  const geo = useMemo(
    () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 160, 0.07, 8, true),
    [pts]
  );
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.3} />
    </mesh>
  );
}

function Battery() {
  // on left edge middle
  return (
    <group position={[-W / 2, 0, 0]}>
      {/* long plate (+) top, short plate (−) bottom */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.45, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.5]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.34, 0.9, 0.34]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Resistor() {
  // on right edge middle: zigzag box
  return (
    <group position={[W / 2, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.9, 1.6, 0.9]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.45} />
      </mesh>
      {[-0.45, 0, 0.45].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.46, 0.06, 8, 24]} />
          <meshStandardMaterial color={["#ef4444", "#f8fafc", "#92400e"][i]} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export function CircuitSim(props: SimProps) {
  const voltage = Number(props.voltage ?? 6);
  const current = voltage / R_OHMS;
  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Voltage", `${voltage.toFixed(1)} V`],
          ["Resistance", `${R_OHMS} Ω`],
          ["Current", `${current.toFixed(2)} A`],
        ]}
      />
      <SimCanvas cameraPosition={[0, 1.5, 11]} target={[0, 0, 0]}>
        <Wire />
        <Battery />
        <Resistor />
        <Electrons current={current} />
      </SimCanvas>
    </div>
  );
}
