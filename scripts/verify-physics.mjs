// scripts/verify-physics.mjs
// Plain-node verification of lib/simulations/physics.ts.
// The math below is a verbatim mirror of the TS source (no TS imports,
// so this runs with plain `node`). Keep the two in sync by hand.

function projectile(v, angleDeg, g = 9.81) {
  const theta = (angleDeg * Math.PI) / 180;
  const vx = v * Math.cos(theta);
  const vy = v * Math.sin(theta);
  const timeOfFlight = (2 * vy) / g;
  const range = vx * timeOfFlight;
  const maxHeight = (vy * vy) / (2 * g);
  const N = 64;
  const points = [];
  for (let i = 0; i <= N; i++) {
    const t = (timeOfFlight * i) / N;
    points.push({ x: vx * t, y: vy * t - 0.5 * g * t * t });
  }
  return { range, maxHeight, timeOfFlight, points };
}

function pendulumPeriod(L, g = 9.81) {
  return 2 * Math.PI * Math.sqrt(L / g);
}

function pendulumAngle(t, L, theta0, g = 9.81) {
  const omega = Math.sqrt(g / L);
  return theta0 * Math.cos(omega * t);
}

function wavePoint(x, t, amp, freq) {
  return amp * Math.sin(2 * Math.PI * (freq * t - x));
}

let failures = 0;
function check(name, actual, expected, tol) {
  const ok = Math.abs(actual - expected) <= tol;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}: got ${actual.toFixed(5)}, expected ${expected} ± ${tol}`
  );
  if (!ok) failures += 1;
}

// 1. Projectile: v=20 m/s, θ=45° → range ≈ 40.77 m, maxHeight ≈ 10.19 m
const p = projectile(20, 45);
console.log(
  `projectile(20, 45°): range=${p.range.toFixed(5)} m, maxHeight=${p.maxHeight.toFixed(5)} m, timeOfFlight=${p.timeOfFlight.toFixed(5)} s, points=${p.points.length}`
);
check("projectile range", p.range, 40.77, 0.05);
check("projectile maxHeight", p.maxHeight, 10.19, 0.05);
check("projectile starts at origin", p.points[0].x, 0, 1e-9);
check("projectile starts at origin (y)", p.points[0].y, 0, 1e-9);
check(
  "projectile lands at range",
  p.points[p.points.length - 1].x,
  p.range,
  1e-9
);
check("projectile lands on ground", p.points[p.points.length - 1].y, 0, 1e-6);
const mid = p.points[Math.floor(p.points.length / 2)];
check("projectile apex ≈ maxHeight", mid.y, p.maxHeight, 0.05);

// 2. Pendulum: L=1 m → period ≈ 2.007 s
const T = pendulumPeriod(1);
console.log(`pendulumPeriod(1 m) = ${T.toFixed(5)} s`);
check("pendulum period", T, 2.007, 0.005);

// 3. Pendulum angle: θ(0)=θ0, oscillates symmetrically about 0 (hangs DOWN)
const theta0 = (25 * Math.PI) / 180;
check("pendulumAngle(0) = theta0", pendulumAngle(0, 1, theta0), theta0, 1e-12);
const a1 = pendulumAngle(T / 4, 1, theta0);
check("pendulum crosses zero at T/4", a1, 0, 1e-3);
check(
  "pendulum symmetric: θ(t) = θ(−t)",
  pendulumAngle(0.37, 1, theta0),
  pendulumAngle(-0.37, 1, theta0),
  1e-12
);
let maxAbs = 0;
for (let i = 0; i <= 200; i++) {
  const a = Math.abs(pendulumAngle((T * i) / 200, 1, theta0));
  if (a > maxAbs) maxAbs = a;
}
check("pendulum never exceeds |theta0| (never inverted)", maxAbs, theta0, 1e-9);

// 4. Wave: zero at origin, symmetric crest/trough
check("wavePoint(0,0) = 0", wavePoint(0, 0, 0.5, 1), 0, 1e-12);
check("wave crest = +amp", wavePoint(-0.25, 0, 0.5, 1), 0.5, 1e-9);
check("wave trough = −amp", wavePoint(0.25, 0, 0.5, 1), -0.5, 1e-9);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log("\nAll physics checks passed.");
process.exit(0);
