import type { Vector2 } from "@/engine/input";

export const WORLD_WIDTH = 2800;
export const WORLD_HEIGHT = 2000;

/** The sheep pen sits in the bottom-left of the world — the rescue route runs away from it toward the far corner. */
export const PEN = {
  x: 260,
  y: WORLD_HEIGHT - 460,
  width: 300,
  height: 190,
};

export const PEN_CENTER = {
  x: PEN.x + PEN.width / 2,
  y: PEN.y + PEN.height / 2,
};

/** The only opening in the fence — a gap in the south rail the player (and only the player) can pass through. */
export const GATE = {
  width: 34,
  get x() {
    return PEN_CENTER.x - this.width / 2;
  },
  y: PEN.y + PEN.height,
};

export const SHEPHERD_START = {
  x: PEN_CENTER.x,
  y: PEN.y + PEN.height - 28,
};

export const FLOCK_COUNT = 28;

export const FENCE_THICKNESS = 6;
const HALF_FENCE = FENCE_THICKNESS / 2;

/**
 * The fence as solid wall segments for player collision — four sides with a
 * gap left in the south wall for the gate. Wolves use the full `PEN` rect
 * instead (see engine collision usage in entities.ts) so they can never
 * slip through the gate the way the player can.
 */
export const PEN_WALLS = [
  // North
  { x: PEN.x - HALF_FENCE, y: PEN.y - HALF_FENCE, width: PEN.width + FENCE_THICKNESS, height: FENCE_THICKNESS },
  // South, left of the gate
  {
    x: PEN.x - HALF_FENCE,
    y: PEN.y + PEN.height - HALF_FENCE,
    width: GATE.x - PEN.x + HALF_FENCE,
    height: FENCE_THICKNESS,
  },
  // South, right of the gate
  {
    x: GATE.x + GATE.width,
    y: PEN.y + PEN.height - HALF_FENCE,
    width: PEN.x + PEN.width - (GATE.x + GATE.width) + HALF_FENCE,
    height: FENCE_THICKNESS,
  },
  // West
  { x: PEN.x - HALF_FENCE, y: PEN.y - HALF_FENCE, width: FENCE_THICKNESS, height: PEN.height + FENCE_THICKNESS },
  // East
  {
    x: PEN.x + PEN.width - HALF_FENCE,
    y: PEN.y - HALF_FENCE,
    width: FENCE_THICKNESS,
    height: PEN.height + FENCE_THICKNESS,
  },
];

/**
 * The lost sheep always starts here — a small rocky rise near the world's
 * top-right corner, at the far end of the rescue route. Fixed, never
 * randomized, so the trail and the terrain built around it are identical
 * every playthrough.
 */
export const LOST_SHEEP_START: Vector2 = {
  x: WORLD_WIDTH - 340,
  y: 300,
};

export interface JourneyPoint {
  x: number;
  y: number;
  /** 0 at the pen gate, 1 at the lost sheep's hill — progress along the rescue route. */
  t: number;
  /** Unit vector perpendicular to the route's direction of travel here — used to place footprints and flanking terrain evenly on either side of the corridor. */
  nx: number;
  ny: number;
}

const JOURNEY_ORIGIN: Vector2 = { x: PEN_CENTER.x, y: PEN.y + PEN.height + 40 };
const JOURNEY_TARGET: Vector2 = { x: LOST_SHEEP_START.x, y: LOST_SHEEP_START.y + 70 };
const JOURNEY_DX = JOURNEY_TARGET.x - JOURNEY_ORIGIN.x;
const JOURNEY_DY = JOURNEY_TARGET.y - JOURNEY_ORIGIN.y;
const JOURNEY_LENGTH = Math.hypot(JOURNEY_DX, JOURNEY_DY);
const JOURNEY_PERP = { x: -JOURNEY_DY / JOURNEY_LENGTH, y: JOURNEY_DX / JOURNEY_LENGTH };
/** How far the S-curve bulges away from the straight line between the pen and the hill. */
const JOURNEY_AMPLITUDE = 520;

function journeyPointAt(t: number): Vector2 {
  const clamped = Math.max(0, Math.min(1, t));
  // A single sine cycle across the straight pen-to-hill line: it bulges one
  // way, then the other, anchored exactly at both ends (sin is 0 at t=0 and
  // t=1) — the natural, deterministic S shape the route is built around.
  const offset = JOURNEY_AMPLITUDE * Math.sin(clamped * Math.PI * 2);
  return {
    x: JOURNEY_ORIGIN.x + JOURNEY_DX * clamped + JOURNEY_PERP.x * offset,
    y: JOURNEY_ORIGIN.y + JOURNEY_DY * clamped + JOURNEY_PERP.y * offset,
  };
}

/**
 * The rescue route from the pen gate to the lost sheep's hill, resampled to
 * roughly even spacing along the curve (not even in `t`) so footprints,
 * flanking terrain and nearest-path checks all get uniform density. Built
 * once at module load with no randomness — always identical, so the trail
 * and the terrain guiding it never change between playthroughs.
 */
export const JOURNEY_PATH: JourneyPoint[] = (() => {
  const steps = 1400;
  const fine: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const { x, y } = journeyPointAt(t);
    fine.push({ x, y, t });
  }

  const spacing = 26;
  const resampled: JourneyPoint[] = [{ ...fine[0], nx: 0, ny: 0 }];
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
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    resampled[i].nx = -dy / len;
    resampled[i].ny = dx / len;
  }

  return resampled;
})();

/** The route point nearest a given progress fraction `t` (0 = pen, 1 = hill). */
export function journeyAt(t: number): JourneyPoint {
  const clamped = Math.max(0, Math.min(1, t));
  let closest = JOURNEY_PATH[0];
  let bestDiff = Infinity;
  for (const p of JOURNEY_PATH) {
    const diff = Math.abs(p.t - clamped);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = p;
    }
  }
  return closest;
}

/** Nearest point on the rescue route to `(x, y)` — keeps the corridor walkable and lets terrain thicken as it nears the hill. */
export function nearestJourneyPoint(x: number, y: number): { distance: number; t: number } {
  let best = Infinity;
  let bestT = 0;
  for (const p of JOURNEY_PATH) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < best) {
      best = d;
      bestT = p.t;
    }
  }
  return { distance: best, t: bestT };
}
