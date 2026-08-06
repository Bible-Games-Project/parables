import { Container, Graphics } from "pixi.js";
import { createRng } from "@/pixel-art/prng";
import type { JourneyPoint } from "@/parables/lost-sheep/map";

const FOOTPRINT_COLOR = 0x5a4632;
const BLOOD_DARK = 0x6e1712;
const BLOOD_MID = 0x9c2a1f;

/**
 * Draws the sheep's trail along the rescue route: a faint worn dirt line
 * underneath, alternating cloven-hoof footprints on top, and blood drops
 * that start appearing partway along and grow steadily more frequent toward
 * the hill — the wounded sheep weakening the closer it gets to where it
 * finally collapsed. One fixed seed, so the trail is identical every
 * playthrough and always readable as the way to go.
 */
export function buildJourneyTrail(world: Container, path: JourneyPoint[]): void {
  const wornGround = new Graphics();
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    wornGround.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 18, color: 0xc7a874, alpha: 0.12, cap: "round" });
  }
  world.addChild(wornGround);

  const footprints = new Graphics();
  const blood = new Graphics();
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
      drawBloodDrop(blood, fx + (rng() - 0.5) * 10, fy + (rng() - 0.5) * 10, rng);
    }
  }
  world.addChild(footprints);
  world.addChild(blood);
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
