import { Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { palette } from "@/pixel-art/palette";

/**
 * One handcrafted tree: a tapered two-tone trunk with a lit edge and a root
 * flare, topped by a canopy built from a jittered ring of overlapping puffs
 * rendered in four passes (shadow silhouette, base, sun-side mid-tone,
 * highlight dabs) so it reads as a rounded, organic mass with real volume
 * instead of a few stacked circles. Shared by the Home background and the
 * Lost Sheep world so every tree in the game is built the same way. Draws
 * into `target` if given, for callers batching many trees per draw call
 * (e.g. one shared Graphics per Y-band, for cheap approximate depth sorting).
 * If `canopyTarget` is given, the trunk is drawn into `target` (or a new
 * Graphics) while the canopy puffs go into `canopyTarget` instead — lets a
 * caller keep the trunk in a static always-below-characters layer while the
 * canopy lives in a Y-sortable layer, so the player can walk in front of or
 * behind the leafy part while the trunk never covers their feet.
 */
export function buildTree(
  x: number,
  baseY: number,
  rng: () => number,
  target?: Graphics,
  canopyTarget?: Graphics,
): Graphics {
  const g = target ?? new Graphics();
  const canopy = canopyTarget ?? g;
  const trunkHeight = 12 + rng() * 5;
  const trunkTopY = baseY - trunkHeight;

  // Root flare.
  g.poly([x - 4.5, baseY, x - 1.6, trunkTopY + 3, x + 1.6, trunkTopY + 3, x + 4.5, baseY]).fill(
    hexToNumber(palette.wood.dark),
  );
  g.rect(x - 2.3, trunkTopY, 2.5, trunkHeight).fill(hexToNumber(palette.wood.darker));
  g.rect(x + 0.2, trunkTopY, 2.3, trunkHeight).fill(hexToNumber(palette.wood.dark));
  g.rect(x + 1.2, trunkTopY, 0.9, trunkHeight * 0.75).fill(hexToNumber(palette.wood.light));

  const canopyY = trunkTopY + 3;
  const puffs: { dx: number; dy: number; r: number }[] = [];
  const ringCount = 7 + Math.floor(rng() * 3);
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2 + rng() * 0.5;
    const dist = 4 + rng() * 6.5;
    puffs.push({
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.62 - 4,
      r: 5 + rng() * 3.6,
    });
  }
  puffs.push({ dx: 0, dy: -8, r: 8.5 + rng() * 2 });

  for (const p of puffs) {
    canopy.circle(x + p.dx - 1, canopyY + p.dy + 2.2, p.r * 0.95).fill(hexToNumber(palette.foliage.shadow));
  }
  for (const p of puffs) {
    canopy.circle(x + p.dx, canopyY + p.dy, p.r * 0.86).fill(hexToNumber(palette.foliage.base));
  }
  for (const p of puffs) {
    if (p.dx > -2.5) {
      canopy.circle(x + p.dx + 1, canopyY + p.dy - 1.2, p.r * 0.52).fill(hexToNumber(palette.foliage.mid));
    }
  }
  const highlightPicks = puffs.filter((p) => p.dx > 1 && p.dy < -1).slice(0, 3);
  for (const p of highlightPicks) {
    canopy.circle(x + p.dx + 1.5, canopyY + p.dy - 2, p.r * 0.32).fill({
      color: hexToNumber(palette.foliage.highlight),
      alpha: 0.85,
    });
  }

  return g;
}

/**
 * A bare, leafless trunk with a few angular branches — the same tapered
 * two-tone trunk construction as `buildTree`, minus the canopy, for dead
 * trees scattered among the living ones.
 */
export function buildDeadTree(x: number, baseY: number, rng: () => number, target?: Graphics): Graphics {
  const g = target ?? new Graphics();
  const trunkHeight = 15 + rng() * 7;
  const trunkTopY = baseY - trunkHeight;
  const lean = (rng() - 0.5) * 3;

  g.poly([
    x - 4,
    baseY,
    x - 1.4 + lean * 0.3,
    trunkTopY + 3,
    x + 1.4 + lean * 0.3,
    trunkTopY + 3,
    x + 4,
    baseY,
  ]).fill(hexToNumber(palette.wood.dark));
  g.rect(x - 2 + lean * 0.5, trunkTopY, 2.2, trunkHeight).fill(hexToNumber(palette.wood.darker));
  g.rect(x + 0.2 + lean * 0.5, trunkTopY, 2, trunkHeight).fill(hexToNumber(palette.wood.dark));
  g.rect(x + 1 + lean * 0.5, trunkTopY, 0.7, trunkHeight * 0.7).fill(hexToNumber(palette.wood.light));

  const branchCount = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < branchCount; i++) {
    const branchY = trunkTopY + rng() * trunkHeight * 0.5;
    const side = rng() > 0.5 ? 1 : -1;
    const len = 4 + rng() * 5;
    const angle = 0.5 + rng() * 0.5;
    const bx = x + lean * 0.5 + side;
    const ex = bx + Math.sin(angle) * len * side;
    const ey = branchY - Math.cos(angle) * len;
    g.moveTo(bx, branchY)
      .lineTo(ex, ey)
      .stroke({ width: 1.2 + rng() * 0.6, color: hexToNumber(palette.wood.darker) });
    if (rng() > 0.5) {
      const fx = ex + Math.sin(angle + 0.6) * 3 * side;
      const fy = ey - Math.cos(angle + 0.6) * 3;
      g.moveTo(ex, ey)
        .lineTo(fx, fy)
        .stroke({ width: 0.8, color: hexToNumber(palette.wood.darker) });
    }
  }

  return g;
}

/**
 * A low clustered bush: same shadow/base/highlight foliage passes as a tree,
 * just squat and ground-hugging. Draws into `target` if given — bushes don't
 * need per-object Y-sorting against characters, so callers with many of them
 * can batch dozens into one shared Graphics instead of paying a draw call each.
 */
export function buildBush(x: number, y: number, rng: () => number, target?: Graphics): Graphics {
  const g = target ?? new Graphics();
  const puffs: { dx: number; dy: number; r: number }[] = [];
  const count = 4 + Math.floor(rng() * 2);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.6;
    const dist = 2.5 + rng() * 3.5;
    puffs.push({ dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist * 0.55 - 1.5, r: 3.2 + rng() * 2.2 });
  }

  for (const p of puffs) {
    g.circle(x + p.dx - 0.6, y + p.dy + 1.4, p.r * 0.95).fill(hexToNumber(palette.foliage.shadow));
  }
  for (const p of puffs) {
    g.circle(x + p.dx, y + p.dy, p.r * 0.85).fill(hexToNumber(palette.foliage.base));
  }
  for (const p of puffs.filter((p) => p.dx > -1)) {
    g.circle(x + p.dx + 0.6, y + p.dy - 0.8, p.r * 0.45).fill(hexToNumber(palette.foliage.mid));
  }

  return g;
}

/**
 * A weathered rock: an irregular jittered silhouette (not a symmetric
 * polygon), a cool shadow underside, a mid-tone body, a sun-catching facet,
 * and a small tuft of grass at the base to root it in the ground. Draws into
 * `target` if given, for the same batching reason as `buildBush`.
 */
export function buildRock(x: number, y: number, rng: () => number, scale = 1, target?: Graphics): Graphics {
  const g = target ?? new Graphics();
  const pointCount = 6 + Math.floor(rng() * 2);
  const baseR = 5 * scale;
  const points: number[] = [];
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const r = baseR * (0.75 + rng() * 0.5);
    points.push(x + Math.cos(angle) * r, y + Math.sin(angle) * r * 0.75);
  }

  g.poly(points).fill(0x5a584f);
  const shadowPoints: number[] = [];
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const r = baseR * (0.55 + rng() * 0.3);
    shadowPoints.push(x - baseR * 0.15 + Math.cos(angle) * r, y + baseR * 0.1 + Math.sin(angle) * r * 0.75);
  }
  g.poly(shadowPoints).fill(0x413f39);

  g.poly([
    x - baseR * 0.1,
    y - baseR * 0.5,
    x + baseR * 0.4,
    y - baseR * 0.35,
    x + baseR * 0.15,
    y - baseR * 0.05,
    x - baseR * 0.2,
    y - baseR * 0.15,
  ]).fill({ color: 0x8b8879, alpha: 0.9 });

  g.circle(x - baseR * 0.5, y + baseR * 0.55, baseR * 0.35).fill(hexToNumber(palette.foliage.base));
  g.circle(x - baseR * 0.35, y + baseR * 0.4, baseR * 0.22).fill(hexToNumber(palette.foliage.mid));

  return g;
}
