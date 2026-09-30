// app/components/sims/UploadedModelViewer.tsx
// Renders an admin-uploaded GLB/glTF model (Model3D) on a topic page.
// Same visual language as the other sims: capped DPR, studio lighting,
// orbit controls. Load failures throw and are caught by SimErrorBoundary,
// which shows an honest "3D view couldn't start" message.

"use client";

import { Suspense, useMemo } from "react";
import { Box3, Vector3 } from "three";
import type { Mesh } from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { StudioEnvironment, StudioPerf, StudioPost, StudioShadows } from "./StudioEffects";

// Clone (never mutate the drei cache), enable shadows, then normalise: scale to
// ~3 units tall/wide and rest the model on y=0 so shadows, camera and orbit
// target work for any uploaded model regardless of its native size/origin.
function UploadedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { object, scale } = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const max = Math.max(size.x, size.y, size.z);
    clone.position.set(-center.x, -box.min.y, -center.z);
    return { object: clone, scale: max > 0 ? 3 / max : 1 };
  }, [scene]);
  return (
    <group scale={scale}>
      <primitive object={object} />
    </group>
  );
}

function Loader() {
  const { progress } = useProgress();
  if (progress >= 100) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <p className="animate-pulse text-sm font-semibold text-slate-300">
        Loading 3D model… {Math.round(progress)}%
      </p>
    </div>
  );
}

export function UploadedModelViewer({ url }: { url: string }) {
  // Warm the drei cache so the in-Canvas <Suspense> resolves quickly.
  useGLTF.preload(url);
  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        shadows
        camera={{ position: [4, 3, 6], fov: 45 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0b1020"]} />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={["#e8f0ff", "#1a2338", 0.55]} />
        <directionalLight
          position={[7, 12, 7]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-6, 4, -6]} intensity={0.35} />
        <StudioEnvironment />
        <Suspense fallback={null}>
          <UploadedModel url={url} />
          {/* Inside Suspense so the one-shot shadow bake runs AFTER the model loads */}
          <StudioShadows y={0.005} size={12} />
        </Suspense>
        <StudioPerf />
        <StudioPost />
        <OrbitControls
          makeDefault
          target={[0, 1.2, 0]}
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI * 0.55}
          minDistance={1.5}
          maxDistance={30}
        />
      </Canvas>
      <Loader />
    </div>
  );
}
