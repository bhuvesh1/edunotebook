// app/components/sims/DentalSim.tsx
// Interactive tooth explorer: layered molar (enamel/dentin/pulp) with an
// explode slider, plus implant, braces and denture views. Built entirely
// from three.js primitives — no external models.

"use client";

import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

type ViewMode = "tooth" | "implant" | "braces" | "denture";

// Runs inside <Canvas> (R3F hooks are only valid there).
function IdleSpin({ group }: { group: RefObject<THREE.Group> }) {
  useFrame((_, delta) => {
    group.current.rotation.y += delta * 0.25;
  });
  return null;
}

const ENAMEL = "#f8fafc";
const DENTIN = "#f2d38b";
const PULP = "#dc2626";

/** A molar with three separable layers: enamel shell, dentin, red pulp core. */
function Molar({ explode }: { explode: number }) {
  const enamelY = explode * 2.1;
  const pulpY = -explode * 1.6;

  return (
    <group>
      {/* dentin (middle layer, stays put) */}
      <group>
        <mesh position={[0, 2.3, 0]} scale={[1.1, 0.86, 0.95]} castShadow>
          <sphereGeometry args={[1, 40, 32]} />
          <meshStandardMaterial color={DENTIN} roughness={0.55} />
        </mesh>
        {[-0.42, 0.42].map((x, i) => (
          <mesh
            key={x}
            position={[x, 0.9, 0]}
            rotation={[0, 0, i === 0 ? 0.22 : -0.22]}
            castShadow
          >
            <cylinderGeometry args={[0.24, 0.1, 1.7, 16]} />
            <meshStandardMaterial color={DENTIN} roughness={0.55} />
          </mesh>
        ))}
      </group>

      {/* enamel (outer shell, semi-transparent, lifts up when exploded) */}
      <group position={[0, enamelY, 0]}>
        <mesh position={[0, 2.3, 0]} scale={[1.32, 1.04, 1.12]} castShadow>
          <sphereGeometry args={[1, 40, 32]} />
          <meshStandardMaterial
            color={ENAMEL}
            roughness={0.25}
            transparent
            opacity={0.5}
          />
        </mesh>
        {[-0.5, 0.5].map((x, i) => (
          <mesh
            key={x}
            position={[x, 0.85, 0]}
            rotation={[0, 0, i === 0 ? 0.22 : -0.22]}
            castShadow
          >
            <cylinderGeometry args={[0.3, 0.13, 1.85, 16]} />
            <meshStandardMaterial
              color={ENAMEL}
              roughness={0.25}
              transparent
              opacity={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* pulp (red core + root canals, sinks down when exploded) */}
      <group position={[0, pulpY, 0]}>
        <mesh position={[0, 2.3, 0]} scale={[0.62, 0.55, 0.55]}>
          <sphereGeometry args={[1, 24, 20]} />
          <meshStandardMaterial
            color={PULP}
            roughness={0.4}
            emissive={PULP}
            emissiveIntensity={0.25}
          />
        </mesh>
        {[-0.4, 0.4].map((x, i) => (
          <mesh
            key={x}
            position={[x, 0.95, 0]}
            rotation={[0, 0, i === 0 ? 0.22 : -0.22]}
          >
            <cylinderGeometry args={[0.075, 0.05, 1.6, 10]} />
            <meshStandardMaterial
              color={PULP}
              roughness={0.4}
              emissive={PULP}
              emissiveIntensity={0.25}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Titanium screw implant: ribbed screw + abutment + crown. */
function Implant() {
  return (
    <group>
      {/* threaded screw */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.3, 2.3, 24]} />
        <meshStandardMaterial color="#9aa5b1" roughness={0.3} metalness={0.95} />
      </mesh>
      {[0.55, 0.95, 1.35, 1.75, 2.05].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.44, 0.055, 12, 32]} />
          <meshStandardMaterial color="#8b98a5" roughness={0.3} metalness={0.95} />
        </mesh>
      ))}
      {/* abutment */}
      <mesh position={[0, 2.7, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.36, 0.55, 20]} />
        <meshStandardMaterial color="#c0cad4" roughness={0.25} metalness={0.95} />
      </mesh>
      {/* crown */}
      <mesh position={[0, 3.6, 0]} scale={[1.25, 1.0, 1.05]} castShadow>
        <sphereGeometry args={[1, 40, 32]} />
        <meshStandardMaterial color={ENAMEL} roughness={0.22} />
      </mesh>
    </group>
  );
}

/** Row of 5 teeth with brackets and an archwire. */
function Braces() {
  return (
    <group>
      {/* gum line */}
      <mesh position={[0, 1.35, -0.15]}>
        <boxGeometry args={[4.9, 0.55, 0.7]} />
        <meshStandardMaterial color="#e0668a" roughness={0.6} />
      </mesh>
      {[-1.7, -0.85, 0, 0.85, 1.7].map((x) => (
        <group key={x} position={[x, 2.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.72, 0.95, 0.55]} />
            <meshStandardMaterial color={ENAMEL} roughness={0.25} />
          </mesh>
          {/* bracket */}
          <mesh position={[0, 0, 0.32]}>
            <boxGeometry args={[0.3, 0.3, 0.12]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.9} />
          </mesh>
        </group>
      ))}
      {/* archwire through the brackets */}
      <mesh position={[0, 2.35, 0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, 4.6, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.95} />
      </mesh>
    </group>
  );
}

/** Upper denture: gum arch (torus segment) with 8 teeth. */
function Denture() {
  const R = 1.9;
  const ARC = Math.PI * 1.15;
  const teeth = Array.from({ length: 8 }, (_, i) => (i / 7) * ARC);
  return (
    <group position={[0, 0.6, 0]}>
      {/* gum arch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.4, 0]} castShadow>
        <torusGeometry args={[R, 0.34, 16, 64, ARC]} />
        <meshStandardMaterial color="#e0668a" roughness={0.55} />
      </mesh>
      {/* teeth along the arch */}
      {teeth.map((a, i) => (
        <mesh
          key={i}
          position={[R * Math.cos(a), 2.15, -R * Math.sin(a)]}
          rotation={[0, -a, 0]}
          castShadow
        >
          <boxGeometry args={[0.42, 0.7, 0.5]} />
          <meshStandardMaterial color={ENAMEL} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

const VIEW_LABELS: Record<ViewMode, string> = {
  tooth: "Molar cross-section",
  implant: "Dental implant",
  braces: "Braces",
  denture: "Upper denture",
};

const VIEW_DETAILS: Record<ViewMode, string> = {
  tooth: "enamel · dentin · pulp",
  implant: "screw · abutment · crown",
  braces: "5 teeth · wire · brackets",
  denture: "gum arch · 8 teeth",
};

export function DentalSim(props: SimProps) {
  const rawView = String(props.view ?? "tooth");
  const view: ViewMode =
    rawView === "implant" || rawView === "braces" || rawView === "denture"
      ? rawView
      : "tooth";
  const explode = Math.min(1, Math.max(0, Number(props.explode ?? 0)));

  const spin = useRef<THREE.Group>(null!);

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["View", VIEW_LABELS[view]],
          ["Layers", VIEW_DETAILS[view]],
          ["Explode", `${Math.round(explode * 100)}%`],
        ]}
      />
      <SimCanvas cameraPosition={[0, 3, 10]} target={[0, 2, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 24]} />
          <meshStandardMaterial color="#101a30" roughness={1} />
        </mesh>
        <group ref={spin}>
          {view === "tooth" && <Molar explode={explode} />}
          {view === "implant" && <Implant />}
          {view === "braces" && <Braces />}
          {view === "denture" && <Denture />}
        </group>
        <IdleSpin group={spin} />
      </SimCanvas>
    </div>
  );
}
