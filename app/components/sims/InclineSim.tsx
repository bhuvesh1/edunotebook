// app/components/sims/InclineSim.tsx
// Wooden ramp + textured block sliding with adjustable angle.
// Acceleration follows a = g·(sinθ − μ·cosθ); the angle is shown live.

"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import { makeWoodTexture } from "../../../lib/simulations/textures";
import type { SimProps } from "./sim-props";

const G = 9.81;
const MU = 0.12; // kinetic friction coefficient
const RAMP_LEN = 12;
const TRAVEL = 10.4; // block travel distance along the slope

export function InclineSim(props: SimProps) {
  const angle = Number(props.angle ?? 30);
  const theta = (angle * Math.PI) / 180;
  const accel = G * (Math.sin(theta) - MU * Math.cos(theta));

  const wood = useMemo(() => makeWoodTexture(), []);
  const block = useRef<THREE.Group>(null!);
  const elapsed = useRef(0);

  const duration = Math.min(Math.max(Math.sqrt((2 * TRAVEL) / accel), 1.2), 4);
  const cycle = duration + 1.0;

  useFrame((_, delta) => {
    elapsed.current += delta;
    const phase = elapsed.current % cycle;
    const t = Math.min(phase, duration);
    const d = 0.5 * accel * t * t; // distance slid down the slope
    // local coords: ramp group is rotated by -θ, so +x runs downhill
    block.current.position.set(-TRAVEL / 2 + d, 0.2 + 0.45, 0);
  });

  // Angle indicator arc at the foot of the ramp.
  const arcLine = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = (theta * i) / 20;
      pts.push(new THREE.Vector3(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 1.6));
    }
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: "#fbbf24" })
    );
  }, [theta]);

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Ramp angle", `${angle}°`],
          ["Acceleration", `${accel.toFixed(2)} m/s²`],
        ]}
      />
      <SimCanvas cameraPosition={[2, 7, 15]} target={[0, 3, 0]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 30]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>

        {/* ramp + block in a group rotated so +x runs downhill */}
        <group position={[0, 4.6, 0]} rotation={[0, 0, -theta]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[RAMP_LEN, 0.4, 3]} />
            <meshStandardMaterial map={wood} roughness={0.8} />
          </mesh>
          <group ref={block}>
            <mesh castShadow>
              <boxGeometry args={[0.9, 0.9, 1.5]} />
              <meshStandardMaterial map={wood} roughness={0.7} />
            </mesh>
          </group>
        </group>

        {/* support leg under the high end */}
        <mesh
          position={[-Math.cos(theta) * (RAMP_LEN / 2), (4.6 - Math.sin(theta) * (RAMP_LEN / 2)) / 2, 0]}
          castShadow
        >
          <boxGeometry args={[0.5, 4.6 - Math.sin(theta) * (RAMP_LEN / 2), 0.5]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>

        {/* angle arc at the foot */}
        <group position={[Math.cos(theta) * (RAMP_LEN / 2), 4.6 - Math.sin(theta) * (RAMP_LEN / 2) - 0.2, 0]}>
          <primitive object={arcLine} />
        </group>
      </SimCanvas>
    </div>
  );
}
