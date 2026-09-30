// Realistic interactive 3D hero models for the 7 EduNotebook subjects.
// Built with plain Three.js (no react-three-fiber) for full control + small surface.
// Each builder returns { object, camera, tick } — the ModelHero component handles
// renderer, lights, environment, resize, reduced-motion and cleanup.

import * as THREE from 'three';

export interface HeroControls {
  label: () => string;
  action: () => void;
}

export interface HeroModel {
  object: THREE.Group;
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  tick: (t: number, dt: number) => void;
  controls?: HeroControls[];
  orbit?: {
    minDistance?: number;
    maxDistance?: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
  };
}

type Vec3 = [number, number, number];

function std(
  color: number,
  opts: Partial<{ roughness: number; metalness: number }> = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.35,
    metalness: opts.metalness ?? 0.1,
  });
}

function phys(
  color: number,
  opts: Partial<{ roughness: number; clearcoat: number }> = {},
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: opts.roughness ?? 0.3,
    metalness: 0.05,
    clearcoat: opts.clearcoat ?? 0.7,
    clearcoatRoughness: 0.25,
  });
}

/* ---------------------------------- PHYSICS: solar system ---------------------------------- */

// Procedural canvas textures (client-side only — ModelHero runs in the browser).

function canvasTex(
  size: number,
  paint: (ctx: CanvasRenderingContext2D, s: number) => void,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  paint(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function blotches(
  ctx: CanvasRenderingContext2D,
  s: number,
  n: number,
  color: (a: number) => string,
  rMin: number,
  rMax: number,
  aMin: number,
  aMax: number,
) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const r = rMin + Math.random() * (rMax - rMin);
    ctx.fillStyle = color(aMin + Math.random() * (aMax - aMin));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function banded(
  ctx: CanvasRenderingContext2D,
  s: number,
  colors: string[],
  bands = 14,
  wobble = 6,
  alpha = 0.85,
) {
  const h = s / bands;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    const y0 = i * h;
    ctx.moveTo(0, y0);
    for (let x = 0; x <= s; x += 16) {
      ctx.lineTo(x, y0 + Math.sin((x / s) * Math.PI * 2 + i * 1.7) * wobble);
    }
    for (let x = s; x >= 0; x -= 16) {
      ctx.lineTo(x, y0 + h + Math.sin((x / s) * Math.PI * 2 + i * 2.3) * wobble);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

type Painter = (ctx: CanvasRenderingContext2D, s: number) => void;

const paintSun: Painter = (ctx, s) => {
  const base = ctx.createLinearGradient(0, 0, 0, s);
  base.addColorStop(0, '#ffcf5e');
  base.addColorStop(0.5, '#ffab2e');
  base.addColorStop(1, '#ef7d12');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, s, s);
  blotches(ctx, s, 700, (a) => `rgba(196,96,12,${a.toFixed(3)})`, 2, 10, 0.05, 0.16);
  blotches(ctx, s, 350, (a) => `rgba(255,228,150,${a.toFixed(3)})`, 2, 7, 0.05, 0.12);
};

const paintMercury: Painter = (ctx, s) => {
  ctx.fillStyle = '#9a938a';
  ctx.fillRect(0, 0, s, s);
  blotches(ctx, s, 320, (a) => `rgba(62,58,52,${a.toFixed(3)})`, 1.5, 7, 0.08, 0.28);
  blotches(ctx, s, 90, (a) => `rgba(200,192,180,${a.toFixed(3)})`, 1, 4, 0.06, 0.18);
};

const paintVenus: Painter = (ctx, s) => {
  ctx.fillStyle = '#e6c48d';
  ctx.fillRect(0, 0, s, s);
  banded(ctx, s, ['#e6c48d', '#dfb87e', '#f0d6a4', '#d9ae72'], 10, 14, 0.5);
  blotches(ctx, s, 60, (a) => `rgba(255,240,210,${a.toFixed(3)})`, 8, 26, 0.04, 0.1);
};

const paintEarth: Painter = (ctx, s) => {
  const ocean = ctx.createLinearGradient(0, 0, 0, s);
  ocean.addColorStop(0, '#2f6fd6');
  ocean.addColorStop(1, '#2456ad');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 11; i++) {
    const cx = Math.random() * s;
    const cy = s * 0.15 + Math.random() * s * 0.7;
    const n = 6 + ((Math.random() * 8) | 0);
    for (let j = 0; j < n; j++) {
      const x = cx + (Math.random() - 0.5) * s * 0.22;
      const y = cy + (Math.random() - 0.5) * s * 0.16;
      const r = 4 + Math.random() * 14;
      ctx.fillStyle = `rgba(63,158,77,${(0.75 + Math.random() * 0.25).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (let i = 0; i < 26; i++) {
    const y = Math.random() * s;
    const x = Math.random() * s;
    const w = 20 + Math.random() * 60;
    ctx.strokeStyle = `rgba(255,255,255,${(0.18 + Math.random() * 0.22).toFixed(3)})`;
    ctx.lineWidth = 2 + Math.random() * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w / 2, y + (Math.random() - 0.5) * 10, x + w, y);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(245,250,255,0.95)';
  ctx.fillRect(0, 0, s, s * 0.07);
  ctx.fillRect(0, s * 0.93, s, s * 0.07);
};

const paintMars: Painter = (ctx, s) => {
  ctx.fillStyle = '#cf6238';
  ctx.fillRect(0, 0, s, s);
  blotches(ctx, s, 120, (a) => `rgba(150,58,28,${a.toFixed(3)})`, 4, 20, 0.08, 0.25);
  blotches(ctx, s, 80, (a) => `rgba(232,150,100,${a.toFixed(3)})`, 3, 12, 0.06, 0.18);
  blotches(ctx, s, 200, (a) => `rgba(90,35,18,${a.toFixed(3)})`, 1, 4, 0.1, 0.3);
  ctx.fillStyle = 'rgba(245,242,235,0.9)';
  ctx.fillRect(0, 0, s, s * 0.06);
};

const paintJupiter: Painter = (ctx, s) => {
  banded(
    ctx, s,
    ['#e8d3ae', '#c69a63', '#f2e4c2', '#b3814f', '#e0bd8d', '#9c6a3e', '#efe0c0', '#d4ab74'],
    18, 7, 0.95,
  );
  blotches(ctx, s, 120, (a) => `rgba(255,245,225,${a.toFixed(3)})`, 2, 8, 0.04, 0.1);
  ctx.fillStyle = '#c1502e';
  ctx.beginPath();
  ctx.ellipse(s * 0.68, s * 0.63, s * 0.075, s * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,200,150,0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(s * 0.68, s * 0.63, s * 0.085, s * 0.055, 0, 0, Math.PI * 2);
  ctx.stroke();
};

const paintSaturn: Painter = (ctx, s) => {
  banded(ctx, s, ['#e9dcc0', '#dcc9a0', '#f2e9d2', '#d3ba87', '#e6d3a8'], 14, 5, 0.7);
};

const paintUranus: Painter = (ctx, s) => {
  ctx.fillStyle = '#a5dbe0';
  ctx.fillRect(0, 0, s, s);
  banded(ctx, s, ['#a5dbe0', '#b8e4e8', '#98cfd6'], 8, 8, 0.35);
};

const paintNeptune: Painter = (ctx, s) => {
  ctx.fillStyle = '#3a66d0';
  ctx.fillRect(0, 0, s, s);
  banded(ctx, s, ['#3a66d0', '#2f55b5', '#4a76dd', '#335cb8'], 10, 6, 0.6);
  for (let i = 0; i < 14; i++) {
    const y = Math.random() * s;
    const x = Math.random() * s;
    const w = 25 + Math.random() * 55;
    ctx.strokeStyle = `rgba(220,235,255,${(0.2 + Math.random() * 0.25).toFixed(3)})`;
    ctx.lineWidth = 2 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w / 2, y + (Math.random() - 0.5) * 8, x + w, y);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(28,48,110,0.55)';
  ctx.beginPath();
  ctx.ellipse(s * 0.4, s * 0.4, s * 0.06, s * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
};

function planetLabel(text: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const r = 22;
  const x = 6;
  const y = 10;
  const w = 244;
  const h = 44;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = 'rgba(10,17,30,0.88)';
  ctx.fill();
  ctx.fillStyle = '#eef2f7';
  ctx.font = '600 25px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, y + h / 2 + 1);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  sp.scale.set(1.5, 0.375, 1);
  return sp;
}

function buildPhysics(): HeroModel {
  const g = new THREE.Group();

  // Sun — mottled realistic surface
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 48, 48),
    new THREE.MeshBasicMaterial({ map: canvasTex(512, paintSun) }),
  );
  g.add(sun);

  // Sun glow sprite (radial gradient halo)
  const glowTex = canvasTex(256, (ctx, s) => {
    const grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255,190,80,0.85)');
    grad.addColorStop(0.35, 'rgba(255,150,40,0.35)');
    grad.addColorStop(1, 'rgba(255,140,30,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
  });
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false }),
  );
  glow.scale.setScalar(6.5);
  g.add(glow);

  // Warm point light from the sun so planets are lit realistically
  const sunLight = new THREE.PointLight(0xffd9a0, 80, 0, 1.8);
  g.add(sunLight);

  // Saturn's ring texture — concentric bands with a Cassini-like division
  const saturnRingTex = canvasTex(256, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    for (let r = 8; r < s / 2; r += 2.5) {
      const t = r / (s / 2);
      if (t > 0.6 && t < 0.68) continue; // division gap
      const a = 0.35 + 0.5 * Math.abs(Math.sin(r * 0.35)) * (1 - t * 0.4);
      ctx.strokeStyle = `rgba(214,192,144,${a.toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  interface Planet {
    mesh: THREE.Mesh;
    dist: number;
    speed: number;
    angle: number;
    spin: number;
  }
  const planets: Planet[] = [];

  const defs: {
    name: string;
    r: number;
    dist: number;
    tex: number;
    speed: number;
    spin: number;
    paint: Painter;
    ring?: 'saturn' | 'uranus';
  }[] = [
    { name: 'MERCURY', r: 0.2, dist: 2.0, tex: 256, speed: 0.62, spin: 0.25, paint: paintMercury },
    { name: 'VENUS', r: 0.33, dist: 2.7, tex: 256, speed: 0.46, spin: 0.18, paint: paintVenus },
    { name: 'EARTH', r: 0.36, dist: 3.45, tex: 256, speed: 0.37, spin: 0.55, paint: paintEarth },
    { name: 'MARS', r: 0.27, dist: 4.2, tex: 256, speed: 0.31, spin: 0.5, paint: paintMars },
    { name: 'JUPITER', r: 0.85, dist: 5.45, tex: 512, speed: 0.19, spin: 0.75, paint: paintJupiter },
    { name: 'SATURN', r: 0.72, dist: 6.95, tex: 512, speed: 0.145, spin: 0.7, paint: paintSaturn, ring: 'saturn' },
    { name: 'URANUS', r: 0.5, dist: 8.2, tex: 256, speed: 0.115, spin: 0.5, paint: paintUranus, ring: 'uranus' },
    { name: 'NEPTUNE', r: 0.48, dist: 9.35, tex: 256, speed: 0.095, spin: 0.55, paint: paintNeptune },
  ];

  defs.forEach((d, i) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(d.r, 48, 48),
      new THREE.MeshStandardMaterial({
        map: canvasTex(d.tex, d.paint),
        roughness: 0.75,
        metalness: 0.02,
      }),
    );

    // Orbit ring — thin, gray with a faint blue tint
    const ringPts: THREE.Vector3[] = [];
    for (let sgi = 0; sgi <= 128; sgi++) {
      const a = (sgi / 128) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * d.dist, 0, Math.sin(a) * d.dist));
    }
    g.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ringPts),
        new THREE.LineBasicMaterial({ color: 0x8fa3c7, transparent: true, opacity: 0.32 }),
      ),
    );

    // Name label above the planet
    const label = planetLabel(d.name);
    label.position.y = d.r + 0.5;
    mesh.add(label);

    // Planet rings
    if (d.ring === 'saturn') {
      const rg = new THREE.Mesh(
        new THREE.RingGeometry(d.r * 1.32, d.r * 2.05, 96),
        new THREE.MeshBasicMaterial({
          map: saturnRingTex,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      rg.rotation.x = Math.PI / 2 - 0.32;
      mesh.add(rg);
    } else if (d.ring === 'uranus') {
      const rg = new THREE.Mesh(
        new THREE.RingGeometry(d.r * 1.45, d.r * 1.85, 72),
        new THREE.MeshBasicMaterial({
          color: 0xcfeef2,
          transparent: true,
          opacity: 0.32,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      rg.rotation.x = 0.28;
      rg.rotation.y = 0.35;
      mesh.add(rg);
    }

    const angle = (i / defs.length) * Math.PI * 2 + 0.4;
    mesh.position.set(Math.cos(angle) * d.dist, 0, Math.sin(angle) * d.dist);
    g.add(mesh);
    planets.push({ mesh, dist: d.dist, speed: d.speed, angle, spin: d.spin });
  });

  // Starfield
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) {
    const r = 16 + Math.random() * 20;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    starPos[i * 3 + 1] = r * Math.cos(ph);
    starPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  g.add(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.85 }),
    ),
  );

  g.rotation.x = 0.3;

  let paused = false;

  return {
    object: g,
    cameraPos: [0, 8.2, 16.5],
    lookAt: [0, 0, 0],
    tick: (_t, dt) => {
      if (paused) return;
      for (const p of planets) {
        p.angle += p.speed * dt;
        p.mesh.position.set(Math.cos(p.angle) * p.dist, 0, Math.sin(p.angle) * p.dist);
        p.mesh.rotation.y += p.spin * dt;
      }
      sun.rotation.y += dt * 0.05;
    },
    controls: [
      {
        label: () => (paused ? 'Play orbits' : 'Pause orbits'),
        action: () => {
          paused = !paused;
        },
      },
    ],
  };
}

/* ---------------------------------- BIOLOGY: DNA double helix ---------------------------------- */

function buildBiology(): HeroModel {
  const g = new THREE.Group();
  const turns = 2.6;
  const height = 5.4;
  const radius = 0.85;
  const segsPerTurn = 26;
  const total = Math.floor(turns * segsPerTurn);

  const strandA: THREE.Vector3[] = [];
  const strandB: THREE.Vector3[] = [];
  for (let i = 0; i <= total; i++) {
    const a = (i / segsPerTurn) * Math.PI * 2;
    const y = (i / total - 0.5) * height;
    strandA.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
    strandB.push(new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius));
  }
  const tubeA = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strandA), 220, 0.1, 12, false),
    std(0x3b82f6, { roughness: 0.28 }),
  );
  const tubeB = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strandB), 220, 0.1, 12, false),
    std(0xef4444, { roughness: 0.28 }),
  );
  g.add(tubeA, tubeB);

  // Base-pair rungs (ATCG colors)
  const baseColors = [0x22c55e, 0xeab308, 0x2563eb, 0xf97316];
  const rungGeo = new THREE.CylinderGeometry(0.055, 0.055, 1, 10);
  for (let i = 4; i < total; i += 7) {
    const a = strandA[i];
    const b = strandB[i];
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const rung = new THREE.Mesh(rungGeo, std(baseColors[(i / 7) % 4 | 0], { roughness: 0.4 }));
    rung.scale.y = len;
    rung.position.copy(mid);
    rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    g.add(rung);
    // base caps
    for (const p of [a, b]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), rung.material);
      cap.position.copy(p);
      g.add(cap);
    }
  }

  return {
    object: g,
    cameraPos: [0.4, 0.6, 7.4],
    lookAt: [0, 0, 0],
    tick: (_t, dt) => {
      g.rotation.y += dt * 0.45;
    },
  };
}

/* ---------------------------------- CHEMISTRY: benzene molecule ---------------------------------- */

function buildChemistry(): HeroModel {
  const g = new THREE.Group();
  const mol = new THREE.Group();

  const ringR = 1.25;
  const carbonMat = std(0x30343d, { roughness: 0.35, metalness: 0.25 });
  const hydroMat = std(0xf1f5f9, { roughness: 0.3 });
  const bondMat = std(0x9aa3b2, { roughness: 0.35, metalness: 0.6 });

  const carbons: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * ringR, 0, Math.sin(a) * ringR);
    carbons.push(p);
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 32), carbonMat);
    c.position.copy(p);
    mol.add(c);
  }

  const bondBetween = (a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) => {
    const dir = b.clone().sub(a);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mol.add(m);
  };

  // C-C bonds (aromatic ring) + offset double-bond hints on alternating edges
  for (let i = 0; i < 6; i++) {
    const a = carbons[i];
    const b = carbons[(i + 1) % 6];
    bondBetween(a, b, 0.13, bondMat);
    if (i % 2 === 0) {
      const inward = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(-0.17);
      bondBetween(a.clone().add(inward), b.clone().add(inward), 0.09, bondMat);
    }
  }
  // C-H bonds
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const h = new THREE.Vector3(Math.cos(a) * (ringR + 0.95), 0, Math.sin(a) * (ringR + 0.95));
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 24), hydroMat);
    hm.position.copy(h);
    mol.add(hm);
    bondBetween(carbons[i], h, 0.1, bondMat);
  }

  mol.rotation.x = 0.5;
  g.add(mol);

  return {
    object: g,
    cameraPos: [0, 2.6, 6.8],
    lookAt: [0, 0, 0],
    tick: (t, dt) => {
      mol.rotation.y += dt * 0.4;
      mol.rotation.x = 0.5 + Math.sin(t * 0.4) * 0.12;
    },
  };
}

/* ---------------------------------- MATHEMATICS: torus knot ---------------------------------- */

function buildMathematics(): HeroModel {
  const g = new THREE.Group();

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.05, 0.3, 280, 40),
    new THREE.MeshPhysicalMaterial({
      color: 0x8b7cf6,
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
    }),
  );
  g.add(knot);

  // Faint orbital ring for composition
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.015, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }),
  );
  orbit.rotation.x = Math.PI / 2 - 0.25;
  g.add(orbit);

  return {
    object: g,
    cameraPos: [0, 0.8, 6.2],
    lookAt: [0, 0, 0],
    tick: (t, dt) => {
      knot.rotation.y += dt * 0.35;
      knot.rotation.x = 0.45 + Math.sin(t * 0.35) * 0.12;
    },
  };
}

/* ---------------------------------- ENGINEERING: interlocking gears ---------------------------------- */

function gearGeometry(teeth: number, outerR: number, innerR: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const toothAngle = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * toothAngle;
    const pts: [number, number][] = [
      [innerR, a],
      [outerR, a + toothAngle * 0.18],
      [outerR, a + toothAngle * 0.42],
      [innerR, a + toothAngle * 0.6],
    ];
    for (const [r, ang] of pts) {
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0 && r === innerR && ang === a) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, outerR * 0.22, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geo.center();
  return geo;
}

function buildEngineering(): HeroModel {
  const g = new THREE.Group();

  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 1.0, roughness: 0.32 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa3b2, metalness: 1.0, roughness: 0.28 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x5b6472, metalness: 1.0, roughness: 0.35 });

  // teeth counts drive the meshing speed ratios
  const g1 = new THREE.Mesh(gearGeometry(14, 1.25, 1.08, 0.4), brass);
  g1.position.set(-1.5, 0.45, 0);
  const g2 = new THREE.Mesh(gearGeometry(10, 0.92, 0.78, 0.4), steel);
  // place g2 meshed with g1: distance ≈ pitchR1 + pitchR2
  g2.position.set(0.62, -0.62, 0);
  const g3 = new THREE.Mesh(gearGeometry(9, 0.8, 0.67, 0.4), darkSteel);
  g3.position.set(1.72, 0.85, 0);

  // Axle pins
  const pinGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 16);
  const pinMat = std(0x3a3f47, { roughness: 0.4, metalness: 0.8 });
  for (const gear of [g1, g2, g3]) {
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.rotation.x = Math.PI / 2;
    gear.add(pin);
    g.add(gear);
  }

  const w1 = 0.55;
  return {
    object: g,
    cameraPos: [0, 0.6, 7.2],
    lookAt: [0.1, 0.1, 0],
    tick: (_t, dt) => {
      g1.rotation.z += w1 * dt;
      g2.rotation.z -= w1 * (14 / 10) * dt;
      g3.rotation.z += w1 * (14 / 9) * dt;
    },
  };
}

/* ---------------------------------- MBBS: beating heart ---------------------------------- */

function buildMbbs(): HeroModel {
  const g = new THREE.Group();
  const heart = new THREE.Group();

  const flesh = new THREE.MeshPhysicalMaterial({
    color: 0xb3242c,
    roughness: 0.32,
    metalness: 0.05,
    clearcoat: 0.85,
    clearcoatRoughness: 0.28,
  });
  const vesselMat = new THREE.MeshPhysicalMaterial({
    color: 0x8f1d24,
    roughness: 0.38,
    metalness: 0.05,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
  });

  // Main mass: sphere sculpted into a heart-ish form (pointed apex at bottom)
  const bodyGeo = new THREE.SphereGeometry(1, 48, 48);
  const pos = bodyGeo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ny = v.y; // -1..1
    // taper toward the apex (bottom point)
    if (ny < 0.1) {
      const k = THREE.MathUtils.smoothstep(-ny + 0.1, 0, 1.1);
      const s = 1 - 0.52 * k;
      v.x *= s;
      v.z *= s;
      v.y -= 0.18 * k; // elongate the point
    }
    // slight cleft at the top
    if (ny > 0.55) {
      const d = Math.hypot(v.x, v.z);
      if (d < 0.45) v.y -= 0.22 * (1 - d / 0.45);
    }
    // subtle organic asymmetry
    v.x += 0.06 * Math.sin(v.y * 3.1);
    pos.setXYZ(i, v.x, v.y * 1.12, v.z * 0.92);
  }
  bodyGeo.computeVertexNormals();
  heart.add(new THREE.Mesh(bodyGeo, flesh));

  // Aorta arch
  const aorta = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.17, 18, 32, Math.PI * 1.25), vesselMat);
  aorta.position.set(-0.12, 1.05, 0);
  aorta.rotation.set(0.2, 0.4, -0.5);
  heart.add(aorta);
  // Pulmonary trunk
  const pulm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.85, 18), vesselMat);
  pulm.position.set(0.42, 0.95, 0.1);
  pulm.rotation.z = -0.5;
  heart.add(pulm);
  // Vena cava
  const vena = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 18), vesselMat);
  vena.position.set(0.05, 1.15, -0.28);
  vena.rotation.x = 0.25;
  heart.add(vena);

  heart.rotation.y = -0.35;
  g.add(heart);

  return {
    object: g,
    cameraPos: [0, 0.5, 6.4],
    lookAt: [0, 0.15, 0],
    tick: (t, dt) => {
      // heartbeat: sharp lub-dub pulse
      const beat = Math.pow(Math.max(0, Math.sin(t * 4.6)), 6);
      const s = 1 + 0.075 * beat;
      heart.scale.set(s, s, s);
      heart.rotation.y = -0.35 + Math.sin(t * 0.5) * 0.12;
      heart.position.y = Math.sin(t * 4.6) * 0.02;
      void dt;
    },
  };
}

/* ---------------------------------- DENTAL: molar tooth ---------------------------------- */

function buildDental(): HeroModel {
  const g = new THREE.Group();
  const tooth = new THREE.Group();

  const enamel = new THREE.MeshPhysicalMaterial({
    color: 0xf7f5ef,
    roughness: 0.16,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.12,
  });

  // Crown
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.68, 0.72, 28), enamel);
  crown.position.y = 0.36;
  tooth.add(crown);

  // Cusps (4 bumps on the chewing surface)
  const cuspGeo = new THREE.SphereGeometry(0.3, 20, 20);
  const cuspOffsets: Vec3[] = [
    [-0.36, 0.72, -0.36],
    [0.36, 0.72, -0.36],
    [-0.36, 0.72, 0.36],
    [0.36, 0.72, 0.36],
  ];
  for (const [x, y, z] of cuspOffsets) {
    const cusp = new THREE.Mesh(cuspGeo, enamel);
    cusp.position.set(x, y, z);
    cusp.scale.set(1, 0.72, 1);
    tooth.add(cusp);
  }
  // Chewing-surface cap to blend cusps
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.82, 0.22, 28), enamel);
  cap.position.y = 0.66;
  tooth.add(cap);

  // Roots — 3 tapered roots angled outward
  const rootGeo = new THREE.CylinderGeometry(0.09, 0.3, 1.25, 16);
  const roots: { p: Vec3; r: Vec3 }[] = [
    { p: [-0.34, -0.55, -0.2], r: [0.12, 0, 0.28] },
    { p: [0.34, -0.55, -0.2], r: [0.12, 0, -0.28] },
    { p: [0, -0.55, 0.34], r: [-0.3, 0, 0] },
  ];
  for (const { p, r } of roots) {
    const root = new THREE.Mesh(rootGeo, enamel);
    root.position.set(...p);
    root.rotation.set(...(r as Vec3));
    tooth.add(root);
  }

  tooth.rotation.y = 0.5;
  g.add(tooth);

  return {
    object: g,
    cameraPos: [0, 0.9, 6.4],
    lookAt: [0, 0.1, 0],
    tick: (_t, dt) => {
      tooth.rotation.y += dt * 0.45;
    },
  };
}

/* ---------------------------------- registry ---------------------------------- */

const builders: Record<string, () => HeroModel> = {
  physics: buildPhysics,
  biology: buildBiology,
  chemistry: buildChemistry,
  mathematics: buildMathematics,
  engineering: buildEngineering,
  mbbs: buildMbbs,
  dental: buildDental,
};

export function buildModel(slug: string): HeroModel {
  const b = builders[slug] ?? builders.physics;
  return b();
}
