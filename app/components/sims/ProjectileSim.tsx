// app/components/sims/ProjectileSim.tsx
// Cannon + textured ball. The ball launches and lands following the exact
// trajectory computed by lib/simulations/physics.ts.

"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import { projectile } from "../../../lib/simulations/physics";
import { makeBallTexture, makeMetalTexture } from "../../../lib/simulations/textures";
import type { SimProps } from "./sim-props";

const G = 9.81;

// Runs inside <Canvas> (R3F hooks are only valid there).
function BallAnimator({
  ball,
  elapsed,
  duration,
  cycle,
  result,
  angle,
  velocity,
  scale,
}: {
  ball: RefObject<THREE.Mesh>;
  elapsed: RefObject<number>;
  duration: number;
  cycle: number;
  result: { timeOfFlight: number };
  angle: number;
  velocity: number;
  scale: number;
}) {
  useFrame((_, delta) => {
    elapsed.current += delta;
    const phase = elapsed.current % cycle;
    const tau =
      phase < duration ? (phase / duration) * result.timeOfFlight : result.timeOfFlight;
    const theta = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(theta);
    const vy = velocity * Math.sin(theta);
    const x = vx * tau * scale;
    const y = Math.max(vy * tau - 0.5 * G * tau * tau, 0) * scale;
    ball.current.position.set(x, y + 0.32, 0);
    ball.current.rotation.x += delta * 6;
  });
  return null;
}

function Cannon({ angleDeg, metal }: { angleDeg: number; metal: THREE.Texture }) {
  const theta = (angleDeg * Math.PI) / 180;
  const dir: [number, number, number] = [Math.cos(theta), Math.sin(theta), 0];
  return (
    <group>
      {/* base */}
      <mesh position={[-0.9, 0.45, 0]} castShadow>
        <boxGeometry args={[1.4, 0.9, 1.2]} />
        <meshStandardMaterial color="#3b2f2f" roughness={0.8} />
      </mesh>
      {/* wheels */}
      {[-0.45, 0.45].map((z) => (
        <mesh key={z} position={[-0.9, 0.35, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.18, 20]} />
          <meshStandardMaterial color="#1f2937" roughness={0.7} />
        </mesh>
      ))}
      {/* barrel aimed along the launch angle */}
      <mesh
        position={[dir[0] * 1.05, 0.9 + dir[1] * 1.05, 0]}
        rotation={[0, 0, theta - Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.28, 0.34, 2.2, 20]} />
        <meshStandardMaterial map={metal} roughness={0.35} metalness={0.85} />
      </mesh>
    </group>
  );
}

export function ProjectileSim(props: SimProps) {
  const velocity = Number(props.velocity ?? 20);
  const angle = Number(props.angle ?? 45);

  const result = useMemo(() => projectile(velocity, angle, G), [velocity, angle]);
  // Uniform scale so the whole flight (range + apex) always fits the viewport.
  const scale = useMemo(
    () => 14 / Math.max(result.range, result.maxHeight * 1.6, 1),
    [result]
  );
  const ballTex = useMemo(() => makeBallTexture(), []);
  const metalTex = useMemo(() => makeMetalTexture(), []);

  const curve = useMemo(() => {
    const pts = result.points.map(
      (p) => new THREE.Vector3(p.x * scale, p.y * scale + 0.04, 0)
    );
    return new THREE.CatmullRomCurve3(pts);
  }, [result, scale]);

  const tubeGeo = useMemo(
    () => new THREE.TubeGeometry(curve, 72, 0.035, 8, false),
    [curve]
  );
  useEffect(() => () => tubeGeo.dispose(), [tubeGeo]);

  const ball = useRef<THREE.Mesh>(null!);
  const elapsed = useRef(0);
  const duration = Math.min(Math.max(result.timeOfFlight, 1.2), 3.2);
  const cycle = duration + 1.1; // flight + pause at landing

  const flagX = result.range * scale;

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Range", `${result.range.toFixed(1)} m`],
          ["Max height", `${result.maxHeight.toFixed(1)} m`],
          ["Flight time", `${result.timeOfFlight.toFixed(2)} s`],
        ]}
      />
      <SimCanvas cameraPosition={[11, 8, 16]} target={[7, 3, 0]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 30]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>
        <gridHelper args={[60, 60, "#2a3a5f", "#1a2440"]} position={[7, 0.01, 0]} />

        <Cannon angleDeg={angle} metal={metalTex} />

        {/* trajectory ribbon */}
        <mesh geometry={tubeGeo}>
          <meshBasicMaterial color="#fbbf24" />
        </mesh>

        {/* the ball — launches and lands on real physics */}
        <mesh ref={ball} castShadow>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial map={ballTex} roughness={0.55} />
        </mesh>

        {/* target flag at the landing point */}
        <group position={[flagX, 0, 0]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.8, 12]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[0.48, 1.45, 0]}>
            <planeGeometry args={[0.95, 0.55]} />
            <meshStandardMaterial color="#ef4444" side={THREE.DoubleSide} />
          </mesh>
        </group>
        <BallAnimator
          ball={ball}
          elapsed={elapsed}
          duration={duration}
          cycle={cycle}
          result={result}
          angle={angle}
          velocity={velocity}
          scale={scale}
        />
      </SimCanvas>
    </div>
  );
}
