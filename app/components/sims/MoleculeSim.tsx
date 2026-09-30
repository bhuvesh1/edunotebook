// app/components/sims/MoleculeSim.tsx
// Ball-and-stick molecule viewer. Select a molecule; it slowly rotates.
// CPK-ish colours, realistic bond angles.

"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

interface AtomDef {
  el: string;
  pos: [number, number, number];
}
interface BondDef {
  a: number;
  b: number;
  order?: number;
}
interface Molecule {
  name: string;
  formula: string;
  angle: string;
  atoms: AtomDef[];
  bonds: BondDef[];
}

// CPK colours
const COLORS: Record<string, string> = {
  H: "#f8fafc",
  C: "#334155",
  O: "#ef4444",
  N: "#3b82f6",
  Cl: "#22c55e",
  Na: "#a855f7",
};
const RADII: Record<string, number> = {
  H: 0.32,
  C: 0.42,
  O: 0.42,
  N: 0.42,
  Cl: 0.48,
  Na: 0.5,
};

const MOLECULES: Record<string, Molecule> = {
  H2O: {
    name: "Water",
    formula: "H₂O",
    angle: "104.5° (bent)",
    atoms: [
      { el: "O", pos: [0, 0, 0] },
      { el: "H", pos: [0.96, 0.75, 0] },
      { el: "H", pos: [-0.96, 0.75, 0] },
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 0, b: 2 },
    ],
  },
  CO2: {
    name: "Carbon dioxide",
    formula: "CO₂",
    angle: "180° (linear)",
    atoms: [
      { el: "C", pos: [0, 0, 0] },
      { el: "O", pos: [1.5, 0, 0] },
      { el: "O", pos: [-1.5, 0, 0] },
    ],
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 2 },
    ],
  },
  CH4: {
    name: "Methane",
    formula: "CH₄",
    angle: "109.5° (tetrahedral)",
    atoms: [
      { el: "C", pos: [0, 0, 0] },
      { el: "H", pos: [1, 1, 1] },
      { el: "H", pos: [1, -1, -1] },
      { el: "H", pos: [-1, 1, -1] },
      { el: "H", pos: [-1, -1, 1] },
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 0, b: 2 },
      { a: 0, b: 3 },
      { a: 0, b: 4 },
    ],
  },
  NH3: {
    name: "Ammonia",
    formula: "NH₃",
    angle: "107° (pyramidal)",
    atoms: [
      { el: "N", pos: [0, 0.35, 0] },
      { el: "H", pos: [1, -0.55, 0] },
      { el: "H", pos: [-0.5, -0.55, 0.87] },
      { el: "H", pos: [-0.5, -0.55, -0.87] },
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 0, b: 2 },
      { a: 0, b: 3 },
    ],
  },
  C6H6: {
    name: "Benzene",
    formula: "C₆H₆",
    angle: "120° (planar ring)",
    atoms: [
      ...Array.from({ length: 6 }, (_, i) => {
        const th = (i / 6) * Math.PI * 2;
        return { el: "C", pos: [Math.cos(th) * 1.4, 0, Math.sin(th) * 1.4] as [number, number, number] };
      }),
      ...Array.from({ length: 6 }, (_, i) => {
        const th = (i / 6) * Math.PI * 2;
        return { el: "H", pos: [Math.cos(th) * 2.35, 0, Math.sin(th) * 2.35] as [number, number, number] };
      }),
    ],
    bonds: [
      ...Array.from({ length: 6 }, (_, i) => ({ a: i, b: (i + 1) % 6, order: i % 2 === 0 ? 2 : 1 })),
      ...Array.from({ length: 6 }, (_, i) => ({ a: i, b: i + 6 })),
    ],
  },
  O2: {
    name: "Oxygen",
    formula: "O₂",
    angle: "— (diatomic)",
    atoms: [
      { el: "O", pos: [0.65, 0, 0] },
      { el: "O", pos: [-0.65, 0, 0] },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }],
  },
  NaCl: {
    name: "Sodium chloride",
    formula: "NaCl",
    angle: "— (ionic)",
    atoms: [
      { el: "Na", pos: [0.7, 0, 0] },
      { el: "Cl", pos: [-0.7, 0, 0] },
    ],
    bonds: [],
  },
};

function BondStick({ a, b, order }: { a: [number, number, number]; b: [number, number, number]; order: number }) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dir = end.clone().sub(start);
  const len = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

  if (order === 1) {
    return (
      <mesh position={mid.toArray()} quaternion={quat}>
        <cylinderGeometry args={[0.09, 0.09, len, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.35} />
      </mesh>
    );
  }
  // double bond: two offset sticks
  const perp = new THREE.Vector3(0, 0, 1);
  return (
    <group>
      {[-0.14, 0.14].map((off, i) => {
        const o = perp.clone().multiplyScalar(off);
        return (
          <mesh key={i} position={mid.clone().add(o).toArray()} quaternion={quat}>
            <cylinderGeometry args={[0.06, 0.06, len, 10]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

function MoleculeModel({ mol }: { mol: Molecule }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.45;
  });
  return (
    <group ref={group}>
      {mol.atoms.map((atom, i) => (
        <mesh key={i} position={atom.pos}>
          <sphereGeometry args={[RADII[atom.el] ?? 0.4, 24, 24]} />
          <meshStandardMaterial
            color={COLORS[atom.el] ?? "#94a3b8"}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      ))}
      {mol.bonds.map((bond, i) => (
        <BondStick
          key={i}
          a={mol.atoms[bond.a].pos}
          b={mol.atoms[bond.b].pos}
          order={bond.order ?? 1}
        />
      ))}
    </group>
  );
}

export function MoleculeSim(props: SimProps) {
  const key = String(props.molecule ?? "H2O");
  const mol = MOLECULES[key] ?? MOLECULES.H2O;
  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Molecule", `${mol.name} (${mol.formula})`],
          ["Geometry", mol.angle],
        ]}
      />
      <SimCanvas cameraPosition={[0, 2.5, 7.5]} target={[0, 0, 0]}>
        <MoleculeModel key={key} mol={mol} />
      </SimCanvas>
    </div>
  );
}
