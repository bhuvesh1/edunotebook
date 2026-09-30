// app/components/sims/LensSim.tsx
// Convex lens ray diagram: parallel rays converge at the focal point,
// a draggable-via-slider object arrow, and the real image from 1/f = 1/v + 1/u.

"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { SimCanvas, SimReadout } from "./SimCanvas";
import { makeGlowTexture } from "../../../lib/simulations/textures";
import type { SimProps } from "./sim-props";

const F = 2; // focal length (scene units)

type Vec2 = [number, number];

/** Thin glowing cylinder between two 2D points (drawn in the z=0 plane). */
function Beam({ from, to, color = "#fde047" }: { from: Vec2; to: Vec2; color?: string }) {
  const [fx, fy] = from;
  const [tx, ty] = to;
  const dx = tx - fx;
  const dy = ty - fy;
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  return (
    <mesh position={[(fx + tx) / 2, (fy + ty) / 2, 0]} rotation={[0, 0, ang - Math.PI / 2]}>
      <cylinderGeometry args={[0.028, 0.028, len, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Arrow({
  x,
  height,
  color,
}: {
  x: number;
  height: number;
  color: string;
}) {
  const h = Math.abs(height);
  const up = height >= 0;
  const tipY = up ? h : 0;
  const baseY = up ? 0 : h;
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, (baseY + tipY) / 2 - (up ? 0 : 0), 0]}>
        <cylinderGeometry args={[0.06, 0.06, h, 10]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, up ? h + 0.12 : -0.12, 0]} rotation={[0, 0, up ? 0 : Math.PI]}>
        <coneGeometry args={[0.16, 0.34, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function LensSim(props: SimProps) {
  const objectDistance = Number(props.objectDistance ?? 6);

  // Thin-lens equation: 1/f = 1/do + 1/di
  const di = 1 / (1 / F - 1 / objectDistance);
  const m = -di / objectDistance;
  const showImage = di > 0 && di < 11;

  const glow = useMemo(() => makeGlowTexture(), []);

  // Biconvex lens profile, lathed around Y then rotated so its axis is X.
  const lensGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const y = -1.9 + (3.8 * i) / 24;
      const r = 0.34 * Math.sqrt(Math.max(0, 1 - (y / 2.0) ** 2));
      pts.push(new THREE.Vector2(r, y));
    }
    return new THREE.LatheGeometry(pts, 40);
  }, []);

  const objH = 1.1;
  const objX = -objectDistance;

  // Ray 1: parallel → refracts through far focal point.
  const ray1Lens: Vec2 = [0, objH];
  const ray1End: Vec2 = [10, objH - 0.5 * 10]; // slope -objH/F through (F,0)
  // Ray 2: through lens centre, undeviated.
  const ray2End: Vec2 = [10, objH - ((10 - objX) * objH) / objectDistance];
  // Ray 3: through near focal point → emerges parallel.
  // from tip through (-F, 0): hits x=0 at y = objH*(objX + F... solve:
  const t3 = (0 - objX) / (-F - objX); // param along tip→(-F,0)
  const ray3LensY = objH + t3 * (0 - objH);
  const ray3Lens: Vec2 = [0, ray3LensY];

  return (
    <div className="relative h-full w-full">
      <SimReadout
        items={[
          ["f", `${F} cm`],
          ["Object u", `${objectDistance.toFixed(2)} cm`],
          ["Image v", showImage ? `${di.toFixed(2)} cm` : "—"],
          ["Magnification", showImage ? `${m.toFixed(2)}×` : "—"],
        ]}
      />
      <SimCanvas cameraPosition={[0, 3.2, 15]} target={[0, 0.6, 0]}>
        {/* principal axis */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 23, 8]} />
          <meshBasicMaterial color="#475569" />
        </mesh>

        {/* the convex lens */}
        <mesh geometry={lensGeo} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial
            color="#7dd3fc"
            transparent
            opacity={0.42}
            roughness={0.12}
            metalness={0.1}
          />
        </mesh>

        {/* focal points + glow */}
        {[-F, F].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshBasicMaterial color="#fb923c" />
            </mesh>
            <sprite scale={[0.9, 0.9, 1]}>
              <spriteMaterial map={glow} transparent depthWrite={false} />
            </sprite>
          </group>
        ))}

        {/* object arrow (red) and image arrow (green) */}
        <Arrow x={objX} height={objH} color="#ef4444" />
        {showImage && <Arrow x={di} height={m * objH} color="#22c55e" />}

        {/* ray diagram */}
        <Beam from={[objX, objH]} to={ray1Lens} />
        <Beam from={ray1Lens} to={ray1End} />
        <Beam from={[objX, objH]} to={ray2End} />
        <Beam from={[objX, objH]} to={ray3Lens} />
        <Beam from={ray3Lens} to={[10, ray3LensY]} />
      </SimCanvas>
    </div>
  );
}
