// app/components/sims/PendulumSim.tsx
// Pivot mount + rod + metallic bob swinging in true SHM from
// lib/simulations/physics.ts. The bob hangs straight DOWN at rest.

"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import { pendulumAngle, pendulumPeriod } from "../../../lib/simulations/physics";
import { makeMetalTexture } from "../../../lib/simulations/textures";
import type { SimProps } from "./sim-props";

export function PendulumSim(props: SimProps) {
  const length = Number(props.length ?? 1);
  const angle = Number(props.angle ?? 20);

  const theta0 = (angle * Math.PI) / 180;
  const period = pendulumPeriod(length);
  const visualLen = 1.5 + length * 2; // scene units
  const pivotY = 6.4;

  const metal = useMemo(() => makeMetalTexture(), []);
  const swing = useRef<THREE.Group>(null!);
  const elapsed = useRef(0);

  // Faint arc tracing the swing path.
  const arcLine = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = -24; i <= 24; i++) {
      const a = (theta0 * i) / 24;
      pts.push(
        new THREE.Vector3(
          Math.sin(a) * visualLen,
          pivotY - Math.cos(a) * visualLen,
          0
        )
      );
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: "#fbbf24", transparent: true, opacity: 0.35 })
    );
  }, [theta0, visualLen, pivotY]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    // θ measured from the straight-down vertical: rest hangs DOWN, never inverted.
    swing.current.rotation.z = pendulumAngle(elapsed.current, length, theta0);
  });

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Period", `${period.toFixed(2)} s`],
          ["Length", `${length.toFixed(2)} m`],
          ["Release", `${angle}°`],
        ]}
      />
      <SimCanvas cameraPosition={[0, 3.6, 13]} target={[0, 3.2, 0]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 24]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>

        {/* support frame */}
        {[-3.2, 3.2].map((x) => (
          <mesh key={x} position={[x, pivotY / 2, 0]} castShadow>
            <boxGeometry args={[0.28, pivotY, 0.28]} />
            <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, pivotY + 0.25, 0]} castShadow>
          <boxGeometry args={[7.2, 0.5, 0.7]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.4} />
        </mesh>

        {/* swing path arc */}
        <primitive object={arcLine} />

        {/* swinging assembly: pivot pin + rod + metallic bob */}
        <group position={[0, pivotY, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.9, 16]} />
            <meshStandardMaterial map={metal} roughness={0.3} metalness={0.9} />
          </mesh>
          <group ref={swing}>
            <mesh position={[0, -visualLen / 2, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.055, visualLen, 12]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.8} />
            </mesh>
            <mesh position={[0, -visualLen, 0]} castShadow>
              <sphereGeometry args={[0.52, 32, 32]} />
              <meshStandardMaterial map={metal} roughness={0.28} metalness={0.9} />
            </mesh>
          </group>
        </group>
      </SimCanvas>
    </div>
  );
}
