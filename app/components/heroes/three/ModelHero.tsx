'use client';

// Interactive 3D hero canvas. Sets up renderer / lights / PBR environment once,
// delegates the actual model to ./models, and handles resize, reduced-motion,
// background-tab pausing, WebGL failure fallback and full disposal on unmount.

import { useEffect, useReducer, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildModel, HeroModel } from './models';

export default function ModelHero({ slug }: { slug: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [model, setModel] = useState<HeroModel | null>(null);
  const [, force] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let raf = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    if (!renderer.getContext()) {
      setFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();

    // PBR environment reflections — this is what makes metals / enamel look real.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);

    // Studio lighting rig
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(5, 7, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdde8ff, 0.7);
    fill.position.set(-6, 2, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff1d6, 1.4);
    rim.position.set(-2, 4, -7);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 0.35));

    const model = buildModel(slug);
    setModel(model);
    scene.add(model.object);
    camera.position.set(...model.cameraPos);
    camera.lookAt(...model.lookAt);

    // Interactive orbit controls — drag to rotate, pinch/scroll to zoom,
    // like the PhysicsClass viewer. Works with mouse + touch.
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    const lookTarget = new THREE.Vector3(...model.lookAt);
    const camDist = camera.position.distanceTo(lookTarget);
    controls.minDistance = model.orbit?.minDistance ?? camDist * 0.45;
    controls.maxDistance = model.orbit?.maxDistance ?? camDist * 2.4;
    controls.minPolarAngle = model.orbit?.minPolarAngle ?? 0.15;
    controls.maxPolarAngle = model.orbit?.maxPolarAngle ?? Math.PI * 0.72;
    // Keep vertical page-scroll working on touch screens; horizontal drag orbits.
    renderer.domElement.style.touchAction = 'pan-y';

    const resize = () => {
      if (disposed || !renderer) return;
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Single loop drives both the model animation and the orbit controls.
    // Reduced-motion users get a static model but can still drag/zoom it.
    const loop = () => {
      if (disposed) return;
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      if (!reduced) model.tick(t, dt);
      controls.update();
      renderer!.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => disposeMat(m));
        else if (mat) disposeMat(mat);
      });
      renderer?.dispose();
    };
  }, [slug]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-amber-200 via-orange-300 to-rose-300 opacity-70 blur-[1px]" />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      {/* soft radial glow behind the model */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 62% 55% at 50% 46%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
        }}
      />
      <canvas ref={canvasRef} className="relative block h-full w-full" aria-label={`${slug} 3D model`} />
      {model?.controls?.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            c.action();
            force();
          }}
          className="absolute left-3 top-3 z-10 rounded-full bg-slate-900/75 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white shadow backdrop-blur transition hover:bg-slate-900/95"
        >
          {c.label()}
        </button>
      ))}
    </div>
  );
}

function disposeMat(m: THREE.Material) {
  const anyM = m as unknown as Record<string, unknown>;
  for (const key of ['map', 'envMap']) {
    const tex = anyM[key] as THREE.Texture | undefined;
    if (tex && typeof tex.dispose === 'function') tex.dispose();
  }
  m.dispose();
}
