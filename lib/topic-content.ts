// lib/topic-content.ts
// Concise, topically-correct accordion content for topic pages.
// Flagship sim topics get full worked content; everything else gets an
// honest placeholder bundle (real AI-written content arrives in a later phase).
// No lorem ipsum anywhere.

import type { SimKey } from "./simulations/registry";
import { prisma } from "./db";

export interface QuizItem {
  q: string;
  a: string;
}

export interface TopicContent {
  example: string;
  theory: string;
  equations: string[];
  quiz: QuizItem[];
  // Hindi versions (when available from DB)
  exampleHi?: string;
  theoryHi?: string;
  equationsHi?: string[];
  quizHi?: QuizItem[];
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
  dental: {
    example:
      "A molar's crown is covered by enamel ~2.5 mm thick at the cusps — the hardest substance in the body. " +
      "Beneath it lies dentin (softer, yellowish), and at the core the pulp with nerves and blood vessels. " +
      "A cavity that stays in enamel can be filled simply; once it reaches the pulp, a root canal is needed. " +
      "Drag the explode slider to peel the layers apart.",
    theory:
      "A tooth has a crown (above the gum) and roots (anchored in the jawbone). Enamel protects the crown, " +
      "dentin forms the bulk, pulp keeps the tooth alive, and cementum covers the roots. Implants replace the " +
      "whole tooth with a titanium screw fused to bone; braces move teeth by sustained gentle pressure; " +
      "dentures replace full arches when teeth are lost.",
    equations: [
      "Enamel ≈ 96% hydroxyapatite mineral (hardest body tissue)",
      "Dentin ≈ 70% mineral — softer, supports enamel",
      "Pulp = nerves + blood vessels (tooth's living core)",
      "Implant osseointegration: titanium fuses directly with bone",
    ],
    quiz: [
      { q: "Name the three layers of a tooth from outside in.", a: "Enamel → dentin → pulp." },
      { q: "Why does a deep cavity need a root canal instead of a simple filling?", a: "Because decay has reached the pulp — the filling must remove the infected nerve tissue, not just the hole." },
      { q: "What makes a dental implant stay fixed in the jaw?", a: "Osseointegration — bone cells grow onto the titanium screw surface, locking it in place." },
    ],
  },
  thermo: {
    example:
      "1 mol of gas at 300 K in a 24.6 L cylinder: P = nRT/V = (1×8.314×300)/0.0246 ≈ 101 kPa. " +
      "Heat it to 600 K at fixed volume and the pressure doubles to ≈ 202 kPa — the molecules hit the " +
      "walls twice as hard. Push the temperature slider and watch the particles speed up and redden.",
    theory:
      "Temperature measures the average kinetic energy of molecules (½m⟨v²⟩ = 3kT/2). Heating a gas makes " +
      "molecules move faster, raising pressure at fixed volume. The first law (ΔU = Q − W) tracks energy: " +
      "heat in minus work done by the gas. No heat engine beats the Carnot limit.",
    equations: [
      "Ideal gas law: P·V = n·R·T",
      "First law: ΔU = Q − W",
      "Carnot efficiency: η = 1 − Tc/Th",
      "Mean molecular KE: ⟨KE⟩ = 3kT/2",
    ],
    quiz: [
      { q: "A gas is heated from 300 K to 600 K at constant volume. What happens to its pressure?", a: "It doubles — P ∝ T at fixed V (Gay-Lussac's law)." },
      { q: "State the first law of thermodynamics.", a: "ΔU = Q − W: the change in internal energy equals heat added minus work done by the system." },
      { q: "Why can no engine be 100% efficient?", a: "The Carnot limit η = 1 − Tc/Th is always below 1 since Tc > 0 — some heat must be rejected." },
    ],
  },
  fluid: {
    example:
      "Water flows at 2 m/s through a 10 cm pipe that narrows to 5 cm. By continuity (A₁v₁ = A₂v₂), " +
      "halving the diameter quarters the area, so the throat speed is 2×4 = 8 m/s. Bernoulli then says " +
      "pressure drops at the throat — the manometer column there stands shorter. Try it with the throat slider.",
    theory:
      "Continuity: incompressible flow speeds up where the pipe narrows (A·v constant). Bernoulli's equation " +
      "trades pressure for speed: where velocity rises, pressure falls (P + ½ρv² + ρgh = constant). " +
      "Viscosity adds friction — laminar flow is smooth layers, turbulent flow is chaotic above a critical Reynolds number.",
    equations: [
      "Continuity: A₁·v₁ = A₂·v₂",
      "Bernoulli: P + ½ρv² + ρgh = constant",
      "Volume flow rate: Q = A·v",
      "Reynolds number: Re = ρ·v·D / μ",
    ],
    quiz: [
      { q: "A pipe's diameter halves. By what factor does the flow speed change?", a: "It quadruples — area falls by 4×, so v rises 4× to keep A·v constant." },
      { q: "Why does pressure drop in the narrow throat of a venturi?", a: "Bernoulli's principle: higher speed means lower pressure when height is unchanged." },
      { q: "What does the Reynolds number tell you?", a: "Whether flow is laminar (low Re) or turbulent (high Re) — it compares inertial to viscous forces." },
    ],
  },
  electrostat: {
    example:
      "Two 5 µC charges, opposite signs, 10 cm apart: F = k·q₁q₂/r² = (9×10⁹)(5×10⁻⁶)²/(0.1)² ≈ 22.5 N attractive. " +
      "Flip one sign and the same 22.5 N becomes repulsive — the field lines redraw themselves instantly. " +
      "The field midway between opposite charges is E ≈ 2kq/r², pointing from + to −.",
    theory:
      "Static charges exert Coulomb forces along the line joining them — like charges repel, opposites attract. " +
      "The electric field E = F/q maps the force a test charge would feel; field lines leave positive charges " +
      "and enter negative ones, never crossing. Conductors in equilibrium carry charge only on their surface, " +
      "with zero field inside.",
    equations: [
      "Coulomb's law: F = k·q₁·q₂ / r²",
      "Electric field: E = F/q = k·Q / r²",
      "Potential: V = k·Q / r",
      "Field at conductor surface: E = σ/ε₀",
    ],
    quiz: [
      { q: "Doubling the distance between two charges changes the force by what factor?", a: "It drops to one-quarter — Coulomb's law is inverse-square." },
      { q: "Which way do electric field lines point?", a: "Away from positive charges and toward negative charges; they never cross." },
      { q: "Why is the electric field zero inside a charged hollow conductor?", a: "Free charges repel to the outer surface; Gauss's law then gives zero enclosed charge, so zero field inside." },
    ],
  },
  structure: {
    example:
      "A 4 m cantilever beam with E·I = 2×10⁶ N·m² carrying 40 kN at its tip deflects " +
      "δ = P·L³/(3EI) = 40000×64/(3×2×10⁶) ≈ 0.43 m. Double the span to 8 m and deflection grows 8× — " +
      "deflection scales with L³. Move the load slider and watch the tip sag.",
    theory:
      "Beams bend because load creates internal bending moment, resisted by stresses across the section " +
      "(σ = M·y/I). Stiffer sections (larger I) and shorter spans deflect less. A cantilever is fixed at one " +
      "end; a simply-supported beam rests on two piers. Engineers keep deflection within limits like span/360.",
    equations: [
      "Bending stress: σ = M·y / I",
      "Cantilever tip deflection: δ = P·L³ / (3EI)",
      "Simply-supported centre deflection: δ = P·L³ / (48EI)",
      "Stiffness scales with I (second moment of area)",
    ],
    quiz: [
      { q: "How does doubling a cantilever's span change its tip deflection?", a: "It increases 8× — deflection ∝ L³." },
      { q: "Why are I-beams shaped like an I?", a: "Material placed far from the neutral axis maximises I, giving the most stiffness per kilogram." },
      { q: "Where is bending stress maximum in a beam?", a: "At the outermost fibres (top and bottom surfaces), farthest from the neutral axis." },
    ],
  },
  flower: {
    example:
      "A typical flower: green sepals (calyx) protect the bud; colourful petals (corolla) attract pollinators; " +
      "stamens (anther + filament) make pollen; the pistil (stigma + style + ovary) receives it. In double " +
      "fertilisation, one sperm fuses with the egg (embryo) and another with two polar nuclei (endosperm).",
    theory:
      "The flower is the angiosperm's reproductive structure. Male gametophyte (pollen) lands on the stigma, " +
      "germinates a pollen tube down the style, and delivers two sperm to the embryo sac. After fertilisation " +
      "the ovary becomes the fruit and ovules become seeds. Highlight each whorl with the part selector.",
    equations: [
      "Calyx = sepals (K), Corolla = petals (C)",
      "Androecium = stamens (A: anther + filament)",
      "Gynoecium = carpels (G: stigma + style + ovary)",
      "Double fertilisation: 1 sperm + egg → zygote; 1 sperm + 2 polar nuclei → endosperm",
    ],
    quiz: [
      { q: "Which flower parts are male and which are female?", a: "Stamens (anther + filament) are male; the pistil/carpel (stigma + style + ovary) is female." },
      { q: "What is double fertilisation?", a: "Unique to flowering plants: one sperm forms the zygote with the egg, another forms triploid endosperm with the polar nuclei." },
      { q: "After fertilisation, what do the ovary and ovules become?", a: "The ovary wall becomes the fruit (pericarp) and each ovule becomes a seed." },
    ],
  },
  ecosystem: {
    example:
      "If producers capture 10,000 kJ of solar energy, primary consumers get ≈ 1,000 kJ, secondary ≈ 100 kJ, " +
      "and tertiary ≈ 10 kJ — roughly 10% transfers at each step; the rest is lost as heat and respiration. " +
      "That's why food chains rarely exceed 4–5 levels and apex predators are rare.",
    theory:
      "Energy flows one way through trophic levels: producers → primary → secondary → tertiary consumers, " +
      "with decomposers recycling nutrients. Only ~10% of energy passes up each level (the 10% law), so " +
      "biomass and numbers shrink upward — the ecological pyramid. Toggle the energy flow to watch it.",
    equations: [
      "10% law: energy at level n+1 ≈ 0.1 × energy at level n",
      "Producers ≈ 100% → primary ≈ 10% → secondary ≈ 1% → tertiary ≈ 0.1%",
      "NPP = GPP − respiration (net primary productivity)",
      "Pyramid of energy is always upright",
    ],
    quiz: [
      { q: "Why are there so few trophic levels in a food chain?", a: "Only ~10% of energy transfers per level — after 4–5 steps almost nothing remains to support another level." },
      { q: "Why is the pyramid of energy always upright?", a: "Energy is lost as heat at every transfer, so each higher level necessarily holds less energy." },
      { q: "What role do decomposers play in energy flow?", a: "They break down dead matter, recycling nutrients — though the energy itself is ultimately lost as heat." },
    ],
  },
  skeleton: {
    example:
      "The adult human skeleton has 206 bones: 80 axial (skull, spine, ribcage) and 126 appendicular " +
      "(limbs + girdles). The femur is the longest and strongest; the stapes in the ear is the smallest " +
      "(~3 mm). Select a region to highlight it and see its bones.",
    theory:
      "Bones give shape, protect organs, anchor muscles, store minerals and make blood cells in marrow. " +
      "The skull guards the brain, the vertebral column (33 vertebrae) protects the spinal cord, the ribcage " +
      "shields heart and lungs, and limb bones act as levers moved by muscles across joints.",
    equations: [
      "Total bones: 206 (80 axial + 126 appendicular)",
      "Vertebral column: 33 vertebrae (7 cervical, 12 thoracic, 5 lumbar, 5 sacral, 4 coccygeal)",
      "Skull: 22 bones (8 cranial + 14 facial)",
      "Longest bone: femur; smallest: stapes (~3 mm)",
    ],
    quiz: [
      { q: "How many bones are in the adult human skeleton, and how are they grouped?", a: "206 — 80 axial (skull, spine, ribs) and 126 appendicular (limbs and girdles)." },
      { q: "Which are the longest and smallest bones in the body?", a: "Longest: femur (thigh bone); smallest: stapes in the middle ear." },
      { q: "Name three functions of the skeleton beyond support.", a: "Protection of organs, mineral storage (calcium/phosphorus), and blood-cell production in marrow." },
    ],
  },
  eye: {
    example:
      "Parallel rays from a distant object refract at the cornea (~+43 D) and crystalline lens (~+20 D), " +
      "focusing on the retina 24 mm behind. In myopia the eyeball is too long — focus falls in front of the " +
      "retina; in hypermetropia it's too short — focus falls behind. Switch conditions to see the rays miss.",
    theory:
      "The eye is a converging optical system: cornea does most of the refraction, the lens fine-tunes focus " +
      "(accommodation) for near objects, and the retina's photoreceptors (rods and cones) convert light to " +
      "neural signals. Myopia is corrected with concave lenses, hypermetropia with convex lenses.",
    equations: [
      "Lens power: P = 1/f (diopters, f in metres)",
      "Total eye power ≈ +60 D (cornea ~+43 D, lens ~+20 D)",
      "Myopia: focus in front of retina → concave (−) lens",
      "Hypermetropia: focus behind retina → convex (+) lens",
    ],
    quiz: [
      { q: "Where do light rays focus in myopia and hypermetropia?", a: "Myopia: in front of the retina; hypermetropia: behind the retina." },
      { q: "Which part of the eye does most of the focusing?", a: "The cornea (~+43 D) — the lens only fine-tunes via accommodation." },
      { q: "What kind of lens corrects myopia, and why?", a: "A concave (diverging) lens — it pushes the focal point back onto the retina." },
    ],
  },
  chip: {
    example:
      "A 3 GHz CPU ticks 3 billion times per second. If a program needs 10⁹ instructions at 1.5 CPI, " +
      "CPU time = (10⁹ × 1.5) / (3×10⁹) = 0.5 s. Data packets shuttle between cache, ALU and control unit " +
      "on every tick — raise the clock slider and watch the traffic speed up.",
    theory:
      "A CPU fetches, decodes and executes instructions. The control unit orchestrates, the ALU computes, " +
      "registers hold operands, and cache keeps hot data close. Performance = clock rate × IPC — a faster " +
      "clock helps only if the pipeline stays fed (no stalls waiting on memory).",
    equations: [
      "CPU time = (Instruction count × CPI) / Clock rate",
      "MIPS = Clock rate / (CPI × 10⁶)",
      "Amdahl's law: speedup limited by the serial fraction",
      "Power ≈ C·V²·f (why clocks stopped rising ~2005)",
    ],
    quiz: [
      { q: "A CPU runs at 3 GHz with CPI = 1.5. How long do 10⁹ instructions take?", a: "0.5 s — (10⁹ × 1.5)/(3×10⁹)." },
      { q: "What do the ALU, control unit and cache each do?", a: "ALU: arithmetic/logic ops; control unit: fetch–decode–execute orchestration; cache: fast nearby storage for hot data." },
      { q: "Why don't CPU clock speeds keep rising like they used to?", a: "Power scales with V²·f — heat walls forced the industry toward multi-core instead of higher clocks." },
    ],
  },
  reproduction: {
    example:
      "Week 4: the embryo is ~2 mm with a beating heart tube. Week 8: ~1.6 cm, all organs started (end of " +
      "embryonic period). Week 12: ~5.4 cm, recognisably human. Week 20: ~25 cm, mother feels movement. " +
      "Week 38: ~48 cm, ~3 kg — full term. Drag the week slider through the timeline.",
    theory:
      "Fertilisation (usually in the fallopian tube) forms the zygote, which divides into a blastocyst that " +
      "implants in the uterus. Weeks 1–8 (embryonic period) build all organ systems — the most vulnerable " +
      "window. Weeks 9–38 (fetal period) grow and mature them. The placenta feeds the fetus via the umbilical cord.",
    equations: [
      "Embryonic period: weeks 1–8 (organogenesis)",
      "Fetal period: weeks 9–38 (growth and maturation)",
      "Heartbeat detectable ≈ week 6",
      "Full term ≈ 38–40 weeks (~48 cm, ~3 kg)",
    ],
    quiz: [
      { q: "Why is the embryonic period (weeks 1–8) the most vulnerable to teratogens?", a: "All major organs form then — disruption causes structural birth defects rather than just growth issues." },
      { q: "What connects the fetus to the placenta, and what does the placenta do?", a: "The umbilical cord; the placenta exchanges nutrients, oxygen and waste between mother and fetus." },
      { q: "Roughly how big is the fetus at 12 weeks and at full term?", a: "~5.4 cm at 12 weeks; ~48 cm and ~3 kg at 38–40 weeks." },
    ],
  },
  animal: {
    example:
      "Seven body plans, one slider: a sponge (no true tissues), a jellyfish (radial symmetry), an insect " +
      "(exoskeleton, 6 legs), a fish (gills, fins), a frog (dual life), a bird (feathers, beak), a mammal " +
      "(hair, mammary glands). Each step up adds a key innovation in animal evolution.",
    theory:
      "Animals are classified by body plan: symmetry (asymmetric/radial/bilateral), germ layers, coelom, " +
      "and segmentation. Porifera lack true tissues; cnidarians add radial symmetry and stinging cells; " +
      "arthropods add exoskeletons and jointed legs; chordates add a notochord — refined into the " +
      "vertebrate backbone in fish, amphibians, reptiles, birds and mammals.",
    equations: [
      "Porifera: no true tissues, asymmetric",
      "Cnidaria: radial symmetry, cnidocytes",
      "Arthropoda: exoskeleton, jointed appendages, segmented",
      "Chordata: notochord, dorsal nerve cord, pharyngeal slits",
    ],
    quiz: [
      { q: "What defines an arthropod?", a: "Exoskeleton, segmented body and jointed appendages — e.g. insects, crabs, spiders." },
      { q: "Name the four hallmark chordate traits.", a: "Notochord, dorsal hollow nerve cord, pharyngeal slits, post-anal tail (at some life stage)." },
      { q: "Why is a jellyfish radially symmetric but a fish bilaterally symmetric?", a: "Radial suits a drifting, all-directions lifestyle; bilateral suits directed movement with a head end (cephalisation)." },
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

export async function getTopicContent(
  sim: SimKey | null,
  topicId?: number | null
): Promise<TopicContent> {
  // 1) AI-written study content from the DB (covers every topic once generated).
  if (topicId != null) {
    try {
      const row = await prisma.topicStudy.findUnique({
        where: { topicId },
        select: {
          theory: true, example: true, equations: true, quiz: true,
          theoryHi: true, exampleHi: true, equationsHi: true, quizHi: true,
        },
      });
      if (row) {
        const equations = safeStringArray(row.equations);
        const quiz = safeQuizArray(row.quiz);
        if (row.theory && row.example && equations.length > 0 && quiz.length > 0) {
          const out: TopicContent = {
            theory: row.theory, example: row.example, equations, quiz,
          };
          // Attach Hindi versions when present.
          if (row.theoryHi && row.exampleHi) {
            out.theoryHi = row.theoryHi;
            out.exampleHi = row.exampleHi;
            const eqHi = row.equationsHi ? safeStringArray(row.equationsHi) : [];
            if (eqHi.length > 0) out.equationsHi = eqHi;
            const quizHi = row.quizHi ? safeQuizArray(row.quizHi) : [];
            if (quizHi.length > 0) out.quizHi = quizHi;
          }
          return out;
        }
      }
    } catch {
      // DB hiccup → fall through to sim/generic content.
    }
  }
  // 2) Hand-written flagship sim content.
  if (sim) return CONTENT[sim];
  // 3) Honest placeholder.
  return GENERIC;
}

function safeStringArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function safeQuizArray(json: string): QuizItem[] {
  try {
    const v = JSON.parse(json);
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (x) =>
          x &&
          typeof x.q === "string" &&
          typeof x.a === "string" &&
          x.q.trim() &&
          x.a.trim()
      )
      .map((x) => ({ q: x.q, a: x.a }));
  } catch {
    return [];
  }
}

/** True when the content is the honest placeholder bundle (no real notes yet). */
export function isGenericContent(content: TopicContent): boolean {
  return content === GENERIC;
}
