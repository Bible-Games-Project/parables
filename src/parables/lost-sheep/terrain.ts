import { Container, Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { createRng } from "@/pixel-art/prng";
import { palette } from "@/pixel-art/palette";
import { buildBush, buildRock, buildTree } from "@/pixel-art/foliage";
import type { Rect } from "@/engine/collision";
import {
  BRIDGE,
  CORRIDOR_PATHS,
  RIVER,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  isNearPen,
  journeyAt,
  nearestCorridorPoint,
} from "@/parables/lost-sheep/map";

/** How close to any corridor's centerline nothing is allowed to grow — keeps every route walkable end to end. */
const CORRIDOR_CLEAR = 58;

export interface TerrainObstacle {
  x: number;
  y: number;
  radius: number;
}

/** Wider than the trunk (~4.5-unit half-width), short enough to stay clear of the
 * canopy above — a physical footprint at ground level, not a hitbox for the whole
 * tree. Used alongside (not instead of) the tree's existing circular
 * `TerrainObstacle`: the circle keeps blocking wolves exactly as before, this rect
 * additionally stops the shepherd from ever crossing straight through a trunk in
 * a single frame while still letting them walk around it from any side. */
const TREE_COLLIDER_HALF_WIDTH = 6;
const TREE_COLLIDER_TOP = 7;
const TREE_COLLIDER_BOTTOM = 1;

function treeFootprint(x: number, baseY: number): Rect {
  return {
    x: x - TREE_COLLIDER_HALF_WIDTH,
    y: baseY - TREE_COLLIDER_TOP,
    width: TREE_COLLIDER_HALF_WIDTH * 2,
    height: TREE_COLLIDER_TOP + TREE_COLLIDER_BOTTOM,
  };
}

const FLOWER_VARIANTS = [
  { petal: palette.flowers.poppyPetal, center: palette.flowers.poppyCenter },
  { petal: palette.flowers.daisyPetal, center: palette.flowers.daisyCenter },
  { petal: palette.flowers.violetPetal, center: palette.flowers.violetCenter },
];

function drawFlower(g: Graphics, x: number, y: number, variant: (typeof FLOWER_VARIANTS)[number]): void {
  const petal = hexToNumber(variant.petal);
  const center = hexToNumber(variant.center);
  g.circle(x + 0.4, y + 0.6, 1.1).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.28 });
  g.circle(x, y - 1, 0.9).fill(petal);
  g.circle(x, y + 1, 0.9).fill(petal);
  g.circle(x - 1, y, 0.9).fill(petal);
  g.circle(x + 1, y, 0.9).fill(petal);
  g.circle(x, y, 0.7).fill(center);
}

/**
 * A tree's canopy, sorted individually by its own ground-contact y (never a
 * shared band) — the rule every tall object in this world follows: only the
 * BASE decides depth order, so the player reliably renders in front of a
 * tree the instant their feet are below where it actually stands, and
 * behind it otherwise. The trunk still goes into the static always-below
 * batch so it never covers anyone's feet.
 */
function addSortedTree(x: number, baseY: number, rng: () => number, trunkBatch: Graphics, dynamicLayer: Container): void {
  const canopy = new Graphics();
  buildTree(x, baseY, rng, trunkBatch, canopy);
  canopy.zIndex = baseY;
  dynamicLayer.addChild(canopy);
}

/** An irregular, unclimbable hill mass — a jittered polygon silhouette (not a clean ellipse) with a rocky base ring, solid across its whole footprint so it truly can't be walked onto, sorted like every other tall object by its own base y. */
function buildHillMass(
  cx: number,
  cy: number,
  seed: number,
  radius: number,
  dynamicLayer: Container,
  obstacles: TerrainObstacle[],
): void {
  const rng = createRng(seed);
  const pointCount = 10 + Math.floor(rng() * 4);
  const radii: number[] = [];
  for (let i = 0; i < pointCount; i++) radii.push(radius * (0.72 + rng() * 0.48));

  const g = new Graphics();
  const shadowPoints: number[] = [];
  const rockPoints: number[] = [];
  const capPoints: number[] = [];
  const highPoints: number[] = [];
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle) * 0.74;
    shadowPoints.push(cx + cos * radii[i] * 1.08 + 3, cy + sin * radii[i] * 1.08 + 6);
    rockPoints.push(cx + cos * radii[i] * 1.04, cy + sin * radii[i] * 1.04 + 3);
    capPoints.push(cx + cos * radii[i], cy + sin * radii[i]);
    highPoints.push(cx + cos * radii[i] * 0.78, cy + sin * radii[i] * 0.78 - 3);
  }
  g.poly(shadowPoints).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.32 });
  g.poly(rockPoints).fill(0x5a584f);
  g.poly(capPoints).fill(hexToNumber(palette.grass.dark));
  g.poly(highPoints).fill(hexToNumber(palette.grass.base));
  g.ellipse(cx - radius * 0.22, cy - radius * 0.32, radius * 0.38, radius * 0.2).fill({
    color: hexToNumber(palette.grass.light),
    alpha: 0.4,
  });
  for (let i = 0; i < 3; i++) {
    const angle = rng() * Math.PI * 2;
    const r = radius * (0.82 + rng() * 0.2);
    buildRock(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.74 + 4, rng, 0.75 + rng() * 0.5, g);
  }

  g.zIndex = cy + radius * 0.74;
  dynamicLayer.addChild(g);

  // Collision fills the whole footprint (not just the rim) with overlapping circles, so no part of the hill can be walked onto.
  const step = radius * 0.55;
  for (let ox = -radius; ox <= radius; ox += step) {
    for (let oy = -radius * 0.74; oy <= radius * 0.74; oy += step) {
      if (Math.hypot(ox / radius, oy / (radius * 0.74)) > 0.9) continue;
      obstacles.push({ x: cx + ox, y: cy + oy, radius: step * 0.62 });
    }
  }
}

/** The river band and its single wooden bridge — the true route's one crossing point. Purely visual; `RIVER_WALLS` (map.ts) is what actually blocks movement. */
function buildRiver(world: Container): void {
  const { yTop, yBottom, xStart, xEnd } = RIVER;
  const water = new Graphics();
  water.rect(xStart, yTop - 7, xEnd - xStart, yBottom - yTop + 14).fill({ color: 0x4a3b24, alpha: 0.4 });
  water.rect(xStart, yTop, xEnd - xStart, yBottom - yTop).fill(hexToNumber(palette.water.deep));
  water.rect(xStart, yTop + 6, xEnd - xStart, yBottom - yTop - 12).fill(hexToNumber(palette.water.base));

  const rippleRng = createRng(6767);
  for (let x = xStart; x < xEnd; x += 14) {
    if (x > BRIDGE.xStart - 10 && x < BRIDGE.xEnd + 10) continue;
    const ry = yTop + 10 + rippleRng() * (yBottom - yTop - 20);
    const len = 8 + rippleRng() * 14;
    water
      .moveTo(x, ry)
      .lineTo(x + len, ry + (rippleRng() - 0.5) * 4)
      .stroke({ width: 1.2, color: hexToNumber(palette.water.light), alpha: 0.35 });
  }
  for (let x = xStart; x < xEnd; x += 30) {
    if (x > BRIDGE.xStart - 10 && x < BRIDGE.xEnd + 10) continue;
    const ry = yTop + 8 + rippleRng() * (yBottom - yTop - 16);
    water.ellipse(x, ry, 3 + rippleRng() * 3, 1).fill({ color: hexToNumber(palette.water.foam), alpha: 0.22 });
  }
  world.addChild(water);

  const bridge = new Graphics();
  const bx1 = BRIDGE.xStart;
  const bx2 = BRIDGE.xEnd;
  bridge.rect(bx1 - 5, yTop - 5, bx2 - bx1 + 10, yBottom - yTop + 10).fill({ color: 0x1f1108, alpha: 0.3 });
  bridge.rect(bx1, yTop - 2, bx2 - bx1, yBottom - yTop + 4).fill(hexToNumber(palette.fence.base));
  const plankRng = createRng(5959);
  for (let y = yTop; y < yBottom; y += 6) {
    const shade = plankRng() > 0.5 ? palette.fence.darkest : palette.fence.dark;
    bridge.rect(bx1, y, bx2 - bx1, 1.4).fill({ color: hexToNumber(shade), alpha: 0.4 });
  }
  for (const railX of [bx1, bx2 - 3]) {
    bridge.rect(railX, yTop - 5, 3, yBottom - yTop + 10).fill(hexToNumber(palette.fence.dark));
    for (let y = yTop; y <= yBottom; y += 14) {
      bridge.rect(railX - 1, y - 2, 5, 4).fill(hexToNumber(palette.fence.mid));
    }
  }
  world.addChild(bridge);
}

export interface TerrainResult {
  obstacles: TerrainObstacle[];
  /** Rect footprints (currently just tree bases) for `resolveCircleVsRect` — the shepherd should collide with these; keeps the wider, height-limited collision shape separate from the plain circular `obstacles` that wolves/sheep still use unchanged. */
  walls: Rect[];
  /** A Y-sortable Container (already added to `world`) holding tree canopies and large rocks/hills. The caller should add the shepherd/sheep/wolves/flock into it too, and keep each entity's zIndex equal to its y position, so tall scenery correctly layers in front of or behind moving characters. */
  dynamicLayer: Container;
}

/** Builds the large outdoor world the shepherd searches: ground, dappled texture, flowers, river, and scattered trees/bushes/rocks/hills flanking every walkable corridor. Returns the solid obstacles (tree trunks, rocks, hills) for collision, plus the Y-sortable layer for depth. */
export function buildTerrain(world: Container): TerrainResult {
  const ground = new Graphics();
  ground.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(hexToNumber(palette.grass.base));
  world.addChild(ground);

  // Three distinct patch "tile" styles — soft blobs, blade tufts, fine
  // speckle — picked at random per patch so the field never reads as one
  // pattern tiling across the whole world, while every pass stays low-alpha
  // and blends into neighbors with no hard edge, so it's still seamless.
  const patchRng = createRng(55);
  const patchCount = Math.round((WORLD_WIDTH * WORLD_HEIGHT) / 34000);
  for (let i = 0; i < patchCount; i++) {
    const px = patchRng() * WORLD_WIDTH;
    const py = patchRng() * WORLD_HEIGHT;
    const tint = hexToNumber(patchRng() > 0.5 ? palette.grass.light : palette.grass.dark);
    const variant = Math.floor(patchRng() * 3);

    if (variant === 0) {
      const blobCount = 2 + Math.floor(patchRng() * 2);
      for (let b = 0; b < blobCount; b++) {
        const bx = px + (patchRng() - 0.5) * 26;
        const by = py + (patchRng() - 0.5) * 16;
        const br = 8 + patchRng() * 12;
        ground.circle(bx, by, br).fill({ color: tint, alpha: 0.05 });
      }
    } else if (variant === 1) {
      const bladeCount = 5 + Math.floor(patchRng() * 5);
      for (let b = 0; b < bladeCount; b++) {
        const bx = px + (patchRng() - 0.5) * 18;
        const by = py + (patchRng() - 0.5) * 12;
        const len = 2.5 + patchRng() * 3;
        const lean = (patchRng() - 0.5) * 1.6;
        ground
          .moveTo(bx, by)
          .lineTo(bx + lean, by - len)
          .stroke({ width: 0.7, color: tint, alpha: 0.16 });
      }
    } else {
      const speckleCount = 6 + Math.floor(patchRng() * 6);
      for (let b = 0; b < speckleCount; b++) {
        const bx = px + (patchRng() - 0.5) * 20;
        const by = py + (patchRng() - 0.5) * 14;
        ground.circle(bx, by, 0.5 + patchRng() * 0.5).fill({ color: tint, alpha: 0.1 });
      }
    }
  }

  // Tiny imperfections — sparse worn/soil freckles so no stretch of ground
  // ever looks perfectly uniform.
  const soilRng = createRng(913);
  const soilColor = hexToNumber("#7d6a45");
  const soilCount = Math.round((WORLD_WIDTH * WORLD_HEIGHT) / 95000);
  for (let i = 0; i < soilCount; i++) {
    const sx = soilRng() * WORLD_WIDTH;
    const sy = soilRng() * WORLD_HEIGHT;
    const dotCount = 2 + Math.floor(soilRng() * 3);
    for (let d = 0; d < dotCount; d++) {
      const dx = sx + (soilRng() - 0.5) * 6;
      const dy = sy + (soilRng() - 0.5) * 4;
      ground.circle(dx, dy, 1 + soilRng() * 1.6).fill({ color: soilColor, alpha: 0.06 });
    }
  }

  // The worn dirt path and the footprint/blood trail along the true route
  // are drawn later by `buildJourneyTrail`, once the ground beneath them exists.

  // Flowers, scattered thinly across the whole field (avoiding the pen) — one shared Graphics, no per-flower draw call.
  const flowerRng = createRng(31);
  const flowers = new Graphics();
  const flowerCount = Math.round((WORLD_WIDTH * WORLD_HEIGHT) / 16000);
  for (let i = 0; i < flowerCount; i++) {
    const fx = flowerRng() * WORLD_WIDTH;
    const fy = flowerRng() * WORLD_HEIGHT;
    if (isNearPen(fx, fy, 30)) continue;
    const variant = FLOWER_VARIANTS[Math.floor(flowerRng() * FLOWER_VARIANTS.length)];
    drawFlower(flowers, fx, fy, variant);
  }
  world.addChild(flowers);

  buildRiver(world);

  // Bushes and small rocks are ground-hugging and don't need Y-sorting
  // against the player, so every one of them is batched into two shared
  // Graphics instead of costing its own draw call. Trees, large rocks and
  // hills are tall enough that the shepherd should visually pass in front of
  // near ones and behind far ones: each tree's trunk is drawn into a static,
  // always below-the-player batch (so the trunk never covers anyone's feet),
  // while its canopy gets its OWN entry in `dynamicLayer` with zIndex set to
  // its exact base y — never a shared band — so sorting is always correct,
  // not just close. Large rocks and hills sort individually the same way.
  const obstacles: TerrainObstacle[] = [];
  const walls: Rect[] = [];
  const dynamicLayer = new Container();
  dynamicLayer.sortableChildren = true;
  const trunkBatch = new Graphics();
  const bushBatch = new Graphics();
  const rockBatch = new Graphics();
  const rng = createRng(99);
  const propCount = Math.round((WORLD_WIDTH * WORLD_HEIGHT) / 17000);
  for (let i = 0; i < propCount; i++) {
    const x = rng() * WORLD_WIDTH;
    const y = rng() * WORLD_HEIGHT;
    if (isNearPen(x, y, 50)) continue;
    if (nearestCorridorPoint(x, y).distance < CORRIDOR_CLEAR) continue;

    const roll = rng();
    if (roll < 0.4) {
      // Collision sits only at the trunk's ground contact — never offset up
      // into the canopy — so the foliage above never blocks movement.
      addSortedTree(x, y, rng, trunkBatch, dynamicLayer);
      obstacles.push({ x, y, radius: 3.5 });
      walls.push(treeFootprint(x, y));
    } else if (roll < 0.75) {
      buildBush(x, y, rng, bushBatch);
      obstacles.push({ x, y, radius: 3.5 });
    } else {
      const rockScale = 0.7 + rng() * 1.1;
      if (rockScale >= 1.15) {
        const rock = buildRock(x, y, rng, rockScale);
        rock.zIndex = y;
        dynamicLayer.addChild(rock);
        obstacles.push({ x, y, radius: 5 * rockScale * 0.7 });
      } else {
        buildRock(x, y, rng, rockScale, rockBatch);
      }
    }
  }

  // Flanking terrain along every walkable corridor — sparse near the pen,
  // thickening the deeper a route goes, so the player is visually funneled
  // along each one without ever hitting a wall. Only the true route
  // (CORRIDOR_PATHS[0]) is meant to feel safe; the decoys get the same
  // treatment so they read as real paths worth exploring, not obviously fake.
  const FLANK_MIN = CORRIDOR_CLEAR + 14;
  const FLANK_MAX = CORRIDOR_CLEAR + 95;
  const flankRng = createRng(4242);
  for (const path of CORRIDOR_PATHS) {
    for (const p of path) {
      if (p.t < 0.05 || p.t > 0.92) continue; // leave each route's start and end open
      for (const side of [-1, 1] as const) {
        const density = 0.16 + 0.6 * p.t;
        if (flankRng() > density) continue;
        const off = FLANK_MIN + flankRng() * (FLANK_MAX - FLANK_MIN);
        const x = p.x + p.nx * off * side;
        const y = p.y + p.ny * off * side;
        if (x < 20 || x > WORLD_WIDTH - 20 || y < 20 || y > WORLD_HEIGHT - 20) continue;
        if (isNearPen(x, y, 50)) continue;
        if (y > RIVER.yTop - 20 && y < RIVER.yBottom + 20 && x > BRIDGE.xStart - 30 && x < BRIDGE.xEnd + 30) continue;

        const treeChance = 0.3 + 0.5 * p.t;
        if (flankRng() < treeChance) {
          addSortedTree(x, y, flankRng, trunkBatch, dynamicLayer);
          obstacles.push({ x, y, radius: 3.5 });
          walls.push(treeFootprint(x, y));
        } else {
          buildBush(x, y, flankRng, bushBatch);
          obstacles.push({ x, y, radius: 3.5 });
        }
      }
    }
  }

  // Handcrafted landmarks along the true route — a rock formation at the
  // first bend and a rocky cliff face guarding the final approach — each
  // nudging the player along the intended line without ever blocking it
  // outright.
  {
    const anchor = journeyAt(0.24);
    const cx = anchor.x + anchor.nx * 75;
    const cy = anchor.y + anchor.ny * 75;
    const clusterRng = createRng(8181);
    for (let i = 0; i < 6; i++) {
      const jx = cx + (clusterRng() - 0.5) * 46;
      const jy = cy + (clusterRng() - 0.5) * 30;
      const scale = 1.1 + clusterRng() * 0.9;
      const rock = buildRock(jx, jy, clusterRng, scale);
      rock.zIndex = jy;
      dynamicLayer.addChild(rock);
      obstacles.push({ x: jx, y: jy, radius: 5 * scale * 0.7 });
    }
  }

  {
    const anchor = journeyAt(0.85);
    const tx = anchor.ny;
    const ty = -anchor.nx;
    const cliffRng = createRng(9090);
    const rockCount = 8;
    for (let i = 0; i < rockCount; i++) {
      const along = (i - rockCount / 2) * 22;
      const cx = anchor.x - anchor.nx * 70 + tx * along;
      const cy = anchor.y - anchor.ny * 70 + ty * along;
      const scale = 1.3 + cliffRng() * 1.1;
      const rock = buildRock(cx, cy, cliffRng, scale);
      rock.zIndex = cy;
      dynamicLayer.addChild(rock);
      obstacles.push({ x: cx, y: cy, radius: 5 * scale * 0.7 });
    }
  }

  // Two irregular, unclimbable hills — natural silhouettes well clear of
  // every corridor, solid across their whole footprint. Distinct from the
  // sheep's special reachable ledge (built separately in LostSheepScene.tsx).
  {
    const anchor = journeyAt(0.5);
    const cx = anchor.x - anchor.nx * 110;
    const cy = anchor.y - anchor.ny * 110;
    buildHillMass(cx, cy, 3355, 52, dynamicLayer, obstacles);
  }
  {
    const anchor = journeyAt(0.34);
    const cx = anchor.x + anchor.nx * 210;
    const cy = anchor.y + anchor.ny * 210;
    buildHillMass(cx, cy, 7711, 60, dynamicLayer, obstacles);
  }

  world.addChild(trunkBatch);
  world.addChild(bushBatch);
  world.addChild(rockBatch);
  // `dynamicLayer` is intentionally NOT added to `world` here — the caller
  // adds it after the fence/flock/mound so those keep rendering below the
  // player as before, while still letting the player sort correctly against
  // tree canopies, rocks and hills within the layer itself.

  return { obstacles, walls, dynamicLayer };
}
