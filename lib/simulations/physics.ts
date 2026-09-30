// lib/simulations/physics.ts
// Pure physics helpers for the interactive 3D simulations.
// IMPORTANT: no three.js / DOM imports here — this module must stay
// importable from server components and plain node scripts.

export interface TrajectoryPoint {
  x: number; // metres, horizontal distance from launch
  y: number; // metres, height above launch level
}

export interface ProjectileResult {
  range: number; // metres
  maxHeight: number; // metres
  timeOfFlight: number; // seconds
  points: TrajectoryPoint[]; // sampled trajectory, launch → landing
}

/**
 * Ideal projectile motion (no air resistance), launched from ground level.
 * range = v²·sin(2θ)/g, maxHeight = (v·sinθ)²/(2g), timeOfFlight = 2·v·sinθ/g
 */
export function projectile(
  v: number,
  angleDeg: number,
  g = 9.81
): ProjectileResult {
  const theta = (angleDeg * Math.PI) / 180;
  const vx = v * Math.cos(theta);
  const vy = v * Math.sin(theta);
  const timeOfFlight = (2 * vy) / g;
  const range = vx * timeOfFlight;
  const maxHeight = (vy * vy) / (2 * g);
  const N = 64;
  const points: TrajectoryPoint[] = [];
  for (let i = 0; i <= N; i++) {
    const t = (timeOfFlight * i) / N;
    points.push({ x: vx * t, y: vy * t - 0.5 * g * t * t });
  }
  return { range, maxHeight, timeOfFlight, points };
}

/** Small-angle simple-pendulum period: T = 2π·√(L/g). */
export function pendulumPeriod(L: number, g = 9.81): number {
  return 2 * Math.PI * Math.sqrt(L / g);
}

/**
 * Small-angle pendulum displacement θ(t) = θ0·cos(ωt), ω = √(g/L).
 * θ0 and the result are in radians, measured from the straight-DOWN rest
 * position — so the bob always hangs below the pivot and never inverts.
 * θ(0) = θ0 and the motion is symmetric about 0.
 */
export function pendulumAngle(
  t: number,
  L: number,
  theta0: number,
  g = 9.81
): number {
  const omega = Math.sqrt(g / L);
  return theta0 * Math.cos(omega * t);
}

/**
 * Transverse wave displacement at position x and time t:
 * y(x,t) = amp·sin(2π·(freq·t − x))  (unit wavelength, speed = freq units/s)
 */
export function wavePoint(
  x: number,
  t: number,
  amp: number,
  freq: number
): number {
  return amp * Math.sin(2 * Math.PI * (freq * t - x));
}
