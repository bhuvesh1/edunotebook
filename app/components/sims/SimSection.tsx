// app/components/sims/SimSection.tsx
// Client wrapper for the 3D viewport on a topic page.
// - Lazy-loads the sim via next/dynamic (ssr: false) inside Suspense.
// - Wraps everything in an error boundary + a div carrying data-model="{topicSlug}".
// - Renders the control panel (sliders + number inputs, or a select) that
//   drives the sim live through props.

"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, type ComponentType } from "react";
import {
  SIM_CONTROLS,
  SIM_META,
  type ControlSpec,
  type SimKey,
} from "../../../lib/simulations/registry";
import { SimErrorBoundary } from "./SimErrorBoundary";
import type { SimProps } from "./sim-props";

const SIM_COMPONENTS: Record<SimKey, ComponentType<SimProps>> = {
  projectile: dynamic(() => import("./ProjectileSim").then((m) => m.ProjectileSim), {
    ssr: false,
  }),
  pendulum: dynamic(() => import("./PendulumSim").then((m) => m.PendulumSim), {
    ssr: false,
  }),
  solar: dynamic(() => import("./SolarSystemSim").then((m) => m.SolarSystemSim), {
    ssr: false,
  }),
  incline: dynamic(() => import("./InclineSim").then((m) => m.InclineSim), {
    ssr: false,
  }),
  wave: dynamic(() => import("./WaveSim").then((m) => m.WaveSim), { ssr: false }),
  lens: dynamic(() => import("./LensSim").then((m) => m.LensSim), { ssr: false }),
  atom: dynamic(() => import("./AtomSim").then((m) => m.AtomSim), { ssr: false }),
  heart: dynamic(() => import("./HeartSim").then((m) => m.HeartSim), { ssr: false }),
  molecule: dynamic(() => import("./MoleculeSim").then((m) => m.MoleculeSim), { ssr: false }),
  dna: dynamic(() => import("./DnaSim").then((m) => m.DnaSim), { ssr: false }),
  cell: dynamic(() => import("./CellSim").then((m) => m.CellSim), { ssr: false }),
  circuit: dynamic(() => import("./CircuitSim").then((m) => m.CircuitSim), { ssr: false }),
  dental: dynamic(() => import("./DentalSim").then((m) => m.DentalSim), { ssr: false }),
  thermo: dynamic(() => import("./ThermoSim").then((m) => m.ThermoSim), { ssr: false }),
  fluid: dynamic(() => import("./FluidSim").then((m) => m.FluidSim), { ssr: false }),
  electrostat: dynamic(() => import("./ElectrostatSim").then((m) => m.ElectrostatSim), { ssr: false }),
  structure: dynamic(() => import("./StructureSim").then((m) => m.StructureSim), { ssr: false }),
  flower: dynamic(() => import("./FlowerSim").then((m) => m.FlowerSim), { ssr: false }),
  ecosystem: dynamic(() => import("./EcosystemSim").then((m) => m.EcosystemSim), { ssr: false }),
  skeleton: dynamic(() => import("./SkeletonSim").then((m) => m.SkeletonSim), { ssr: false }),
  eye: dynamic(() => import("./EyeSim").then((m) => m.EyeSim), { ssr: false }),
  chip: dynamic(() => import("./ChipSim").then((m) => m.ChipSim), { ssr: false }),
  reproduction: dynamic(() => import("./ReproSim").then((m) => m.ReproSim), { ssr: false }),
  animal: dynamic(() => import("./AnimalSim").then((m) => m.AnimalSim), { ssr: false }),
};

function defaultsFor(key: SimKey): SimProps {
  const d: SimProps = {};
  for (const c of SIM_CONTROLS[key]) d[c.key] = c.default;
  return d;
}

function ControlRow({
  spec,
  value,
  onChange,
}: {
  spec: ControlSpec;
  value: number | string;
  onChange: (v: number | string) => void;
}) {
  if (spec.kind === "select") {
    return (
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">
          {spec.label}
        </label>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[var(--rule)] bg-white px-3 py-2 text-sm"
        >
          {(spec.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  const num = Number(value);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label
          htmlFor={`sim-ctl-${spec.key}`}
          className="text-sm font-semibold text-slate-700"
        >
          {spec.label}
        </label>
        <span className="flex items-center gap-1 text-sm">
          <input
            id={`sim-ctl-${spec.key}-num`}
            type="number"
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={num}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 rounded-md border border-[var(--rule)] bg-white px-2 py-1 text-right text-sm font-semibold"
            aria-label={`${spec.label} value`}
          />
          {spec.unit && <span className="text-xs text-slate-500">{spec.unit}</span>}
        </span>
      </div>
      <input
        id={`sim-ctl-${spec.key}`}
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={num}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-600"
        aria-label={spec.label}
      />
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>
          {spec.min}
          {spec.unit}
        </span>
        <span>
          {spec.max}
          {spec.unit}
        </span>
      </div>
    </div>
  );
}

export function SimSection({
  simKey,
  topicSlug,
}: {
  simKey: SimKey;
  topicSlug: string;
}) {
  const [params, setParams] = useState<SimProps>(() => defaultsFor(simKey));
  const Sim = SIM_COMPONENTS[simKey];
  const meta = SIM_META[simKey];

  return (
    <section aria-label={`Interactive 3D: ${meta.title}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-hand text-2xl font-bold text-slate-800">
          {meta.title}
        </h3>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Interactive 3D
        </span>
      </div>
      <p className="mb-4 text-sm text-slate-600">{meta.blurb}</p>

      <div
        data-model={topicSlug}
        className="grid gap-4 lg:grid-cols-3"
      >
        {/* 3D viewport */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-[var(--rule)] shadow-sm lg:col-span-2">
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-[#0b1020]">
                <p className="animate-pulse font-hand text-xl text-slate-300">
                  Loading 3D model…
                </p>
              </div>
            }
          >
            <SimErrorBoundary>
              <Sim {...params} />
            </SimErrorBoundary>
          </Suspense>
        </div>

        {/* control panel */}
        <div className="rounded-2xl border-2 border-[var(--rule)] bg-white/70 p-4 sm:p-5">
          <h4 className="font-hand text-xl font-bold text-slate-800">
            Controls
          </h4>
          <p className="mb-4 text-xs text-slate-500">
            Drag the sliders or type a value — the simulation updates live.
          </p>
          <div className="space-y-5">
            {SIM_CONTROLS[simKey].map((spec) => (
              <ControlRow
                key={spec.key}
                spec={spec}
                value={params[spec.key]}
                onChange={(v) =>
                  setParams((p) => ({ ...p, [spec.key]: v }))
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setParams(defaultsFor(simKey))}
            className="mt-5 w-full rounded-lg border border-[var(--rule)] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </section>
  );
}
