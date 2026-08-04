import { useEffect, useRef } from "react";
import { paintWoodSurface, type SurfaceState } from "@/pixel-art/woodTexture";
import { hashString } from "@/pixel-art/prng";

interface PixelSurfaceProps {
  seed: string;
  state: SurfaceState;
  cornerRadius?: number;
  className?: string;
}

/**
 * Canvas-backed wooden texture that fills its parent. Redraws whenever its
 * box size or interaction state changes; the seed keeps grain/knots stable
 * across re-renders of the same element.
 */
export function PixelSurface({ seed, state, cornerRadius, className }: PixelSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seedNumber = useRef(hashString(seed)).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paint = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (width === 0 || height === 0) return;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintWoodSurface(ctx, width, height, { seed: seedNumber, state, cornerRadius });
    };

    paint();
    const observer = new ResizeObserver(paint);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [seedNumber, state, cornerRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
