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

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleObstacle extends Vector2 {
  radius: number;
}

/** Pushes a circle back out of a solid circle obstacle if it's overlapping. Returns the position unchanged otherwise. */
export function resolveCircleVsCircle(position: Vector2, radius: number, obstacle: Vector2, obstacleRadius: number): Vector2 {
  const d = distance(position, obstacle);
  const minDist = radius + obstacleRadius;
  if (d >= minDist || d === 0) return position;
  const nx = (position.x - obstacle.x) / d;
  const ny = (position.y - obstacle.y) / d;
  return { x: obstacle.x + nx * minDist, y: obstacle.y + ny * minDist };
}

/** Pushes a circle back out of a solid rectangle obstacle if it's overlapping. Returns the position unchanged otherwise. */
export function resolveCircleVsRect(position: Vector2, radius: number, rect: Rect): Vector2 {
  const closestX = Math.max(rect.x, Math.min(rect.x + rect.width, position.x));
  const closestY = Math.max(rect.y, Math.min(rect.y + rect.height, position.y));
  const dx = position.x - closestX;
  const dy = position.y - closestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= radius * radius) return position;

  const dist = Math.sqrt(distSq);
  if (dist === 0) {
    const distLeft = position.x - rect.x;
    const distRight = rect.x + rect.width - position.x;
    const distTop = position.y - rect.y;
    const distBottom = rect.y + rect.height - position.y;
    const minPenetration = Math.min(distLeft, distRight, distTop, distBottom);
    if (minPenetration === distLeft) return { x: rect.x - radius, y: position.y };
    if (minPenetration === distRight) return { x: rect.x + rect.width + radius, y: position.y };
    if (minPenetration === distTop) return { x: position.x, y: rect.y - radius };
    return { x: position.x, y: rect.y + rect.height + radius };
  }

  const nx = dx / dist;
  const ny = dy / dist;
  return { x: closestX + nx * radius, y: closestY + ny * radius };
}

/** True if the circle overlaps the rectangle at all (no push-out, just a test). */
export function circleOverlapsRect(position: Vector2, radius: number, rect: Rect): boolean {
  const closestX = Math.max(rect.x, Math.min(rect.x + rect.width, position.x));
  const closestY = Math.max(rect.y, Math.min(rect.y + rect.height, position.y));
  return distance(position, { x: closestX, y: closestY }) < radius;
}
