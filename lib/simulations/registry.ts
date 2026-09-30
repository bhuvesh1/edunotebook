// lib/simulations/registry.ts
// Maps taxonomy topics → interactive 3D simulation.
// The topic page consults matchSim(): a match renders the bespoke sim,
// no match renders a graceful "coming soon" card (never an error).

export type SimKey =
  | "projectile"
  | "pendulum"
  | "solar"
  | "incline"
  | "wave"
  | "lens"
  | "atom"
  | "heart"
  | "molecule"
  | "dna"
  | "cell"
  | "circuit"
  | "dental"
  | "thermo"
  | "fluid"
  | "electrostat"
  | "structure"
  | "flower"
  | "ecosystem"
  | "skeleton"
  | "eye"
  | "chip"
  | "reproduction"
  | "animal";

export interface ControlSpec {
  key: string;
  label: string;
  kind: "slider" | "select";
  min: number;
  max: number;
  step: number;
  default: number | string;
  unit?: string;
  options?: string[];
}

/** Live controls rendered beside the viewport; values are passed as sim props. */
export const SIM_CONTROLS: Record<SimKey, ControlSpec[]> = {
  projectile: [
    { key: "velocity", label: "Launch velocity", kind: "slider", min: 5, max: 50, step: 1, default: 20, unit: "m/s" },
    { key: "angle", label: "Launch angle", kind: "slider", min: 10, max: 80, step: 1, default: 45, unit: "°" },
  ],
  pendulum: [
    { key: "length", label: "String length", kind: "slider", min: 0.3, max: 2, step: 0.05, default: 1, unit: "m" },
    { key: "angle", label: "Release angle", kind: "slider", min: 5, max: 45, step: 1, default: 20, unit: "°" },
  ],
  solar: [
    { key: "speed", label: "Orbit speed", kind: "slider", min: 0, max: 2, step: 0.1, default: 1, unit: "×" },
  ],
  incline: [
    { key: "angle", label: "Ramp angle", kind: "slider", min: 10, max: 60, step: 1, default: 30, unit: "°" },
  ],
  wave: [
    { key: "amplitude", label: "Amplitude", kind: "slider", min: 0.1, max: 1, step: 0.05, default: 0.5, unit: "m" },
    { key: "frequency", label: "Frequency", kind: "slider", min: 0.5, max: 3, step: 0.1, default: 1, unit: "Hz" },
  ],
  lens: [
    { key: "objectDistance", label: "Object distance", kind: "slider", min: 3, max: 10, step: 0.25, default: 6, unit: "cm" },
  ],
  atom: [
    { key: "element", label: "Element", kind: "select", min: 0, max: 0, step: 1, default: "H", options: ["H", "He", "Li"] },
  ],
  heart: [
    { key: "rate", label: "Heart rate", kind: "slider", min: 40, max: 120, step: 1, default: 72, unit: "bpm" },
  ],
  molecule: [
    { key: "molecule", label: "Molecule", kind: "select", min: 0, max: 0, step: 1, default: "H2O", options: ["H2O", "CO2", "CH4", "NH3", "C6H6", "O2", "NaCl"] },
  ],
  dna: [
    { key: "speed", label: "Rotation speed", kind: "slider", min: 0, max: 2, step: 0.1, default: 0.6, unit: "×" },
  ],
  cell: [
    { key: "organelle", label: "Organelle", kind: "select", min: 0, max: 0, step: 1, default: "all", options: ["all", "membrane", "nucleus", "nucleolus", "mitochondria", "ribosome"] },
  ],
  circuit: [
    { key: "voltage", label: "Battery voltage", kind: "slider", min: 1, max: 12, step: 0.5, default: 6, unit: "V" },
  ],
  dental: [
    { key: "view", label: "View", kind: "select", min: 0, max: 0, step: 1, default: "tooth", options: ["tooth", "implant", "braces", "denture"] },
    { key: "explode", label: "Explode layers", kind: "slider", min: 0, max: 1, step: 0.05, default: 0, unit: "%" },
  ],
  thermo: [
    { key: "temperature", label: "Temperature", kind: "slider", min: 200, max: 600, step: 10, default: 300, unit: "K" },
    { key: "volume", label: "Volume", kind: "slider", min: 0.5, max: 2, step: 0.1, default: 1, unit: "×" },
  ],
  fluid: [
    { key: "constriction", label: "Throat size", kind: "slider", min: 0.3, max: 1, step: 0.05, default: 0.6, unit: "×" },
    { key: "flowSpeed", label: "Flow speed", kind: "slider", min: 0.5, max: 3, step: 0.1, default: 1, unit: "×" },
  ],
  electrostat: [
    { key: "config", label: "Charge setup", kind: "select", min: 0, max: 0, step: 1, default: "plusminus", options: ["plusplus", "plusminus", "dipole"] },
    { key: "charge", label: "Charge", kind: "slider", min: 1, max: 10, step: 1, default: 5, unit: "µC" },
  ],
  structure: [
    { key: "beamType", label: "Beam type", kind: "select", min: 0, max: 0, step: 1, default: "cantilever", options: ["cantilever", "simply-supported"] },
    { key: "load", label: "Load", kind: "slider", min: 0, max: 100, step: 5, default: 40, unit: "kN" },
  ],
  flower: [
    { key: "part", label: "Flower part", kind: "select", min: 0, max: 0, step: 1, default: "all", options: ["all", "petals", "stamen", "pistil", "sepal"] },
    { key: "pollination", label: "Pollination", kind: "select", min: 0, max: 0, step: 1, default: "off", options: ["off", "on"] },
  ],
  ecosystem: [
    { key: "level", label: "Trophic level", kind: "select", min: 0, max: 0, step: 1, default: "all", options: ["all", "producers", "primary", "secondary", "tertiary"] },
    { key: "flow", label: "Energy flow", kind: "select", min: 0, max: 0, step: 1, default: "on", options: ["off", "on"] },
  ],
  skeleton: [
    { key: "region", label: "Region", kind: "select", min: 0, max: 0, step: 1, default: "all", options: ["all", "skull", "spine", "ribcage", "arm", "leg"] },
    { key: "labels", label: "Labels", kind: "select", min: 0, max: 0, step: 1, default: "on", options: ["off", "on"] },
  ],
  eye: [
    { key: "part", label: "Eye part", kind: "select", min: 0, max: 0, step: 1, default: "all", options: ["all", "cornea", "lens", "retina"] },
    { key: "condition", label: "Condition", kind: "select", min: 0, max: 0, step: 1, default: "normal", options: ["normal", "myopia", "hypermetropia"] },
  ],
  chip: [
    { key: "block", label: "Chip block", kind: "select", min: 0, max: 0, step: 1, default: "all", options: ["all", "alu", "cache", "control", "registers"] },
    { key: "clock", label: "Clock speed", kind: "slider", min: 0.5, max: 4, step: 0.5, default: 1, unit: "×" },
  ],
  reproduction: [
    { key: "week", label: "Week", kind: "slider", min: 1, max: 38, step: 1, default: 12, unit: "wk" },
  ],
  animal: [
    { key: "group", label: "Animal group", kind: "select", min: 0, max: 0, step: 1, default: "fish", options: ["sponge", "jellyfish", "insect", "fish", "frog", "bird", "mammal"] },
  ],
};

export const SIM_META: Record<SimKey, { title: string; blurb: string }> = {
  projectile: {
    title: "Projectile launcher",
    blurb: "Fire the cannon and watch the ball follow its true trajectory — range, apex and flight time update live.",
  },
  pendulum: {
    title: "Simple pendulum",
    blurb: "Release the bob and watch true small-angle SHM. The period depends only on the string length.",
  },
  solar: {
    title: "Solar system",
    blurb: "All eight planets in orbit around the Sun, with Saturn's rings and Earth's Moon.",
  },
  incline: {
    title: "Block on an incline",
    blurb: "Slide the block down the ramp — steeper ramps accelerate it faster, exactly as g·sinθ predicts.",
  },
  wave: {
    title: "Transverse wave",
    blurb: "A travelling wave ribbon. Raise the amplitude to make it taller, the frequency to make it faster.",
  },
  lens: {
    title: "Convex lens ray diagram",
    blurb: "Move the object and watch parallel rays converge at the focal point while the image obeys 1/f = 1/v + 1/u.",
  },
  atom: {
    title: "Bohr atom",
    blurb: "Electrons orbit the nucleus in shells — switch element to see H, He and Li fill their shells.",
  },
  heart: {
    title: "Beating heart",
    blurb: "A stylized heart pulsing at the rate you set, with its key chambers labelled.",
  },
  molecule: {
    title: "Molecule viewer",
    blurb: "Ball-and-stick models with true bond angles — switch molecule to compare shapes.",
  },
  dna: {
    title: "DNA double helix",
    blurb: "The twisted ladder of life — A–T and G–C base pairs winding 10 per turn.",
  },
  cell: {
    title: "Animal cell explorer",
    blurb: "Peek inside an animal cell — pick an organelle to highlight it and learn its job.",
  },
  circuit: {
    title: "DC circuit",
    blurb: "Electrons drift around the loop — raise the voltage and watch the current obey Ohm's law.",
  },
  dental: {
    title: "Tooth explorer",
    blurb: "Peel through enamel, dentin and pulp — then switch to implants, braces or dentures.",
  },
  thermo: {
    title: "Gas piston lab",
    blurb: "Heat the gas and watch molecules speed up — pressure obeys the gas laws live.",
  },
  fluid: {
    title: "Bernoulli pipe",
    blurb: "Narrow the pipe and the flow speeds up while pressure drops — Bernoulli in action.",
  },
  electrostat: {
    title: "Electric field lab",
    blurb: "Place charges and trace the field lines — like charges repel, opposites attract.",
  },
  structure: {
    title: "Beam bending lab",
    blurb: "Load the beam and watch it deflect — heavier loads bend it more, exactly as theory predicts.",
  },
  flower: {
    title: "Flower explorer",
    blurb: "Dissect a flower in 3D — highlight each part and watch pollination happen.",
  },
  ecosystem: {
    title: "Ecological pyramid",
    blurb: "Climb the trophic pyramid — only a tenth of the energy passes to each level.",
  },
  skeleton: {
    title: "Skeleton explorer",
    blurb: "Rotate the skeleton and highlight regions — 206 bones in one interactive model.",
  },
  eye: {
    title: "Eye anatomy lab",
    blurb: "Follow light through the eye — see how myopia and hypermetropia miss the retina.",
  },
  chip: {
    title: "CPU chip explorer",
    blurb: "Look inside a processor — data packets race between ALU, cache and control unit.",
  },
  reproduction: {
    title: "Fetal development",
    blurb: "Travel week by week from fertilized egg to fetus.",
  },
  animal: {
    title: "Animal kingdom explorer",
    blurb: "Compare body plans across seven animal groups — from sponges to mammals.",
  },
};

/**
 * Priority-ordered keyword patterns matched against the topic NAME
 * (lowercased). First match wins, so "projectiles on inclined planes"
 * resolves to the projectile sim, not the incline sim.
 */
const SIM_PATTERNS: { key: SimKey; pattern: RegExp }[] = [
  { key: "projectile", pattern: /projectile/i },
  { key: "pendulum", pattern: /pendulum/i },
  { key: "solar", pattern: /\b(solar system|kepler|planets?)\b/i },
  { key: "incline", pattern: /inclined plane/i },
  { key: "wave", pattern: /\bwave(s)?\b/i },
  { key: "lens", pattern: /\blens(es)?\b/i },
  { key: "atom", pattern: /\batom(s|ic)?\b/i },
  { key: "heart", pattern: /\bheart\b/i },
  { key: "molecule", pattern: /\bmolecule|benzene|\balkane|\balkene|\balkyne|functional group|\bisomer/i },
  { key: "dna", pattern: /\bdna\b|\bgene(s)?\b|genome|chromosome|nucleotide/i },
  { key: "cell", pattern: /animal cell|plant cell|\bmitochondri|\bchloroplast|\borganelle|\bcytoplasm|cell membrane|cell wall/i },
  { key: "circuit", pattern: /\bcircuit|\bohm'?s law|\bresistor|\bkirchhoff|current electricity/i },
  { key: "dental", pattern: /\btooth|\bteeth\b|\bdental\b|\bcaries\b|root canal|\bdenture|\borthodont|\bbraces\b|\baligner|\bperiodont/i },
  { key: "thermo", pattern: /\bthermodynamics?\b|heat engine|\bcarnot\b|\bentrop|\bgas laws?\b|kinetic theory of gases/i },
  { key: "fluid", pattern: /\bbernoulli|\bviscosity\b|fluid mechanics|\breynolds\b|\blaminar\b|turbulent flow|\bbuoyancy\b/i },
  { key: "electrostat", pattern: /\belectrostatics?\b|\bcoulomb'?s\b|electric field|\bequipotential|\bgauss'?s law\b/i },
  { key: "structure", pattern: /\bbeam\b|\btruss\b|bending moment|\bbuckling\b|\bcantilever\b/i },
  { key: "flower", pattern: /\bflower\b|\binflorescence\b|\bpollination\b|double fertili[sz]ation/i },
  { key: "ecosystem", pattern: /\becosystem\b|ecological pyramid|food web|\btrophic\b/i },
  { key: "skeleton", pattern: /\bskeleton\b|\bskull\b|\bvertebrae?\b|\bfemur\b|\bhumerus\b|rib ?cage/i },
  { key: "eye", pattern: /\beye\b|\bophthalm|\bmyopia\b|hypermetropia|\bretina\b|\bcornea\b/i },
  { key: "chip", pattern: /\bmicroprocessor\b|\bcpu\b|8085|8086|\balu\b|\bpipelining\b|cache memory/i },
  { key: "reproduction", pattern: /\bpregnancy\b|\bfetus\b|\bfetal\b|\bembryo\b|\bfertili[sz]ation\b|\bgametogenesis\b|\bmenstrual\b/i },
  { key: "animal", pattern: /\bporifera\b|\bannelida\b|\barthropod|\bmollusca\b|\bchordata\b|\bvertebrate\b|\binvertebrate\b/i },
];

/** Return the sim key for a topic name, or null when no sim exists yet. */
export function matchSim(topicName: string): SimKey | null {
  for (const { key, pattern } of SIM_PATTERNS) {
    if (pattern.test(topicName)) return key;
  }
  return null;
}

/**
 * Category-level fallback: when the topic NAME matches nothing, the
 * category name picks a scientifically appropriate generic sim.
 * Checked only after SIM_PATTERNS, so specific topics keep their bespoke sim.
 */
const CATEGORY_SIM_PATTERNS: { key: SimKey; pattern: RegExp }[] = [
  { key: "projectile", pattern: /kinematics/i },
  { key: "incline", pattern: /laws of motion/i },
  { key: "pendulum", pattern: /oscillations|rotational|work, energy/i },
  { key: "solar", pattern: /gravitation|astrophysics|cosmology/i },
  { key: "wave", pattern: /waves & sound|wave optics|electromagnetic waves/i },
  { key: "lens", pattern: /ray optics/i },
  { key: "atom", pattern: /^(atoms|nuclei|dual nature)/i },
  { key: "circuit", pattern: /current electricity|magnetism|electromagnetic induction|semiconductor|digital & analog/i },
  { key: "molecule", pattern: /physical chemistry|inorganic chemistry|organic chemistry|analytical chemistry|biomolecules|atomic, molecular/i },
  { key: "dna", pattern: /genetics|biotechnology/i },
  { key: "cell", pattern: /cell biology|cell cycle|microbiology|pre-clinical|para-clinical|basic dental/i },
  { key: "heart", pattern: /body fluids and circulation/i },
  { key: "thermo", pattern: /thermodynamics/i },
  { key: "fluid", pattern: /fluid mechanics/i },
  { key: "electrostat", pattern: /electrostatics/i },
];

/** Category fallback for matchSim: pass the topic's category name. */
export function matchSimByCategory(categoryName: string): SimKey | null {
  for (const { key, pattern } of CATEGORY_SIM_PATTERNS) {
    if (pattern.test(categoryName)) return key;
  }
  return null;
}

export const SIM_KEYS: SimKey[] = [
  "projectile",
  "pendulum",
  "solar",
  "incline",
  "wave",
  "lens",
  "atom",
  "heart",
  "molecule",
  "dna",
  "cell",
  "circuit",
  "dental",
  "thermo",
  "fluid",
  "electrostat",
  "structure",
  "flower",
  "ecosystem",
  "skeleton",
  "eye",
  "chip",
  "reproduction",
  "animal",
];

/** True when value is one of the registry sim keys. */
export function isSimKey(value: unknown): value is SimKey {
  return typeof value === "string" && (SIM_KEYS as string[]).includes(value);
}

/** Magic override value that forces NO 3D viewport for a topic. */
export const SIM_NONE = "none" as const;

/**
 * Resolve the effective sim for a topic given its name, its DB override,
 * and its category name (fallback):
 *  - override === "none" → null (force no 3D)
 *  - override is a registry key → that sim (force)
 *  - otherwise → matchSim(name), then matchSimByCategory(categoryName)
 */
export function effectiveSim(
  topicName: string,
  override: string | null | undefined,
  categoryName?: string | null
): SimKey | null {
  if (override === SIM_NONE) return null;
  if (isSimKey(override)) return override;
  return matchSim(topicName) ?? (categoryName ? matchSimByCategory(categoryName) : null);
}
