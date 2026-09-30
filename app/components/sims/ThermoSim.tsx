// app/components/sims/ThermoSim.tsx
// Gas piston lab: ~60 gas particles bounce inside a transparent vertical
// cylinder. Particle speed follows sqrt(T) (kinetic theory) and the gas
// colour shifts blue -> red with temperature. The piston disc rides on
// `volume`; pressure is shown as P ~ T/V.

"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

const COUNT = 60;
const RADIUS = 1.5; // cylinder inner radius
const BOTTOM = 0.6; // gas region floor
const PARTICLE_R = 0.09;

interface SimState {
  pistonY: number;
  speed: number; // mean particle speed, scene units / s
}

// Runs inside <Canvas> (R3F hooks are only valid there).
function GasAnimator({
  mesh,
  state,
}: {
  mesh: RefObject<THREE.InstancedMesh>;
  state: RefObject<SimState>;
}) {
  const particles = useMemo(() => {
    const arr: { pos: THREE.Vector3; vel: THREE.Vector3 }[] = [];
    for (let i = 0; i < COUNT; i++) {
      const r = Math.sqrt(Math.random()) * (RADIUS - PARTICLE_R - 0.05);
      const a = Math.random() * Math.PI * 2;
      arr.push({
        pos: new THREE.Vector3(
          r * Math.cos(a),
          BOTTOM + 0.15 + Math.random() * 3,
          r * Math.sin(a)
        ),
        vel: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
      });
    }
    return arr;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const { pistonY, speed } = state.current;
    const step = Math.min(delta, 0.05);
    const top = pistonY - 0.25 - PARTICLE_R;
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      p.pos.addScaledVector(p.vel, speed * step);

      // radial wall bounce
      const r = Math.hypot(p.pos.x, p.pos.z);
      const maxR = RADIUS - PARTICLE_R;
      if (r > maxR) {
        const nx = p.pos.x / r;
        const nz = p.pos.z / r;
        const dot = p.vel.x * nx + p.vel.z * nz;
        p.vel.x -= 2 * dot * nx;
        p.vel.z -= 2 * dot * nz;
        p.pos.x = nx * maxR;
        p.pos.z = nz * maxR;
      }
      // floor bounce
      if (p.pos.y < BOTTOM + PARTICLE_R) {
        p.pos.y = BOTTOM + PARTICLE_R;
        p.vel.y = Math.abs(p.vel.y);
      }
      // piston bounce
      if (p.pos.y > top) {
        p.pos.y = top;
        p.vel.y = -Math.abs(p.vel.y);
      }

      dummy.position.copy(p.pos);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return null;
}

export function ThermoSim(props: SimProps) {
  const temperature = Math.min(600, Math.max(200, Number(props.temperature ?? 300)));
  const volume = Math.min(2, Math.max(0.5, Number(props.volume ?? 1)));

  // Kinetic theory: v_rms ~ sqrt(T); colour blue -> red with T.
  const speed = 2.4 * Math.sqrt(temperature / 300);
  const tNorm = (temperature - 200) / 400;
  const gasColor = useMemo(
    () => new THREE.Color("#3b82f6").lerp(new THREE.Color("#ef4444"), tNorm),
    [tNorm]
  );
  const heatColor = useMemo(
    () => new THREE.Color("#1e293b").lerp(new THREE.Color("#f97316"), tNorm),
    [tNorm]
  );

  // Piston height follows volume; pressure P ~ T/V scaled to kPa.
  const pistonY = 2.2 + ((volume - 0.5) / 1.5) * 2.6;
  const pressure = (101.3 * (temperature / 300)) / volume;

  const mesh = useRef<THREE.InstancedMesh>(null!);
  const state = useRef<SimState>({ pistonY, speed });
  state.current.pistonY = pistonY;
  state.current.speed = speed;

  const rodLen = 6.3 - pistonY - 0.3;

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Temperature", `${temperature.toFixed(0)} K`],
          ["Volume", `${volume.toFixed(2)} L`],
          ["Pressure", `${pressure.toFixed(1)} kPa`],
        ]}
      />
      <SimCanvas cameraPosition={[7, 4, 10]} target={[0, 2.8, 0]}>
        {/* ground + base */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 24]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>
        <mesh position={[0, 0.15, 0]} receiveShadow>
          <boxGeometry args={[4.4, 0.3, 4.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* heater glow under the cylinder, hotter with T */}
        <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.75, 40]} />
          <meshBasicMaterial color={heatColor} transparent opacity={0.85} />
        </mesh>

        {/* glass cylinder */}
        <mesh position={[0, 2.9, 0]}>
          <cylinderGeometry args={[RADIUS, RADIUS, 4.8, 40, 1, true]} />
          <meshStandardMaterial
            color="#93c5fd"
            roughness={0.1}
            metalness={0.1}
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* gas particles */}
        <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
          <sphereGeometry args={[PARTICLE_R, 12, 10]} />
          <meshStandardMaterial
            color={gasColor}
            roughness={0.35}
            emissive={gasColor}
            emissiveIntensity={0.45}
          />
        </instancedMesh>

        {/* piston disc + rod */}
        <mesh position={[0, pistonY, 0]} castShadow>
          <cylinderGeometry args={[RADIUS - 0.06, RADIUS - 0.06, 0.25, 40]} />
          <meshStandardMaterial color="#64748b" roughness={0.35} metalness={0.85} />
        </mesh>
        <mesh position={[0, pistonY + 0.15 + rodLen / 2, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, rodLen, 16]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, 6.3, 0]} castShadow>
          <boxGeometry args={[4.4, 0.28, 0.5]} />
          <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.5} />
        </mesh>

        {/* frame posts */}
        {[-2.05, 2.05].map((x) => (
          <mesh key={x} position={[x, 3.35, 0]} castShadow>
            <boxGeometry args={[0.22, 6.1, 0.22]} />
            <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.5} />
          </mesh>
        ))}

        <GasAnimator mesh={mesh} state={state} />
      </SimCanvas>
    </div>
  );
}
