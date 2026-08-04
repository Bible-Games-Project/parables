export const WORLD_WIDTH = 2800;
export const WORLD_HEIGHT = 2000;

export const PEN = {
  x: WORLD_WIDTH / 2 - 150,
  y: WORLD_HEIGHT / 2 - 95,
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
 * Six distant regions the lost sheep can wander off into, named the way the
 * maintainer described them (no North/South alone — only the diagonals plus
 * due East/West). Angles are in the screen convention (0 = east, clockwise,
 * since +y is down).
 */
export const SHEEP_SPAWN_REGIONS = [
  { name: "NE", angle: -45, spread: 24 },
  { name: "NW", angle: -135, spread: 24 },
  { name: "SE", angle: 45, spread: 24 },
  { name: "SW", angle: 135, spread: 24 },
  { name: "E", angle: 0, spread: 20 },
  { name: "W", angle: 180, spread: 20 },
] as const;

export const SHEEP_SPAWN_MIN_DISTANCE = 480;
export const SHEEP_SPAWN_MAX_DISTANCE = 850;

/** Picks a random distant region and a random point inside it, clamped to the world — real randomness so every run differs. */
export function pickLostSheepSpawn(): { x: number; y: number } {
  const region = SHEEP_SPAWN_REGIONS[Math.floor(Math.random() * SHEEP_SPAWN_REGIONS.length)];
  const angleDeg = region.angle + (Math.random() * 2 - 1) * region.spread;
  const angle = (angleDeg * Math.PI) / 180;
  const distance = SHEEP_SPAWN_MIN_DISTANCE + Math.random() * (SHEEP_SPAWN_MAX_DISTANCE - SHEEP_SPAWN_MIN_DISTANCE);

  const margin = 60;
  return {
    x: Math.max(margin, Math.min(WORLD_WIDTH - margin, PEN_CENTER.x + Math.cos(angle) * distance)),
    y: Math.max(margin, Math.min(WORLD_HEIGHT - margin, PEN_CENTER.y + Math.sin(angle) * distance)),
  };
}
