// lib/simulations/textures.ts
// Procedural canvas textures for the 3D sims — every mesh gets a real
// material, never a flat untextured color.
// CLIENT-ONLY: touches `document`; call only from client components.

import * as THREE from "three";

/** Deterministic PRNG so textures look the same on every render. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return [c, ctx];
}

function toTexture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function blob(
  ctx: CanvasRenderingContext2D,
  rnd: () => number,
  w: number,
  h: number,
  color: string,
  n: number,
  rMin: number,
  rMax: number
) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const r = rMin + rnd() * (rMax - rMin);
    const x = rnd() * w;
    const y = rnd() * h;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.5 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Cricket/tennis ball: yellow-green felt with two stitched seam curves. */
export function makeBallTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 128);
  ctx.fillStyle = "#d9c93f";
  ctx.fillRect(0, 0, 256, 128);
  // felt noise
  const rnd = mulberry32(7);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + rnd() * 0.05})`;
    ctx.fillRect(rnd() * 256, rnd() * 128, 1.5, 1.5);
  }
  // two opposing curved seams (stitched white dashes)
  ctx.strokeStyle = "#f8f6ee";
  ctx.lineWidth = 5;
  ctx.setLineDash([7, 5]);
  for (const off of [0, 128]) {
    ctx.beginPath();
    ctx.moveTo(-10, off + 64);
    ctx.bezierCurveTo(60, off - 30, 150, off + 160, 266, off + 64);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  return toTexture(c);
}

export interface PlanetTextureSet {
  earth: THREE.CanvasTexture;
  mars: THREE.CanvasTexture;
  jupiter: THREE.CanvasTexture;
  saturn: THREE.CanvasTexture;
  venus: THREE.CanvasTexture;
  mercury: THREE.CanvasTexture;
  uranus: THREE.CanvasTexture;
  neptune: THREE.CanvasTexture;
}

/** Distinct procedural surface for each planet. */
export function makePlanetTextures(): PlanetTextureSet {
  const W = 256;
  const H = 128;
  const rnd = mulberry32(42);

  const base = (color: string) => {
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    return { c, ctx };
  };

  const finish = (c: HTMLCanvasElement) => toTexture(c);

  // Earth: oceans, continents, polar caps, clouds
  const earth = (() => {
    const { c, ctx } = base("#1b5fa8");
    blob(ctx, rnd, W, H, "#3f8f3a", 14, 12, 30);
    blob(ctx, rnd, W, H, "#8a7a4a", 6, 8, 18);
    ctx.fillStyle = "#eef6ff";
    ctx.fillRect(0, 0, W, 10);
    ctx.fillRect(0, H - 10, W, 10);
    blob(ctx, rnd, W, H, "rgba(255,255,255,0.75)", 22, 8, 20);
    return finish(c);
  })();

  // Mars: rusty surface, dark patches, white north cap
  const mars = (() => {
    const { c, ctx } = base("#b5533c");
    blob(ctx, rnd, W, H, "#8f3a26", 16, 8, 24);
    blob(ctx, rnd, W, H, "#d98a63", 10, 6, 16);
    ctx.fillStyle = "#f4ede4";
    ctx.fillRect(0, 0, W, 8);
    return finish(c);
  })();

  const bands = (colors: string[]) => {
    const { c, ctx } = base(colors[0]);
    const bandH = H / colors.length;
    colors.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(0, i * bandH, W, bandH + 1);
    });
    // wavy turbulence between bands
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const y = rnd() * H;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        ctx.lineTo(x, y + Math.sin(x / 24 + i) * 4);
      }
      ctx.stroke();
    }
    return { c, ctx };
  };

  // Jupiter: gas-giant bands + Great Red Spot
  const jupiter = (() => {
    const { c, ctx } = bands([
      "#d8b48f",
      "#b57e52",
      "#e8d3ae",
      "#c49a6c",
      "#a06a42",
      "#e0c298",
    ]);
    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    ctx.ellipse(W * 0.68, H * 0.62, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e07a5f";
    ctx.beginPath();
    ctx.ellipse(W * 0.68, H * 0.62, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    return finish(c);
  })();

  // Saturn: pale golden bands
  const saturn = (() => {
    const { c } = bands([
      "#e3cfa3",
      "#d9bd8a",
      "#efe0bd",
      "#cbb07e",
      "#e8d5ab",
      "#d3b983",
    ]);
    return finish(c);
  })();

  // Venus: creamy sulphuric swirls
  const venus = (() => {
    const { c, ctx } = base("#d9b98c");
    ctx.strokeStyle = "rgba(255,244,220,0.5)";
    ctx.lineWidth = 9;
    for (let i = 0; i < 10; i++) {
      const y = rnd() * H;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 10) {
        ctx.lineTo(x, y + Math.sin(x / 40 + i * 2) * 10);
      }
      ctx.stroke();
    }
    return finish(c);
  })();

  // Mercury: grey, cratered
  const mercury = (() => {
    const { c, ctx } = base("#9a938a");
    for (let i = 0; i < 40; i++) {
      const r = 2 + rnd() * 7;
      ctx.fillStyle = "rgba(70,66,60,0.55)";
      ctx.beginPath();
      ctx.arc(rnd() * W, rnd() * H, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(200,195,185,0.35)";
      ctx.beginPath();
      ctx.arc(rnd() * W, rnd() * H, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    return finish(c);
  })();

  // Uranus: pale cyan, almost featureless
  const uranus = (() => {
    const { c, ctx } = base("#9fd8dd");
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(0, H * 0.3, W, H * 0.12);
    return finish(c);
  })();

  // Neptune: deep blue with light streaks
  const neptune = (() => {
    const { c, ctx } = base("#2b4fd8");
    blob(ctx, rnd, W, H, "#1c3596", 12, 10, 26);
    ctx.fillStyle = "rgba(230,240,255,0.8)";
    ctx.fillRect(W * 0.3, H * 0.55, W * 0.25, 5);
    ctx.fillRect(W * 0.55, H * 0.7, W * 0.18, 4);
    return finish(c);
  })();

  return { earth, mars, jupiter, saturn, venus, mercury, uranus, neptune };
}

/** Brushed metal — for the pendulum bob, cannon barrel, etc. */
export function makeMetalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, "#8a8f98");
  grad.addColorStop(0.5, "#c9ced6");
  grad.addColorStop(1, "#7c818a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const rnd = mulberry32(11);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 90; i++) {
    const y = rnd() * 128;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y + (rnd() - 0.5) * 4);
    ctx.stroke();
  }
  return toTexture(c);
}

/** Wood grain — for the incline ramp and sliding block. */
export function makeWoodTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 128);
  ctx.fillStyle = "#a06a35";
  ctx.fillRect(0, 0, 256, 128);
  const rnd = mulberry32(23);
  for (let i = 0; i < 26; i++) {
    const y = rnd() * 128;
    ctx.strokeStyle = `rgba(70,40,15,${0.25 + rnd() * 0.35})`;
    ctx.lineWidth = 1 + rnd() * 2.5;
    ctx.beginPath();
    for (let x = 0; x <= 256; x += 8) {
      ctx.lineTo(x, y + Math.sin(x / 30 + i) * 4);
    }
    ctx.stroke();
  }
  // a few knots
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = "rgba(60,35,12,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(rnd() * 256, rnd() * 128, 6 + rnd() * 5, 3 + rnd() * 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  return toTexture(c);
}

/** Soft radial glow sprite — sun glow, focal-point halo, etc. */
export function makeGlowTexture(inner = "#ffd76a", outer = "rgba(255,150,0,0)"): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = toTexture(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
