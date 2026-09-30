// app/components/sims/CellSim.tsx
// Animal cell: translucent membrane, nucleus with nucleolus,
// mitochondria, rough ER suggestion and ribosome dots.
// Organelle selector highlights one part and explains it.

"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

const INFO: Record<string, [string, string]> = {
  all: ["Animal cell", "Select an organelle to highlight it"],
  membrane: ["Cell membrane", "Selective barrier — controls what enters and leaves"],
  nucleus: ["Nucleus", "Stores DNA; directs all cell activities"],
  nucleolus: ["Nucleolus", "Makes ribosomal RNA inside the nucleus"],
  mitochondria: ["Mitochondria", "Powerhouse — releases energy from glucose (ATP)"],
  ribosome: ["Ribosomes", "Build proteins from amino acids"],
};

function Mitochondrion({ position, highlight }: { position: [number, number, number]; highlight: boolean }) {
  return (
    <group position={position} rotation={[0.6, 0.4, 0.2]}>
      {/* outer capsule */}
      <mesh>
        <capsuleGeometry args={[0.42, 0.9, 8, 16]} />
        <meshStandardMaterial
          color={highlight ? "#fb923c" : "#c2410c"}
          emissive={highlight ? "#ea580c" : "#000000"}
          emissiveIntensity={highlight ? 0.7 : 0}
          roughness={0.4}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* cristae ridges */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.3, 0.05, 8, 24]} />
          <meshStandardMaterial color="#fdba74" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function CellSim(props: SimProps) {
  const focus = String(props.organelle ?? "all");
  const spin = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (spin.current && focus === "all") spin.current.rotation.y += delta * 0.25;
  });
  const [title, blurb] = INFO[focus] ?? INFO.all;
  const hl = (k: string) => focus === k || focus === "all";

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Viewing", title],
          ["Note", blurb],
        ]}
      />
      <SimCanvas cameraPosition={[0, 3.5, 11]} target={[0, 0, 0]}>
        <group ref={spin}>
          {/* cell membrane: translucent sphere */}
          <mesh>
            <sphereGeometry args={[4.2, 48, 48]} />
            <meshPhysicalMaterial
              color="#7dd3fc"
              transparent
              opacity={focus === "membrane" ? 0.35 : 0.13}
              roughness={0.15}
              metalness={0}
              emissive={focus === "membrane" ? "#0284c7" : "#000000"}
              emissiveIntensity={focus === "membrane" ? 0.5 : 0}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* nucleus */}
          <group position={[0.6, 0.4, 0.3]}>
            <mesh>
              <sphereGeometry args={[1.5, 32, 32]} />
              <meshStandardMaterial
                color={hl("nucleus") ? "#a78bfa" : "#6d28d9"}
                emissive={focus === "nucleus" ? "#7c3aed" : "#000000"}
                emissiveIntensity={focus === "nucleus" ? 0.8 : 0}
                roughness={0.45}
                transparent
                opacity={0.95}
              />
            </mesh>
            {/* nucleolus */}
            <mesh position={[0.35, 0.3, 0.35]}>
              <sphereGeometry args={[0.55, 20, 20]} />
              <meshStandardMaterial
                color={focus === "nucleolus" ? "#f0abfc" : "#a21caf"}
                emissive={focus === "nucleolus" ? "#d946ef" : "#000000"}
                emissiveIntensity={focus === "nucleolus" ? 0.9 : 0}
                roughness={0.4}
              />
            </mesh>
          </group>

          {/* mitochondria */}
          <Mitochondrion position={[-2.2, -1.2, 1.2]} highlight={focus === "mitochondria"} />
          <Mitochondrion position={[2.4, -1.6, -1.0]} highlight={focus === "mitochondria"} />
          <Mitochondrion position={[-1.4, 1.8, -1.6]} highlight={focus === "mitochondria"} />

          {/* ribosome dots scattered in cytoplasm */}
          {Array.from({ length: 26 }).map((_, i) => {
            const th = (i / 26) * Math.PI * 2 + (i % 3);
            const ph = ((i * 2.4) % 3) - 1.2;
            const r = 3.1;
            return (
              <mesh
                key={i}
                position={[Math.cos(th) * r * Math.cos(ph), Math.sin(ph) * r, Math.sin(th) * r * Math.cos(ph)]}
              >
                <sphereGeometry args={[0.13, 10, 10]} />
                <meshStandardMaterial
                  color={focus === "ribosome" ? "#fde047" : "#a16207"}
                  emissive={focus === "ribosome" ? "#eab308" : "#000000"}
                  emissiveIntensity={focus === "ribosome" ? 0.9 : 0}
                  roughness={0.5}
                />
              </mesh>
            );
          })}
        </group>
      </SimCanvas>
    </div>
  );
}
