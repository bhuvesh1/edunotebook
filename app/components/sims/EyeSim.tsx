// app/components/sims/EyeSim.tsx
// Eye anatomy with a refraction lab: three parallel light rays enter the
// eye and converge on the retina (normal), in front of it (myopia), or
// behind it (hypermetropia).

"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

const CY = 0.5; // eye-center height

const CONDITION_LABEL: Record<string, string> = {
  normal: "Normal",
  myopia: "Myopia",
  hypermetropia: "Hypermetropia",
};

const FOCUS_LABEL: Record<string, string> = {
  normal: "On the retina",
  myopia: "In front of the retina",
  hypermetropia: "Behind the retina",
};

// Where the rays converge along z (eye center at z = 0).
const FOCAL_Z: Record<string, number> = {
  normal: -1.85, // on the retina
  myopia: -0.85, // in front of the retina
  hypermetropia: -2.75, // behind the retina
};

function PartLabel({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html position={position} center distanceFactor={13} style={{ pointerEvents: "none" }}>
      <div className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
        {text}
      </div>
    </Html>
  );
}

export function EyeSim(props: SimProps) {
  const part = String(props.part ?? "all");
  const condition = String(props.condition ?? "normal");
  const focalZ = FOCAL_Z[condition] ?? FOCAL_Z.normal;

  const glow = (key: string) => part === "all" || part === key;

  const corneaMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7dd3fc",
        transparent: true,
        opacity: 0.32,
        roughness: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
        emissive: new THREE.Color("#f59e0b"),
        emissiveIntensity: glow("cornea") ? 0.45 : 0,
      }),
    [part]
  );

  const lensMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#fde68a",
        transparent: true,
        opacity: 0.5,
        roughness: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
        emissive: new THREE.Color("#f59e0b"),
        emissiveIntensity: glow("lens") ? 0.55 : 0,
      }),
    [part]
  );

  const retinaMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#dc2626",
        roughness: 0.7,
        side: THREE.DoubleSide,
        emissive: new THREE.Color("#f59e0b"),
        emissiveIntensity: glow("retina") ? 0.5 : 0.08,
      }),
    [part]
  );

  const shellMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.35,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Three parallel rays: straight in, bend at cornea + lens, converge at the focal point.
  const rays = useMemo(() => {
    const lines: THREE.Line[] = [];
    for (const h of [CY - 0.5, CY, CY + 0.5]) {
      const y3 = CY + (h - CY) * 0.55; // height at the lens plane
      const slope = (CY - y3) / (focalZ - 1.15); // dy/dz past the lens
      const pts = [
        new THREE.Vector3(0, h, 6),
        new THREE.Vector3(0, h, 2.05), // cornea
        new THREE.Vector3(0, CY + (h - CY) * 0.82, 1.6),
        new THREE.Vector3(0, y3, 1.15), // lens
        new THREE.Vector3(0, CY, focalZ), // focal point
        new THREE.Vector3(0, CY - slope * 0.7, focalZ - 0.7), // continue past focus
      ];
      lines.push(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: "#fde047", transparent: true, opacity: 0.95 })
        )
      );
    }
    return lines;
  }, [focalZ]);

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Condition", CONDITION_LABEL[condition] ?? "Normal"],
          ["Rays focus", FOCUS_LABEL[condition] ?? "On the retina"],
        ]}
      />
      <SimCanvas cameraPosition={[0, 1.5, 10]} target={[0, 0.5, 0]}>
        {/* eyeball shell with the front cut away */}
        <mesh
          material={shellMat}
          position={[0, CY, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow
        >
          <sphereGeometry args={[2, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.85]} />
        </mesh>

        {/* cornea: transparent bulging cap at the front */}
        <mesh
          material={corneaMat}
          position={[0, CY, 0.46]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <sphereGeometry args={[1.6, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.19]} />
        </mesh>

        {/* crystalline lens: two sphere caps back to back */}
        <mesh
          material={lensMat}
          position={[0, CY, 0.443]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <sphereGeometry args={[1.0, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.25]} />
        </mesh>
        <mesh
          material={lensMat}
          position={[0, CY, 1.857]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <sphereGeometry args={[1.0, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.25]} />
        </mesh>

        {/* retina: inner back hemisphere, reddish */}
        <mesh
          material={retinaMat}
          position={[0, CY, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <sphereGeometry args={[1.85, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>

        {/* optic nerve */}
        <mesh position={[0, CY, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.8, 16]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.6} />
        </mesh>

        {/* light rays */}
        {rays.map((line, i) => (
          <primitive key={i} object={line} />
        ))}

        {/* focal point marker */}
        <mesh position={[0, CY, focalZ]}>
          <sphereGeometry args={[0.09, 16, 12]} />
          <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={2} />
        </mesh>

        {/* labels */}
        <PartLabel position={[0, CY + 1.35, 2.1]} text="Cornea" />
        <PartLabel position={[1.5, CY - 0.55, 1.15]} text="Lens" />
        <PartLabel position={[-1.6, CY + 1.0, -1.2]} text="Retina" />
        <PartLabel position={[0.65, CY - 0.5, focalZ]} text="Focal point" />
      </SimCanvas>
    </div>
  );
}
