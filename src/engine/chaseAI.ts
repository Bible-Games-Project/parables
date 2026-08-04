import type { Vector2 } from "@/engine/input";
import { distance, normalize } from "@/engine/collision";

export interface ChaseCandidate {
  id: string;
  position: Vector2;
}

/** Picks whichever candidate is currently closest to `from` — used by threats that chase the nearest of several targets. */
export function pickNearestTarget<T extends ChaseCandidate>(from: Vector2, candidates: T[]): T | undefined {
  let closest: T | undefined;
  let closestDistance = Infinity;
  for (const candidate of candidates) {
    const d = distance(from, candidate.position);
    if (d < closestDistance) {
      closestDistance = d;
      closest = candidate;
    }
  }
  return closest;
}

/** Steers `current` toward `target` at `speed` units/second, for `dt` seconds. */
export function steerToward(current: Vector2, target: Vector2, speed: number, dt: number): Vector2 {
  const direction = normalize({ x: target.x - current.x, y: target.y - current.y });
  return { x: current.x + direction.x * speed * dt, y: current.y + direction.y * speed * dt };
}
