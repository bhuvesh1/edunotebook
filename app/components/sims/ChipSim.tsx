// app/components/sims/ChipSim.tsx
// CPU block explorer: a dark chip package with the silicon die on top,
// carrying four labeled blocks (ALU / cache / control unit / registers).
// Glowing data packets circulate the on-die bus at a speed set by the clock.

"use client";

import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SimCanvas, SimReadout } from "./SimCanvas";
import type { SimProps } from "./sim-props";

interface BlockDef {
  key: string;
  name: string;
  color: string;
  pos: [number, number];
  fn: string;
}

const BLOCKS: BlockDef[] = [
  { key: "alu", name: "ALU", color: "#ef4444", pos: [-2.1, -2.1], fn: "Does all the maths & logic" },
  { key: "cache", name: "Cache", color: "#3b82f6", pos: [2.1, -2.1], fn: "Ultra-fast memory next to the ALU" },
  { key: "control", name: "Control Unit", color: "#22c55e", pos: [-2.1, 2.1], fn: "Decodes instructions, directs data flow" },
  { key: "registers", name: "Registers", color: "#eab308", pos: [2.1, 2.1], fn: "Tiny storage slots the CPU works on directly" },
];

const BLOCK_KEYS = ["all", "alu", "cache", "control", "registers"];

// Closed bus loop through the four block centres (x, z pairs).
const BUS: [number, number][] = [
  [-2.1, -2.1],
  [2.1, -2.1],
  [2.1, 2.1],
  [-2.1, 2.1],
];
const BUS_Y = 1.3;
const PACKET_COUNT = 8;
const PIN_POS = [-4.4, -3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3, 4.4];

// Runs inside <Canvas>: advances every packet along the closed bus loop.
function BusTraffic({
  packets,
  elapsed,
  clock,
}: {
  packets: RefObject<THREE.Group>;
  elapsed: RefObject<number>;
  clock: number;
}) {
  useFrame((_, delta) => {
    elapsed.current += delta * clock;
    const g = packets.current;
    if (!g) return;
    for (let i = 0; i < g.children.length; i++) {
      const frac = (elapsed.current * 0.16 + i / g.children.length) % 1;
      const seg = Math.min(3, Math.floor(frac * 4));
      const f = frac * 4 - seg;
      const a = BUS[seg];
      const b = BUS[(seg + 1) % 4];
      g.children[i].position.set(
        a[0] + (b[0] - a[0]) * f,
        BUS_Y,
        a[1] + (b[1] - a[1]) * f
      );
    }
  });
  return null;
}

function TinyLabel({
  position,
  children,
}: {
  position: [number, number, number];
  children: string;
}) {
  return (
    <Html
      center
      position={position}
      distanceFactor={13}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <div
        style={{
          whiteSpace: "nowrap",
          background: "rgba(0,0,0,0.62)",
          borderRadius: 6,
          padding: "2px 7px",
          fontSize: 10,
          fontWeight: 600,
          color: "#fff",
        }}
      >
        {children}
      </div>
    </Html>
  );
}

export function ChipSim(props: SimProps) {
  const rawBlock = String(props.block ?? "all");
  const block = BLOCK_KEYS.includes(rawBlock) ? rawBlock : "all";
  const clock = Math.min(4, Math.max(0.5, Number(props.clock ?? 1)));

  const packets = useRef<THREE.Group>(null!);
  const elapsed = useRef(0);

  const active = BLOCKS.find((b) => b.key === block);

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["Active block", active ? active.name : "Whole CPU"],
          ["Function", active ? active.fn : "4 blocks, data flows on the bus"],
          ["Clock", `${clock}×`],
        ]}
      />
      <SimCanvas cameraPosition={[0, 8, 8]} target={[0, 0, 0]}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.01, 0]} receiveShadow>
          <planeGeometry args={[40, 30]} />
          <meshStandardMaterial color="#0f172a" roughness={1} />
        </mesh>

        {/* chip package */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[10.4, 1, 10.4]} />
          <meshStandardMaterial color="#111827" roughness={0.5} metalness={0.3} />
        </mesh>

        {/* pins around all four edges */}
        {PIN_POS.map((p) => (
          <group key={p}>
            <mesh position={[p, -0.5, -5.35]} castShadow>
              <boxGeometry args={[0.32, 0.3, 0.5]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.9} />
            </mesh>
            <mesh position={[p, -0.5, 5.35]} castShadow>
              <boxGeometry args={[0.32, 0.3, 0.5]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.9} />
            </mesh>
            <mesh position={[-5.35, -0.5, p]} castShadow>
              <boxGeometry args={[0.5, 0.3, 0.32]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.9} />
            </mesh>
            <mesh position={[5.35, -0.5, p]} castShadow>
              <boxGeometry args={[0.5, 0.3, 0.32]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* silicon die */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[8.4, 0.4, 8.4]} />
          <meshStandardMaterial color="#1e3a5f" roughness={0.35} metalness={0.6} />
        </mesh>
        <TinyLabel position={[0, 0.62, 3.85]}>silicon die</TinyLabel>

        {/* bus traces between the blocks */}
        {BUS.map((pt, i) => {
          const nxt = BUS[(i + 1) % 4];
          const dx = nxt[0] - pt[0];
          const dz = nxt[1] - pt[1];
          const len = Math.hypot(dx, dz);
          return (
            <mesh
              key={i}
              position={[(pt[0] + nxt[0]) / 2, 0.43, (pt[1] + nxt[1]) / 2]}
              rotation={[0, Math.atan2(dx, dz), 0]}
            >
              <boxGeometry args={[0.14, 0.04, len]} />
              <meshStandardMaterial
                color="#64748b"
                emissive="#38bdf8"
                emissiveIntensity={0.25}
              />
            </mesh>
          );
        })}

        {/* the four functional blocks */}
        {BLOCKS.map((b) => {
          const hot = block === b.key;
          return (
            <group key={b.key}>
              <mesh position={[b.pos[0], 0.72, b.pos[1]]} castShadow>
                <boxGeometry args={[2.6, 0.62, 2.6]} />
                <meshStandardMaterial
                  color={b.color}
                  roughness={0.4}
                  metalness={0.25}
                  emissive={hot ? b.color : "#000000"}
                  emissiveIntensity={hot ? 0.75 : 0}
                />
              </mesh>
              {/* inner core detail */}
              <mesh position={[b.pos[0], 1.05, b.pos[1]]}>
                <boxGeometry args={[1.5, 0.06, 1.5]} />
                <meshStandardMaterial
                  color="#0f172a"
                  roughness={0.6}
                  emissive={hot ? b.color : "#000000"}
                  emissiveIntensity={hot ? 0.35 : 0}
                />
              </mesh>
              <TinyLabel position={[b.pos[0], 1.5, b.pos[1]]}>{b.name}</TinyLabel>
            </group>
          );
        })}

        {/* data packets circulating the bus */}
        <group ref={packets}>
          {Array.from({ length: PACKET_COUNT }).map((_, i) => (
            <mesh key={i} position={[BUS[0][0], BUS_Y, BUS[0][1]]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#f59e0b"
                emissiveIntensity={1.6}
              />
            </mesh>
          ))}
        </group>
        <BusTraffic packets={packets} elapsed={elapsed} clock={clock} />
      </SimCanvas>
    </div>
  );
}
