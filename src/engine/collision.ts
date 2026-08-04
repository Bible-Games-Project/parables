import type { Vector2 } from "@/engine/input";

export function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function circlesOverlap(a: Vector2, radiusA: number, b: Vector2, radiusB: number): boolean {
  return distance(a, b) < radiusA + radiusB;
}

export function clampToBounds(position: Vector2, bounds: { width: number; height: number }, margin = 0): Vector2 {
  return {
    x: Math.max(margin, Math.min(bounds.width - margin, position.x)),
    y: Math.max(margin, Math.min(bounds.height - margin, position.y)),
  };
}

export function normalize(vector: Vector2): Vector2 {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
