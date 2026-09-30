// app/components/sims/FluidSim.tsx
// Bernoulli venturi tube: a transparent horizontal pipe narrows at the
// throat, so tracer particles speed up there (v ~ 1/area) while the two
// manometer columns show the pressure drop: tall column at the inlet,
// short column at the throat.

"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

const COUNT = 90;
const R = 1.2; // inlet/outlet pipe radius
const PIPE_Y = 1.6; // pipe centre height
const X_MIN = -6;
const X_MAX = 6;

interface FlowState {
  constriction: number;
  flowSpeed: number;
}

// Local pipe radius at position x (venturi profile).
function radiusAt(x: number, rt: number): number {
  if (x < -2) return R;
  if (x < -0.5) return R + ((x + 2) / 1.5) * (rt - R);
  if (x < 0.5) return rt;
  if (x < 2) return rt + ((x - 0.5) / 1.5) * (R - rt);
  return R;
}

// Runs inside <Canvas> (R3F hooks are only valid there).
function FlowAnimator({
  mesh,
  state,
}: {
  mesh: RefObject<THREE.InstancedMesh>;
  state: RefObject<FlowState>;
}) {
  const particles = useMemo(() => {
    const arr: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      arr.push({
        x: X_MIN + Math.random() * (X_MAX - X_MIN),
        y: (Math.random() - 0.5) * 0.9,
        z: (Math.random() - 0.5) * 0.9,
      });
    }
    return arr;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const { constriction, flowSpeed } = state.current;
    const rt = constriction * R;
    const step = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      // continuity: v ~ 1/area
      const v = flowSpeed * 1.6 * Math.pow(R / radiusAt(p.x, rt), 2);
      p.x += v * step;
      if (p.x > X_MAX) {
        p.x = X_MIN;
        p.y = (Math.random() - 0.5) * 0.9;
        p.z = (Math.random() - 0.5) * 0.9;
      }
      dummy.position.set(p.x, PIPE_Y + p.y, p.z);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return null;
}

const GLASS = (
  <meshStandardMaterial
    color="#7dd3fc"
    roughness={0.12}
    metalness={0.1}
    transparent
    opacity={0.16}
    side={THREE.DoubleSide}
    depthWrite={false}
  />
);

/** One manometer: glass tube + liquid column of given height. */
function Manometer({ x, columnH }: { x: number; columnH: number }) {
  const tubeBottom = PIPE_Y + R + 0.1;
  const tubeH = 3.4;
  return (
    <group>
      {/* connector from pipe top to tube */}
      <mesh position={[x, tubeBottom - 0.05, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.25, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* glass tube */}
      <mesh position={[x, tubeBottom + tubeH / 2, 0]}>
        <cylinderGeometry args={[0.16, 0.16, tubeH, 16, 1, true]} />
        {GLASS}
      </mesh>
      {/* liquid column */}
      <mesh position={[x, tubeBottom + columnH / 2, 0]}>
        <cylinderGeometry args={[0.11, 0.11, columnH, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.2}
          emissive="#0ea5e9"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}

export function FluidSim(props: SimProps) {
  const constriction = Math.min(
    1,
    Math.max(0.3, Number(props.constriction ?? 0.6))
  );
  const flowSpeed = Math.min(3, Math.max(0.5, Number(props.flowSpeed ?? 1)));

  const rt = constriction * R;
  const v1 = flowSpeed;
  const v2 = v1 / Math.pow(constriction, 2);

  // Bernoulli: P2 = P1 - k(v2^2 - v1^2), exaggerated for a visible column drop.
  const P1 = 101.3;
  const P2 = Math.max(5, P1 - 8 * (v2 * v2 - v1 * v1));
  const h1 = 2.6;
  const h2 = h1 * Math.min(1, Math.max(0.15, P2 / P1));

  const mesh = useRef<THREE.InstancedMesh>(null!);
  const state = useRef<FlowState>({ constriction, flowSpeed });
  state.current.constriction = constriction;
  state.current.flowSpeed = flowSpeed;

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["v1 (inlet)", `${v1.toFixed(2)} m/s`],
          ["v2 (throat)", `${v2.toFixed(2)} m/s`],
          ["P1 (inlet)", `${P1.toFixed(1)} kPa`],
          ["P2 (throat)", `${P2.toFixed(1)} kPa`],
        ]}
      />
      <SimCanvas cameraPosition={[0, 2.5, 12]} target={[0, 2.2, 0]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 24]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>

        {/* venturi pipe: inlet | converging cone | throat | diverging cone | outlet */}
        <mesh position={[-4, PIPE_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[R, R, 4, 32, 1, true]} />
          {GLASS}
        </mesh>
        <mesh position={[-1.25, PIPE_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[R, rt, 1.5, 32, 1, true]} />
          {GLASS}
        </mesh>
        <mesh position={[0, PIPE_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[rt, rt, 1, 32, 1, true]} />
          {GLASS}
        </mesh>
        <mesh position={[1.25, PIPE_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[rt, R, 1.5, 32, 1, true]} />
          {GLASS}
        </mesh>
        <mesh position={[4, PIPE_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[R, R, 4, 32, 1, true]} />
          {GLASS}
        </mesh>

        {/* pipe support stands */}
        {[-4.5, 4.5].map((x) => (
          <mesh key={x} position={[x, (PIPE_Y - R) / 2, 0]} castShadow>
            <boxGeometry args={[0.25, PIPE_Y - R, 0.25]} />
            <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.4} />
          </mesh>
        ))}

        {/* tracer particles */}
        <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
          <sphereGeometry args={[0.075, 10, 8]} />
          <meshStandardMaterial
            color="#fbbf24"
            roughness={0.3}
            emissive="#f59e0b"
            emissiveIntensity={0.5}
          />
        </instancedMesh>

        {/* manometers: tall at inlet, short at throat */}
        <Manometer x={-4} columnH={h1} />
        <Manometer x={0} columnH={h2} />

        <FlowAnimator mesh={mesh} state={state} />
      </SimCanvas>
    </div>
  );
}
