import { Container, Graphics } from "pixi.js";
import { createRng } from "@/pixel-art/prng";
import type { JourneyPoint } from "@/parables/lost-sheep/map";

const FOOTPRINT_COLOR = 0x5a4632;
const BLOOD_DARK = 0x6e1712;
const BLOOD_MID = 0x9c2a1f;

export interface TrailResult {
  /** World positions of every blood drop drawn, for the one-time "first blood discovered" narrative beat. */
  bloodPositions: { x: number; y: number }[];
}

/**
 * Draws the sheep's trail along the true rescue route: alternating
 * cloven-hoof footprints, and blood drops that start appearing partway
 * along and grow steadily more frequent toward the hill — the wounded sheep
 * weakening the closer it gets to where it finally collapsed. Just the
 * footprint/blood sprites themselves, no surrounding decoration. One fixed
 * seed, so the trail is identical every playthrough and always readable as
 * the way to go.
 */
export function buildJourneyTrail(world: Container, path: JourneyPoint[]): TrailResult {
  const footprints = new Graphics();
  const blood = new Graphics();
  const bloodPositions: { x: number; y: number }[] = [];
  const rng = createRng(7331);
  let side = 1;
  for (const p of path) {
    if (p.t < 0.015 || p.t > 0.985) continue;
    side *= -1;
    const fx = p.x + p.nx * 4.5 * side;
    const fy = p.y + p.ny * 4.5 * side;
    drawHoofprint(footprints, fx, fy, p.nx, p.ny);

    // Blood is silent for the first stretch (a peaceful start), then grows
    // steadily more frequent the closer the trail gets to the sheep.
    const bloodChance = p.t < 0.22 ? 0 : (p.t - 0.22) / 0.78;
    if (rng() < bloodChance * 0.85) {
      const bx = fx + (rng() - 0.5) * 10;
      const by = fy + (rng() - 0.5) * 10;
      drawBloodDrop(blood, bx, by, rng);
      bloodPositions.push({ x: bx, y: by });
    }
  }
  world.addChild(footprints);
  world.addChild(blood);

  return { bloodPositions };
}

function drawHoofprint(g: Graphics, x: number, y: number, nx: number, ny: number): void {
  // The tangent (perpendicular to the flank normal) points the way the sheep was walking.
  const tx = -ny;
  const ty = nx;
  g.ellipse(x - tx * 1.3, y - ty * 1.3, 1.5, 1.1).fill({ color: FOOTPRINT_COLOR, alpha: 0.4 });
  g.ellipse(x + tx * 1.3, y + ty * 1.3, 1.5, 1.1).fill({ color: FOOTPRINT_COLOR, alpha: 0.4 });
}

function drawBloodDrop(g: Graphics, x: number, y: number, rng: () => number): void {
  const r = 1 + rng() * 1.6;
  g.circle(x, y, r).fill({ color: BLOOD_DARK, alpha: 0.75 });
  g.circle(x - r * 0.25, y - r * 0.25, r * 0.4).fill({ color: BLOOD_MID, alpha: 0.6 });
}
