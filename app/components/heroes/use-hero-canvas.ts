"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export type CanvasRenderer = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeSeconds: number
) => void;

/**
 * Shared canvas-2D loop for hero animations. Phone-performant:
 * - DPR capped at 2
 * - pauses when the hero scrolls out of view (IntersectionObserver)
 * - renders a single static frame when prefers-reduced-motion is set
 */
export function useHeroCanvas(render: CanvasRenderer) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const renderRef = useRef(render);
  useEffect(() => {
    renderRef.current = render;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;

    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);

    const draw = (timeMs: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      renderRef.current(ctx, rect.width, rect.height, timeMs / 1000);
    };

    const loop = () => {
      if (!running || reduced) return;
      draw(performance.now());
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running && !reduced) loop();
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    if (reduced) {
      draw(1200); // one static frame
    } else {
      loop();
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", sizeCanvas);
    };
  }, [reduced]);

  return canvasRef;
}
