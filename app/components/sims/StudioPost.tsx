// app/components/sims/StudioPost.tsx
// Post-processing for all sims: N8AO ambient occlusion + SMAA antialiasing.
// Wrapped in an error boundary — if N8AO fails on a device (known issue on
// some Pixel phones), the sim renders without post effects instead of dying.
// Phase 1 of the 3D Upgrade Guide.

"use client";

import { Component, type ReactNode } from "react";
import { EffectComposer, N8AO, SMAA } from "@react-three/postprocessing";

class PostErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function StudioPost() {
  return (
    <PostErrorBoundary>
      <EffectComposer multisampling={0}>
        <N8AO
          aoRadius={0.6}
          distanceFalloff={1}
          intensity={1.2}
          quality="medium"
          halfRes
        />
        <SMAA />
      </EffectComposer>
    </PostErrorBoundary>
  );
}
