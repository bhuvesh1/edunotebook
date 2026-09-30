// app/components/sims/SimErrorBoundary.tsx
// Catches WebGL / render failures inside a sim and shows a calm fallback
// instead of crashing the whole topic page.
// Includes a retry button for transient failures (slow network, GPU hiccup)
// and a WebGL support check to show the right guidance.

"use client";

import { Component, Fragment, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
  webglOk: boolean;
  attempt: number;
}

function checkWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (gl) {
      const lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export class SimErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, webglOk: true, attempt: 0 };

  static getDerivedStateFromError(): State {
    return { failed: true, webglOk: checkWebGL(), attempt: 0 };
  }

  retry = () => {
    this.setState((s) => ({ failed: false, webglOk: true, attempt: s.attempt + 1 }));
  };

  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b1020] p-6 text-center">
          <div>
            <p className="font-hand text-xl font-bold text-slate-200">
              3D view couldn&apos;t start
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {this.state.webglOk ? (
                <>
                  The 3D model failed to load — this often happens on a slow
                  connection. The theory, example and quiz below still work
                  fine.
                </>
              ) : (
                <>
                  Your browser may have WebGL disabled. Try enabling it in{" "}
                  <span className="font-mono">chrome://flags</span>, or open
                  this page in Chrome/Firefox. The theory, example and quiz
                  below still work fine.
                </>
              )}
            </p>
            {this.state.webglOk && (
              <button
                type="button"
                onClick={this.retry}
                className="mt-4 rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      );
    }
    // Key on attempt so "Try again" fully remounts the 3D view.
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}
