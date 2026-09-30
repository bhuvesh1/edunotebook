// app/components/sims/sim-props.ts
// Props handed from the topic page control panel to every sim.
// Each sim reads the keys it needs and ignores the rest.

export type SimProps = Record<string, number | string>;
