// lib/topic-content.ts
// Concise, topically-correct accordion content for topic pages.
// Flagship sim topics get full worked content; everything else gets an
// honest placeholder bundle (real AI-written content arrives in a later phase).
// No lorem ipsum anywhere.

import type { SimKey } from "./simulations/registry";

export interface QuizItem {
  q: string;
  a: string;
}

export interface TopicContent {
  example: string;
  theory: string;
  equations: string[];
  quiz: QuizItem[];
}

const CONTENT: Record<SimKey, TopicContent> = {
  projectile: {
    example:
      "A ball is kicked at 20 m/s at 45° to the horizontal (g = 9.81 m/s²). " +
      "Horizontal component: 20·cos45° ≈ 14.14 m/s; vertical: 20·sin45° ≈ 14.14 m/s. " +
      "Time of flight = 2×14.14/9.81 ≈ 2.88 s. " +
      "Range = 14.14×2.88 ≈ 40.8 m. " +
      "Maximum height = 14.14²/(2×9.81) ≈ 10.2 m. " +
      "45° gives the maximum range for a given speed — try other angles in the simulator above.",
    theory:
      "Projectile motion is motion under gravity alone once an object is launched: horizontal velocity stays " +
      "constant (no air resistance) while vertical velocity changes by −g every second. The two motions are " +
      "independent, which is why the path is a parabola. Launching at complementary angles (e.g. 30° and 60°) " +
      "gives the same range, and 45° gives the maximum range on level ground.",
    equations: [
      "x = v·cosθ · t   (horizontal distance)",
      "y = v·sinθ · t − ½·g·t²   (height)",
      "Time of flight T = 2·v·sinθ / g",
      "Range R = v²·sin2θ / g",
      "Max height H = v²·sin²θ / (2g)",
    ],
    quiz: [
      { q: "At what launch angle is the range maximum on level ground?", a: "45° — because R = v²·sin2θ/g and sin2θ peaks at 1 when 2θ = 90°." },
      { q: "A projectile is launched at 30° and another at 60° with the same speed. Which goes further?", a: "Neither — they land at the same range, since sin(2×30°) = sin(2×60°) = sin60°." },
      { q: "What is the shape of a projectile's path, and why?", a: "A parabola — x grows linearly with time while y has a t² term, so eliminating t gives y as a quadratic in x." },
      { q: "How does doubling the launch speed change the range?", a: "It quadruples it — range is proportional to v²." },
    ],
  },
  pendulum: {
    example:
      "A simple pendulum has a string 1.0 m long (g = 9.81 m/s²). " +
      "Period T = 2π·√(1.0/9.81) ≈ 2.01 s. " +
      "Shorten the string to 0.25 m and T = 2π·√(0.25/9.81) ≈ 1.00 s — " +
      "quartering the length halves the period. " +
      "Releasing from 20° or 40° barely changes T (small-angle approximation).",
    theory:
      "A simple pendulum swings with simple harmonic motion for small angles: the restoring torque is " +
      "proportional to the angular displacement. Remarkably, the period depends only on the string length " +
      "and gravity — not on the bob's mass or (for small swings) the amplitude. This isochronism is why " +
      "pendulums were used in the first accurate clocks, and measuring T lets you determine g.",
    equations: [
      "Period T = 2π·√(L/g)",
      "Angular frequency ω = √(g/L)",
      "θ(t) = θ₀·cos(ωt)   (small angles, θ from the downward vertical)",
      "Frequency f = 1/T = (1/2π)·√(g/L)",
    ],
    quiz: [
      { q: "What happens to the period if the string length is doubled?", a: "It increases by √2 (≈1.41×), because T ∝ √L." },
      { q: "Does a heavier bob swing faster?", a: "No — mass cancels out; the period depends only on L and g." },
      { q: "Why does the pendulum hang straight down at rest?", a: "That is the equilibrium position where gravity's torque about the pivot is zero; any displacement creates a restoring torque toward it." },
      { q: "How can a pendulum measure g?", a: "Measure T for a known L, then g = 4π²L/T²." },
    ],
  },
  solar: {
    example:
      "Earth orbits the Sun at ~1.5×10¹¹ m with a period of 1 year. " +
      "Kepler's third law (T² ∝ r³) predicts Mars's period: Mars is 1.52 AU out, " +
      "so T = √(1.52³) ≈ 1.88 Earth years — matching the observed 687 days. " +
      "Neptune, at 30 AU, takes √(30³) ≈ 165 years per orbit.",
    theory:
      "The solar system formed from a collapsing cloud of gas and dust; conservation of angular momentum " +
      "flattened it into a disc in which the planets orbit the Sun in the same direction. The Sun holds " +
      "99.8% of the system's mass, so its gravity dictates every orbit. The four inner planets are small and " +
      "rocky; the four outer planets are gas and ice giants. Earth's Moon stabilizes our tilt and drives tides.",
    equations: [
      "Kepler's 3rd law: T² = (4π²/GM)·r³",
      "Newton's gravity: F = G·m₁·m₂ / r²",
      "Orbital speed (circular): v = √(GM/r)",
      "1 AU ≈ 1.496×10¹¹ m (Earth–Sun distance)",
    ],
    quiz: [
      { q: "Which planet has the shortest year, and why?", a: "Mercury — it orbits closest to the Sun, so its orbital speed is highest and its path shortest." },
      { q: "Why does Saturn have rings but Earth doesn't?", a: "Saturn's rings are debris orbiting inside its Roche limit, where tidal forces prevent the material from clumping into a moon. Earth has no such dense ring system." },
      { q: "What keeps the planets in orbit instead of flying off?", a: "The Sun's gravity provides the centripetal force that continuously bends their paths into (near-)ellipses." },
      { q: "How long is a year on Jupiter?", a: "About 11.9 Earth years — from T² ∝ r³ with r ≈ 5.2 AU, T ≈ √(5.2³) ≈ 11.9." },
    ],
  },
  incline: {
    example:
      "A 2 kg block slides down a frictionless 30° ramp (g = 9.81 m/s²). " +
      "Acceleration along the ramp: a = g·sin30° = 9.81×0.5 ≈ 4.9 m/s² — " +
      "independent of the mass. " +
      "After sliding 4 m: v² = 2·a·s = 2×4.9×4 → v ≈ 6.3 m/s, " +
      "the same speed as falling vertically through 4·sin30° = 2 m.",
    theory:
      "On an incline, gravity splits into two components: g·sinθ pulls the object along the slope while " +
      "g·cosθ presses it into the surface (balanced by the normal reaction). With friction, the opposing " +
      "force is μ·N = μ·m·g·cosθ, so the block accelerates only if tanθ > μ. Steeper ramps accelerate " +
      "faster but shorten the drop per metre travelled — energy conservation ties it all together.",
    equations: [
      "Acceleration (frictionless): a = g·sinθ",
      "With friction: a = g·(sinθ − μ·cosθ)",
      "Normal reaction: N = m·g·cosθ",
      "Slips only if tanθ > μ (limiting friction)",
      "Speed after distance s: v² = u² + 2·a·s",
    ],
    quiz: [
      { q: "A block slides down a 30° frictionless ramp. What is its acceleration?", a: "g·sin30° ≈ 4.9 m/s²." },
      { q: "Why doesn't the block's mass affect its sliding acceleration?", a: "Both the driving force (m·g·sinθ) and inertia scale with mass, so m cancels in a = F/m." },
      { q: "At what angle does a block with μ = 0.5 begin to slip?", a: "When tanθ = μ, so θ = arctan(0.5) ≈ 26.6°." },
      { q: "Is the final speed after sliding down the same for any ramp angle (no friction)?", a: "Yes — it depends only on the vertical drop: v = √(2gh), by energy conservation." },
    ],
  },
  wave: {
    example:
      "A wave has amplitude 0.5 m and frequency 2 Hz. " +
      "Its displacement is y = 0.5·sin(2π(2t − x)) metres. " +
      "At t = 0, x = 0.125 m: y = 0.5·sin(−π/4) ≈ −0.35 m. " +
      "One full oscillation takes T = 1/f = 0.5 s, and the pattern " +
      "repeats every 1 m of x (the wavelength in these units).",
    theory:
      "A transverse wave carries energy through a medium without carrying the medium itself — each particle " +
      "oscillates perpendicular to the direction the wave travels (think of a shaken rope). Amplitude sets " +
      "how far particles swing (and the energy carried ∝ amplitude²); frequency sets how many oscillations " +
      "pass per second. The wave equation y = A·sin(2π(ft − x/λ)) captures the whole motion in one line.",
    equations: [
      "y(x,t) = A·sin(2π(ft − x/λ))",
      "Wave speed v = f·λ",
      "Period T = 1/f",
      "Energy carried ∝ A²",
    ],
    quiz: [
      { q: "What is the difference between a transverse and a longitudinal wave?", a: "In a transverse wave particles oscillate perpendicular to the travel direction (rope wave, light); in a longitudinal wave they oscillate parallel to it (sound)." },
      { q: "If the frequency doubles but the speed stays the same, what happens to the wavelength?", a: "It halves — λ = v/f." },
      { q: "Why does doubling the amplitude quadruple the wave's energy?", a: "Wave energy is proportional to the square of the amplitude (E ∝ A²)." },
      { q: "Does the medium itself travel with the wave?", a: "No — particles oscillate about fixed positions; only energy and the disturbance pattern travel." },
    ],
  },
  lens: {
    example:
      "A convex lens has focal length f = 10 cm. An object stands 30 cm away. " +
      "1/v = 1/f − 1/u = 1/10 − 1/30 = 2/30 → v = 15 cm. " +
      "The image forms 15 cm beyond the lens. " +
      "Magnification m = −v/u = −15/30 = −0.5: the image is real, inverted, and half the object's size. " +
      "Move the object inside f (say 5 cm) and the image becomes virtual, upright and magnified — a magnifying glass.",
    theory:
      "A convex lens is thicker at the centre, so parallel rays refract toward the principal axis and meet at " +
      "the focal point. Image formation follows the lens formula 1/f = 1/v + 1/u (with the sign convention " +
      "used here, all distances measured as positive magnitudes for a real image). Objects beyond 2f give " +
      "diminished real images; between f and 2f give magnified real images; inside f give virtual magnified images.",
    equations: [
      "Lens formula: 1/f = 1/v + 1/u",
      "Magnification m = −v/u = (image height)/(object height)",
      "Power P = 1/f (dioptres, f in metres)",
      "Two thin lenses in contact: 1/F = 1/f₁ + 1/f₂",
    ],
    quiz: [
      { q: "Where must the object be for a convex lens to act as a magnifying glass?", a: "Inside the focal length (u < f) — the image is then virtual, upright and enlarged." },
      { q: "An object is at 2f from a convex lens. Where is the image?", a: "Also at 2f on the other side, real, inverted, and the same size (m = −1)." },
      { q: "What does a negative magnification signify?", a: "The image is inverted relative to the object (real image case)." },
      { q: "How is the power of a lens related to its focal length?", a: "P = 1/f with f in metres — shorter focal length means greater converging power, in dioptres." },
    ],
  },
  atom: {
    example:
      "Hydrogen (Z = 1) has one electron in the n = 1 shell. " +
      "Bohr's model gives its energy levels Eₙ = −13.6/n² eV, so the ground state is −13.6 eV " +
      "and the first excited state is −3.4 eV. " +
      "Dropping from n = 2 to n = 1 emits a photon of 10.2 eV — the Lyman-alpha line. " +
      "Helium (Z = 2) fills the first shell with 2 electrons; lithium (Z = 3) starts the second shell.",
    theory:
      "Bohr's model pictures electrons circling the nucleus in fixed shells of quantized angular momentum " +
      "(mvr = n·h/2π), each shell holding at most 2n² electrons. It correctly predicts hydrogen's spectrum " +
      "but is superseded by quantum mechanics, where 'orbits' become probability clouds (orbitals). Still, " +
      "shells explain the periodic table: elements in the same column have the same outer-shell electron count.",
    equations: [
      "Bohr radius rₙ = n²·a₀  (a₀ ≈ 0.529 Å)",
      "Energy levels: Eₙ = −13.6·Z²/n² eV",
      "Photon emitted: ΔE = h·f = 13.6·Z²·(1/n₁² − 1/n₂²) eV",
      "Shell capacity: 2n² electrons",
    ],
    quiz: [
      { q: "How many electrons can the n = 2 shell hold?", a: "8 — capacity is 2n² = 2×4 = 8." },
      { q: "What photon is emitted when hydrogen's electron falls from n = 3 to n = 2?", a: "ΔE = 13.6×(1/4 − 1/9) ≈ 1.89 eV — the red H-alpha line of the Balmer series." },
      { q: "Why don't orbiting electrons spiral into the nucleus in Bohr's model?", a: "By postulate, electrons in allowed shells do not radiate; radiation happens only when jumping between shells." },
      { q: "Where does Bohr's model fail?", a: "Multi-electron atoms, fine spectral structure, and the true probabilistic nature of orbitals — quantum mechanics replaces circular orbits with wavefunctions." },
    ],
  },
  heart: {
    example:
      "At a resting rate of 72 bpm, each cardiac cycle lasts 60/72 ≈ 0.83 s. " +
      "In one day the heart beats about 72×60×24 ≈ 100,000 times, " +
      "pumping roughly 7,500 litres of blood — enough to fill a small tanker truck every week. " +
      "During exercise at 150 bpm the cycle shortens to 0.4 s, mostly by cutting the resting (diastole) phase.",
    theory:
      "The heart is a double pump: the right side sends deoxygenated blood to the lungs, the left side sends " +
      "oxygenated blood to the body. The left ventricle has the thickest wall because it works against the " +
      "highest pressure. The aorta — the body's largest artery — carries each stroke volume out to the " +
      "systemic circulation. One-way valves (mitral, aortic, tricuspid, pulmonary) keep blood flowing forward; " +
      "the 'lub-dub' sounds are these valves snapping shut.",
    equations: [
      "Cardiac output = heart rate × stroke volume",
      "Cycle duration = 60 / (heart rate in bpm) seconds",
      "Typical stroke volume ≈ 70 mL; resting output ≈ 5 L/min",
      "Blood pressure ≈ 120/80 mmHg (systolic/diastolic)",
    ],
    quiz: [
      { q: "Which chamber has the thickest muscular wall, and why?", a: "The left ventricle — it must generate enough pressure to push blood through the entire body." },
      { q: "What causes the 'lub-dub' heart sounds?", a: "'Lub' is the mitral and tricuspid valves closing at the start of systole; 'dub' is the aortic and pulmonary valves closing at the start of diastole." },
      { q: "What is the aorta?", a: "The largest artery in the body — it carries oxygenated blood from the left ventricle out to the systemic circulation." },
      { q: "How is cardiac output calculated?", a: "Cardiac output = heart rate × stroke volume (≈ 72 bpm × 70 mL ≈ 5 L/min at rest)." },
    ],
  },
  molecule: {
    example:
      "Water (H₂O) is bent: the two O–H bonds make an angle of 104.5°, not 180°, because oxygen's two lone " +
      "pairs squeeze the bonding pairs together (VSEPR theory). Methane (CH₄) is tetrahedral with 109.5° " +
      "between every pair of C–H bonds — the angle that keeps four electron pairs as far apart as possible. " +
      "Switch molecules in the viewer above and compare their shapes.",
    theory:
      "Molecular shape is decided by electron-pair repulsion: bonding pairs and lone pairs arrange themselves " +
      "to stay as far apart as possible. Two pairs give a linear shape (CO₂, 180°), three give trigonal planar " +
      "(120°), four give tetrahedral (109.5°), and lone pairs compress these ideal angles — which is why " +
      "ammonia (NH₃) is pyramidal at 107° and water is bent at 104.5°. Shape decides polarity, and polarity " +
      "decides properties like boiling point and solubility.",
    equations: [
      "VSEPR: 2 pairs → linear (180°)",
      "3 pairs → trigonal planar (120°)",
      "4 pairs → tetrahedral (109.5°)",
      "Lone pairs compress bond angles: NH₃ 107°, H₂O 104.5°",
    ],
    quiz: [
      { q: "Why is water bent instead of linear?", a: "Oxygen has two lone pairs which repel the two O–H bonding pairs, squeezing the H–O–H angle down to 104.5°." },
      { q: "What is the bond angle in methane, and why?", a: "109.5° — four bonding pairs arrange tetrahedrally to maximise their separation (VSEPR)." },
      { q: "How does molecular shape affect properties?", a: "Shape decides whether bond dipoles cancel (non-polar, e.g. CO₂) or add up (polar, e.g. H₂O) — polarity then governs boiling point, solubility and reactivity." },
      { q: "What does VSEPR stand for and what does it predict?", a: "Valence Shell Electron Pair Repulsion — it predicts molecular geometry from the number of electron pairs around the central atom." },
    ],
  },
  dna: {
    example:
      "One full turn of the DNA helix spans 10 base pairs and rises 3.4 nm, so each base pair adds 0.34 nm. " +
      "A human chromosome with 100 million base pairs would stretch about 3.4 cm if unwound — yet it packs " +
      "into a nucleus only micrometres wide, wound around histone proteins. A always pairs with T (2 hydrogen " +
      "bonds) and G with C (3 hydrogen bonds) — which is why the two strands are complementary.",
    theory:
      "DNA is a double helix of two antiparallel strands: each strand is a chain of nucleotides (sugar + " +
      "phosphate + base), and the strands are held together by hydrogen bonds between complementary bases — " +
      "adenine with thymine, guanine with cytosine. The sequence of bases encodes proteins in triplets " +
      "(codons). During replication the strands separate and each acts as a template, which is why " +
      "complementarity guarantees faithful copying.",
    equations: [
      "1 helical turn = 10 base pairs = 3.4 nm",
      "Rise per base pair = 0.34 nm",
      "A = T (2 H-bonds); G ≡ C (3 H-bonds)",
      "Chargaff's rule: [A] = [T], [G] = [C]",
    ],
    quiz: [
      { q: "Which bases pair together in DNA, and how many hydrogen bonds hold each pair?", a: "A–T with 2 hydrogen bonds; G–C with 3 hydrogen bonds." },
      { q: "Why is DNA replication so accurate?", a: "Each strand is a template: complementarity (A–T, G–C) forces the new strand to copy the sequence exactly." },
      { q: "What is a codon?", a: "A triplet of bases on mRNA that codes for one amino acid (e.g. AUG = methionine, the start codon)." },
      { q: "How long is one full turn of the helix?", a: "3.4 nm, containing exactly 10 base pairs." },
    ],
  },
  cell: {
    example:
      "A single glucose molecule processed by mitochondria yields about 30–32 ATP. The mitochondrion's folded " +
      "inner membrane (cristae) packs in the electron-transport chains that make this possible — more folds " +
      "mean more ATP per second, which is why muscle cells are packed with mitochondria. Select 'mitochondria' " +
      "in the viewer above to highlight them.",
    theory:
      "The cell is the basic unit of life. In animal cells the nucleus holds DNA and directs activity; the " +
      "nucleolus inside it builds ribosomal RNA. Mitochondria release energy from glucose as ATP (aerobic " +
      "respiration). Ribosomes assemble proteins from amino acids. The selectively permeable cell membrane " +
      "controls what enters and leaves, maintaining the internal conditions the organelles need.",
    equations: [
      "Aerobic respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~30–32 ATP",
      "Surface area ↑ (cristae folds) → ATP production rate ↑",
      "Diffusion rate ∝ concentration gradient × surface area",
    ],
    quiz: [
      { q: "Why are mitochondria called the powerhouse of the cell?", a: "They carry out aerobic respiration, converting glucose + oxygen into ~30–32 ATP per glucose — the cell's energy currency." },
      { q: "What does the nucleolus do?", a: "It synthesises ribosomal RNA (rRNA) and assembles ribosome subunits inside the nucleus." },
      { q: "How does the cell membrane control transport?", a: "It is selectively permeable: small non-polar molecules diffuse through, while ions and large molecules need protein channels, carriers or vesicles." },
      { q: "What is the function of ribosomes?", a: "They translate mRNA into protein, linking amino acids in the order the codons specify." },
    ],
  },
  circuit: {
    example:
      "A 6 V battery across a 10 Ω resistor drives I = V/R = 0.6 A. Double the voltage to 12 V and the current " +
      "doubles to 1.2 A — Ohm's law is linear. The power dissipated as heat is P = V·I = 7.2 W, which is why " +
      "the resistor in the simulator warms the idea up: raise the voltage slider and watch the electrons speed up.",
    theory:
      "Current is the rate of charge flow (I = Q/t, measured in amperes). In a metal, a voltage across the " +
      "conductor pushes free electrons into a slow drift — their collisions with ions are what we call " +
      "resistance. Ohm's law (V = IR) holds for ohmic conductors at constant temperature: double the voltage, " +
      "double the current. The battery's chemical energy becomes the electrons' kinetic energy, then heat and " +
      "light in the components.",
    equations: [
      "Ohm's law: V = I·R",
      "Current: I = Q / t",
      "Power: P = V·I = I²·R = V²/R",
      "Series: R_total = R₁ + R₂; Parallel: 1/R_total = 1/R₁ + 1/R₂",
    ],
    quiz: [
      { q: "State Ohm's law and the condition for it to hold.", a: "V = IR; it holds for ohmic conductors at constant temperature (linear V–I graph through the origin)." },
      { q: "A 12 V battery drives 2 A through a resistor. What is the resistance and power?", a: "R = V/I = 6 Ω; P = V·I = 24 W." },
      { q: "Why do electrons drift slowly even though the signal travels near light speed?", a: "The electric field propagates fast, but each electron only drifts mm/s, constantly colliding with ions — those collisions are resistance." },
      { q: "How does adding resistors in series change the current?", a: "Total resistance rises (R₁+R₂), so for the same voltage the current falls: I = V/(R₁+R₂)." },
    ],
  },
};

const GENERIC: TopicContent = {
  example:
    "A fully worked example for this topic is being prepared. Start with the key idea above, " +
    "then test yourself with the quiz below — being able to explain the concept in your own words " +
    "is the best check that you understand it.",
  theory:
    "Detailed theory notes for this topic are on the way. For now: identify the 2–3 core definitions, " +
    "learn the governing equation and what each symbol means, and connect the idea to one real-world " +
    "situation — that trio covers most exam questions on any topic.",
  equations: ["Key equations for this topic are being compiled — check back soon."],
  quiz: [
    {
      q: "Can you state the core definition of this topic in one sentence?",
      a: "If you can, you've captured the essential idea — definitions anchor every derivation and numerical that follows.",
    },
    {
      q: "What is the single most important formula here, and what does each symbol mean?",
      a: "Naming each symbol's meaning (with units) turns a memorized formula into a usable tool.",
    },
  ],
};

export function getTopicContent(sim: SimKey | null): TopicContent {
  return sim ? CONTENT[sim] : GENERIC;
}
