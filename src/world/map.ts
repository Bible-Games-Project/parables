import type { Vector2 } from "@/engine/input";

/**
 * Israel is deliberately small and dense — a handcrafted hub the player
 * wanders through, not a huge empty map. Every named location below is a
 * fixed point (or an offset from the road), so the whole layout is
 * deterministic and identical every time the player enters the world.
 */
export const WORLD_WIDTH = 1500;
export const WORLD_HEIGHT = 1100;

export const JESUS_START: Vector2 = { x: 700, y: 1040 };
const ROAD_END: Vector2 = { x: 640, y: 90 };
/** How far the ancient road's gentle S-curve bulges from the straight line between its ends. */
const ROAD_AMPLITUDE = 220;

export interface RoadPoint {
  x: number;
  y: number;
  /** 0 at the south entrance, 1 at the northern hill road's end. */
  t: number;
  /** Unit vector perpendicular to the road here — used to place everything that flanks it. */
  nx: number;
  ny: number;
}

/**
 * The ancient road connecting every location in Israel: one deterministic
 * sine-offset curve (identical technique to the Lost Sheep rescue route),
 * resampled to even spacing. No randomness, so the road and everything
 * placed along it never change between sessions.
 */
export const ROAD_PATH: RoadPoint[] = (() => {
  const dx = ROAD_END.x - JESUS_START.x;
  const dy = ROAD_END.y - JESUS_START.y;
  const length = Math.hypot(dx, dy) || 1;
  const perp = { x: -dy / length, y: dx / length };

  const steps = 900;
  const fine: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const offset = ROAD_AMPLITUDE * Math.sin(t * Math.PI * 2);
    fine.push({ x: JESUS_START.x + dx * t + perp.x * offset, y: JESUS_START.y + dy * t + perp.y * offset, t });
  }

  const spacing = 20;
  const resampled: RoadPoint[] = [{ ...fine[0], nx: 0, ny: 0 }];
  let accum = 0;
  for (let i = 1; i < fine.length; i++) {
    const prev = fine[i - 1];
    const cur = fine[i];
    accum += Math.hypot(cur.x - prev.x, cur.y - prev.y);
    if (accum >= spacing) {
      resampled.push({ ...cur, nx: 0, ny: 0 });
      accum = 0;
    }
  }
  for (let i = 0; i < resampled.length; i++) {
    const prev = resampled[Math.max(0, i - 1)];
    const next = resampled[Math.min(resampled.length - 1, i + 1)];
    const ddx = next.x - prev.x;
    const ddy = next.y - prev.y;
    const len = Math.hypot(ddx, ddy) || 1;
    resampled[i].nx = -ddy / len;
    resampled[i].ny = ddx / len;
  }
  return resampled;
})();

export function roadAt(t: number): RoadPoint {
  const clamped = Math.max(0, Math.min(1, t));
  let closest = ROAD_PATH[0];
  let bestDiff = Infinity;
  for (const p of ROAD_PATH) {
    const diff = Math.abs(p.t - clamped);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = p;
    }
  }
  return closest;
}

export function nearestRoadPoint(x: number, y: number): { distance: number; t: number } {
  let best = Infinity;
  let bestT = 0;
  for (const p of ROAD_PATH) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < best) {
      best = d;
      bestT = p.t;
    }
  }
  return { distance: best, t: bestT };
}

function atOffset(point: RoadPoint, dist: number): Vector2 {
  return { x: point.x + point.nx * dist, y: point.y + point.ny * dist };
}

// ---------------------------------------------------------------------------
// Named locations — every one anchored to the road, not scattered randomly.
// ---------------------------------------------------------------------------

/** Where the shepherd's encounter (-> The Lost Sheep) lives. */
export const SHEPHERD_CAMP: Vector2 = atOffset(roadAt(0.15), 60);
export const OLIVE_GROVE: Vector2 = atOffset(roadAt(0.3), -190);
export const VINEYARD: Vector2 = atOffset(roadAt(0.62), -180);
export const WHEAT_FIELD: Vector2 = atOffset(roadAt(0.57), 200);
export const FARMHOUSE: Vector2 = atOffset(roadAt(0.78), 160);
export const FOREST_PATCH: Vector2 = atOffset(roadAt(0.83), -180);
export const HILL_VIEWPOINT: Vector2 = atOffset(roadAt(0.97), 10);

const RIVER_CROSSING = roadAt(0.46);
const RIVER_HALF_HEIGHT = 34;

/** A small river the road fords via one wooden bridge — the bridge starts blocked (see gates.ts) until the player earns enough stars to have it repaired. */
export const RIVER = {
  yTop: RIVER_CROSSING.y - RIVER_HALF_HEIGHT,
  yBottom: RIVER_CROSSING.y + RIVER_HALF_HEIGHT,
  xStart: 60,
  xEnd: WORLD_WIDTH - 60,
};

export const BRIDGE = {
  centerX: RIVER_CROSSING.x,
  width: 70,
  get xStart() {
    return this.centerX - this.width / 2;
  },
  get xEnd() {
    return this.centerX + this.width / 2;
  },
};
