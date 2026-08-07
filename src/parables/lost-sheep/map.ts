import type { Vector2 } from "@/engine/input";
import type { Rect } from "@/engine/collision";

export const WORLD_WIDTH = 2800;
export const WORLD_HEIGHT = 2000;

/**
 * The sheep pen sits in the bottom-left of the world — the rescue route runs
 * away from it toward the far corner. It's built from two overlapping rects
 * (`PEN` + `PEN_EXTENSION`) rather than one rectangle, so the fence traces an
 * L-shaped, hand-built-looking footprint instead of a perfect box. The
 * extension is where the shelter/hay/wood live — a working corner added onto
 * the main pen, not a symmetric addition.
 */
export const PEN = {
  x: 260,
  y: WORLD_HEIGHT - 460,
  width: 260,
  height: 190,
};

export const PEN_EXTENSION = {
  x: PEN.x + PEN.width,
  y: PEN.y + 35,
  width: 100,
  height: 120,
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

/** A thin solid rect spanning two axis-aligned points, `thickness` wide/tall — a wall segment for player collision. */
function wallBetween(x1: number, y1: number, x2: number, y2: number, thickness = FENCE_THICKNESS): Rect {
  const half = thickness / 2;
  if (y1 === y2) {
    const x = Math.min(x1, x2);
    return { x: x - half, y: y1 - half, width: Math.abs(x2 - x1) + thickness, height: thickness };
  }
  const y = Math.min(y1, y2);
  return { x: x1 - half, y: y - half, width: thickness, height: Math.abs(y2 - y1) + thickness };
}

/**
 * The fence as solid wall segments for player collision — traces the
 * L-shaped union of `PEN` and `PEN_EXTENSION` clockwise from the pen's
 * north-west corner, with a gap left in the south rail for the gate. Wolves
 * use `isNearPen` instead (see entities.ts) so they can never slip through
 * the gate the way the player can.
 */
export const PEN_WALLS: Rect[] = [
  wallBetween(PEN.x, PEN.y, PEN.x + PEN.width, PEN.y), // north
  wallBetween(PEN.x + PEN.width, PEN.y, PEN.x + PEN.width, PEN_EXTENSION.y), // east, above the extension
  wallBetween(PEN_EXTENSION.x, PEN_EXTENSION.y, PEN_EXTENSION.x + PEN_EXTENSION.width, PEN_EXTENSION.y), // extension north
  wallBetween(
    PEN_EXTENSION.x + PEN_EXTENSION.width,
    PEN_EXTENSION.y,
    PEN_EXTENSION.x + PEN_EXTENSION.width,
    PEN_EXTENSION.y + PEN_EXTENSION.height,
  ), // extension east
  wallBetween(
    PEN_EXTENSION.x + PEN_EXTENSION.width,
    PEN_EXTENSION.y + PEN_EXTENSION.height,
    PEN_EXTENSION.x,
    PEN_EXTENSION.y + PEN_EXTENSION.height,
  ), // extension south
  wallBetween(PEN.x + PEN.width, PEN_EXTENSION.y + PEN_EXTENSION.height, PEN.x + PEN.width, PEN.y + PEN.height), // east, below the extension
  wallBetween(PEN.x, PEN.y + PEN.height, GATE.x, PEN.y + PEN.height), // south, left of the gate
  wallBetween(GATE.x + GATE.width, PEN.y + PEN.height, PEN.x + PEN.width, PEN.y + PEN.height), // south, right of the gate
  wallBetween(PEN.x, PEN.y, PEN.x, PEN.y + PEN.height), // west
];

/** True if `(x, y)` sits within `margin` of the pen's L-shaped footprint — keeps terrain/spawns clear of the enclosure. */
export function isNearPen(x: number, y: number, margin: number): boolean {
  const inMain = x > PEN.x - margin && x < PEN.x + PEN.width + margin && y > PEN.y - margin && y < PEN.y + PEN.height + margin;
  const inExt =
    x > PEN_EXTENSION.x - margin &&
    x < PEN_EXTENSION.x + PEN_EXTENSION.width + margin &&
    y > PEN_EXTENSION.y - margin &&
    y < PEN_EXTENSION.y + PEN_EXTENSION.height + margin;
  return inMain || inExt;
}

/** The small stable inside the pen's extension — solid, blocks the player like a wall. */
export const SHELTER: Rect = {
  x: PEN_EXTENSION.x + 15,
  y: PEN_EXTENSION.y + 20,
  width: 68,
  height: 46,
};

/** Every rect the shepherd collides with inside/around the pen: the fence plus the shelter. */
export const PEN_COLLISION_WALLS: Rect[] = [...PEN_WALLS, SHELTER];

/** The hay pile and wood details inside the pen — round obstacles, merged into the shepherd's per-frame obstacle list. */
export const PEN_DETAIL_OBSTACLES: { x: number; y: number; radius: number }[] = [
  { x: PEN_EXTENSION.x + 50, y: SHELTER.y + SHELTER.height + 20, radius: 15 }, // hay pile, just south of the shelter
  { x: PEN.x + 32, y: PEN.y + PEN.height - 22, radius: 10 }, // stacked firewood, tucked in the main pen's corner
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
  /** 0 at the path's start, 1 at its end — progress along this particular route. */
  t: number;
  /** Unit vector perpendicular to the route's direction of travel here — used to place footprints and flanking terrain evenly on either side of the corridor. */
  nx: number;
  ny: number;
}

/**
 * Builds one deterministic curved route between two points: a single sine
 * cycle offset perpendicular to the straight line between them (anchored at
 * both ends, since sin is 0 at t=0 and t=1), resampled to roughly even
 * spacing along the curve. No randomness — the same origin/target/amplitude
 * always produce the exact same path, which is what lets the trail and the
 * terrain built around each route stay identical every playthrough.
 */
function buildCurvePath(origin: Vector2, target: Vector2, amplitude: number, steps = 700, spacing = 26): JourneyPoint[] {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const length = Math.hypot(dx, dy) || 1;
  const perp = { x: -dy / length, y: dx / length };

  const fine: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const offset = amplitude * Math.sin(t * Math.PI * 2);
    fine.push({ x: origin.x + dx * t + perp.x * offset, y: origin.y + dy * t + perp.y * offset, t });
  }

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
    const ddx = next.x - prev.x;
    const ddy = next.y - prev.y;
    const len = Math.hypot(ddx, ddy) || 1;
    resampled[i].nx = -ddy / len;
    resampled[i].ny = ddx / len;
  }

  return resampled;
}

const JOURNEY_ORIGIN: Vector2 = { x: PEN_CENTER.x, y: PEN.y + PEN.height + 40 };
const JOURNEY_TARGET: Vector2 = { x: LOST_SHEEP_START.x, y: LOST_SHEEP_START.y + 70 };
/** How far the true route's S-curve bulges away from the straight line between the pen and the hill. */
const JOURNEY_AMPLITUDE = 520;

/**
 * The TRUE rescue route from the pen gate to the lost sheep's hill — the
 * only route the footprint/blood trail follows (see trail.ts). Everything
 * else in the world (decoy paths, flanking forest) is built around it, but
 * only this path is "the way."
 */
export const JOURNEY_PATH: JourneyPoint[] = buildCurvePath(JOURNEY_ORIGIN, JOURNEY_TARGET, JOURNEY_AMPLITUDE, 1400, 26);

/** The point on `JOURNEY_PATH` nearest a given progress fraction `t` (0 = pen, 1 = hill). */
export function journeyAt(t: number): JourneyPoint {
  return pointAtT(JOURNEY_PATH, t);
}

function pointAtT(path: JourneyPoint[], t: number): JourneyPoint {
  const clamped = Math.max(0, Math.min(1, t));
  let closest = path[0];
  let bestDiff = Infinity;
  for (const p of path) {
    const diff = Math.abs(p.t - clamped);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = p;
    }
  }
  return closest;
}

function atOffset(point: JourneyPoint, dist: number): Vector2 {
  return { x: point.x + point.nx * dist, y: point.y + point.ny * dist };
}

// ---------------------------------------------------------------------------
// Decoy routes — branch off the true path so the world reads as explored,
// not corridor-followed. Neither carries footprints or blood (see trail.ts):
// only JOURNEY_PATH does, so the player learns the trail is the one that
// matters. Both are also where the sentinel wolves (below) mostly live.
// ---------------------------------------------------------------------------

const DEADEND_ANCHOR = journeyAt(0.22);
const DEADEND_TARGET = atOffset(DEADEND_ANCHOR, -480);
/** A spur that wanders off the true route and simply stops — nothing to find, guarded by wolves as a deterrent. */
export const DECOY_DEADEND_PATH: JourneyPoint[] = buildCurvePath(
  { x: DEADEND_ANCHOR.x, y: DEADEND_ANCHOR.y },
  DEADEND_TARGET,
  110,
  500,
  24,
);

const LOOP_START = journeyAt(0.46);
const LOOP_END = journeyAt(0.8);
/** A longer alternate route that swings wide of the true path — passable for a while, but it runs into the river with no bridge of its own. */
export const DECOY_LOOP_PATH: JourneyPoint[] = buildCurvePath(
  { x: LOOP_START.x, y: LOOP_START.y },
  { x: LOOP_END.x, y: LOOP_END.y },
  380,
  700,
  26,
);

/** Every walkable corridor in the world — used to keep each one clear of trees/rocks and to thicken the forest flanking it. Only `JOURNEY_PATH` (index 0) gets footprints. */
export const CORRIDOR_PATHS: JourneyPoint[][] = [JOURNEY_PATH, DECOY_DEADEND_PATH, DECOY_LOOP_PATH];

/** Nearest point on ANY corridor to `(x, y)`, plus that corridor's local progress `t` — keeps every route walkable, not just the true one. */
export function nearestCorridorPoint(x: number, y: number): { distance: number; t: number } {
  let best = Infinity;
  let bestT = 0;
  for (const path of CORRIDOR_PATHS) {
    for (const p of path) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < best) {
        best = d;
        bestT = p.t;
      }
    }
  }
  return { distance: best, t: bestT };
}

// ---------------------------------------------------------------------------
// River — an uncrossable band the true route fords via a single wooden
// bridge. Both the bridge's x-position and the river's y-position are
// derived from the true path itself (not hardcoded), so they always line up
// with wherever the route actually crosses.
// ---------------------------------------------------------------------------

const RIVER_CROSSING = journeyAt(0.5);
const RIVER_HALF_HEIGHT = 40;

export const RIVER = {
  yTop: RIVER_CROSSING.y - RIVER_HALF_HEIGHT,
  yBottom: RIVER_CROSSING.y + RIVER_HALF_HEIGHT,
  xStart: 150,
  xEnd: WORLD_WIDTH - 150,
};

export const BRIDGE = {
  centerX: RIVER_CROSSING.x,
  width: 100,
  get xStart() {
    return this.centerX - this.width / 2;
  },
  get xEnd() {
    return this.centerX + this.width / 2;
  },
};

/** The two river banks either side of the bridge — solid for everyone, player and wolves alike. Water cannot be crossed. */
export const RIVER_WALLS: Rect[] = [
  { x: RIVER.xStart, y: RIVER.yTop, width: BRIDGE.xStart - RIVER.xStart, height: RIVER.yBottom - RIVER.yTop },
  { x: BRIDGE.xEnd, y: RIVER.yTop, width: RIVER.xEnd - BRIDGE.xEnd, height: RIVER.yBottom - RIVER.yTop },
];

// ---------------------------------------------------------------------------
// Sentinel wolves — fixed placements away from the guarded hill, scattered
// along the decoy routes and the true route's deep-forest stretch. Each
// patrols a small area or stands still until the shepherd enters its
// detection radius, at which point it wakes and gives chase permanently
// (see entities.ts `Wolf.sentinel`/`aggroed`). They make the decoys feel
// actively risky, not just visually different, which is what teaches the
// player to trust the footprints.
// ---------------------------------------------------------------------------

export interface SentinelWolfSpec {
  x: number;
  y: number;
  style: "patrol" | "still";
  detectionRadius: number;
}

function pointAtFraction(path: JourneyPoint[], fraction: number): JourneyPoint {
  const index = Math.max(0, Math.min(path.length - 1, Math.round(fraction * (path.length - 1))));
  return path[index];
}

export const SENTINEL_WOLVES: SentinelWolfSpec[] = [
  { ...atOffset(pointAtFraction(DECOY_DEADEND_PATH, 0.42), 28), style: "patrol", detectionRadius: 75 },
  { ...atOffset(pointAtFraction(DECOY_DEADEND_PATH, 0.92), 0), style: "still", detectionRadius: 70 },
  { ...atOffset(pointAtFraction(DECOY_LOOP_PATH, 0.28), -26), style: "still", detectionRadius: 70 },
  { ...atOffset(pointAtFraction(DECOY_LOOP_PATH, 0.62), 26), style: "patrol", detectionRadius: 80 },
  { ...atOffset(journeyAt(0.76), 150), style: "still", detectionRadius: 75 },
  { ...atOffset(journeyAt(0.88), -150), style: "patrol", detectionRadius: 80 },
];
