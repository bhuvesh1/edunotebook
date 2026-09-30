// app/components/sims/SolarSystemSim.tsx
// Emissive sun + glow, 8 planets with distinct procedural textures
// (Saturn's rings, Earth's Moon), starfield, slow orbits, HTML labels.

"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SimCanvas } from "./SimCanvas";
import { makeGlowTexture, makePlanetTextures } from "../../../lib/simulations/textures";
import type { SimProps } from "./sim-props";

interface PlanetDef {
  name: string;
  tex: keyof ReturnType<typeof makePlanetTextures>;
  dist: number;
  size: number;
  speed: number; // rad/s at speed = 1
  rings?: boolean;
}

const PLANETS: PlanetDef[] = [  { name: "Mercury", tex: "mercury", dist: 2.4, size: 0.16, speed: 1.6 },
  { name: "Venus", tex: "venus", dist: 3.2, size: 0.26, speed: 1.2 },
  { name: "Earth", tex: "earth", dist: 4.1, size: 0.28, speed: 1.0 },
  { name: "Mars", tex: "mars", dist: 5.0, size: 0.22, speed: 0.8 },
  { name: "Jupiter", tex: "jupiter", dist: 6.4, size: 0.62, speed: 0.45 },
  { name: "Saturn", tex: "saturn", dist: 8.0, size: 0.52, speed: 0.34, rings: true },
  { name: "Uranus", tex: "uranus", dist: 9.4, size: 0.4, speed: 0.24 },
  { name: "Neptune", tex: "neptune", dist: 10.6, size: 0.38, speed: 0.19 },
];

// Module scope: computed once, never during render (keeps render pure).
function buildStarPositions(): Float32Array {
  const N = 1400;
  const arr = new Float32Array(N * 3);
  let seed = 123456789;
  const rnd = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < N; i++) {
    const r = 32 + rnd() * 40;
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
    arr[i * 3 + 1] = r * Math.cos(ph);
    arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  return arr;
}
const STAR_POSITIONS = buildStarPositions();

function OrbitRing({ radius }: { radius: number }) {  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.LineLoop(
      g,
      new THREE.LineBasicMaterial({ color: "#334155", transparent: true, opacity: 0.6 })
    );
  }, [radius]);
  return <primitive object={geo} />;
}

export function SolarSystemSim(props: SimProps) {
  const speed = Number(props.speed ?? 1);
  const textures = useMemo(() => makePlanetTextures(), []);
  const glow = useMemo(() => makeGlowTexture(), []);

  const groups = useRef<(THREE.Group | null)[]>([]);
  const angles = useRef<number[]>(PLANETS.map((_, i) => (i / PLANETS.length) * Math.PI * 2));
  const moonAngle = useRef(0);
  const moon = useRef<THREE.Mesh>(null);

  return (
    <div className="relative h-full w-full">
      <SimCanvas cameraPosition={[0, 12, 20]} target={[0, 0, 0]}>
        {/* starfield */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[STAR_POSITIONS, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.22} color="#dbeafe" sizeAttenuation />
        </points>

        {/* sun */}
        <mesh>
          <sphereGeometry args={[1.3, 40, 40]} />
          <meshStandardMaterial
            color="#ff9d00"
            emissive="#ff8800"
            emissiveIntensity={2.2}
            roughness={1}
          />
        </mesh>
        <sprite scale={[7, 7, 1]}>
          <spriteMaterial map={glow} transparent depthWrite={false} />
        </sprite>
        <pointLight intensity={60} distance={60} decay={2} color="#ffe0b3" />

        {PLANETS.map((p, i) => (
          <group key={p.name}>
            <OrbitRing radius={p.dist} />
            <group
              ref={(g) => {
                groups.current[i] = g;
              }}
            >
              <mesh castShadow>
                <sphereGeometry args={[p.size, 32, 32]} />
                <meshStandardMaterial map={textures[p.tex]} roughness={0.85} />
              </mesh>
              {p.rings && (
                <mesh rotation={[Math.PI / 2.4, 0, 0]}>
                  <ringGeometry args={[p.size * 1.35, p.size * 2.1, 48]} />
                  <meshStandardMaterial
                    color="#d9c9a3"
                    roughness={0.9}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.9}
                  />
                </mesh>
              )}
              {p.name === "Earth" && (
                <mesh ref={moon}>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
                </mesh>
              )}
              <Html
                position={[0, p.size + 0.35, 0]}
                center
                distanceFactor={14}
                style={{ pointerEvents: "none" }}
              >
                <div className="rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-slate-100 backdrop-blur-sm">
                  {p.name}
                </div>
              </Html>
            </group>
          </group>
        ))}
        <OrbitAnimator
          groups={groups}
          angles={angles}
          moonAngle={moonAngle}
          moon={moon}
          speed={speed}
        />
      </SimCanvas>
    </div>
  );
}

// Runs inside <Canvas> (R3F hooks are only valid there).
function OrbitAnimator({
  groups,
  angles,
  moonAngle,
  moon,
  speed,
}: {
  groups: RefObject<(THREE.Group | null)[]>;
  angles: RefObject<number[]>;
  moonAngle: RefObject<number>;
  moon: RefObject<THREE.Mesh | null>;
  speed: number;
}) {
  useFrame((_, delta) => {
    PLANETS.forEach((p, i) => {
      angles.current[i] += p.speed * speed * delta;
      const g = groups.current[i];
      if (g) {
        g.position.set(
          Math.cos(angles.current[i]) * p.dist,
          0,
          Math.sin(angles.current[i]) * p.dist
        );
      }
    });
    moonAngle.current += 2.2 * speed * delta;
    if (moon.current) {
      moon.current.position.set(
        Math.cos(moonAngle.current) * 0.55,
        0,
        Math.sin(moonAngle.current) * 0.55
      );
    }
  });
  return null;
}
