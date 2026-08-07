import { Container, Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { createRng } from "@/pixel-art/prng";
import { palette } from "@/pixel-art/palette";
import { buildBush, buildRock, buildTree } from "@/pixel-art/foliage";
import type { Rect } from "@/engine/collision";
import {
  BRIDGE,
  FARMHOUSE,
  FOREST_PATCH,
  HILL_VIEWPOINT,
  OLIVE_GROVE,
  RIVER,
  ROAD_PATH,
  SHEPHERD_CAMP,
  VINEYARD,
  WHEAT_FIELD,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "@/world/map";
import { BRIDGE_GATE, isGateUnlocked } from "@/world/gates";

export interface TerrainObstacle {
  x: number;
  y: number;
  radius: number;
}

export interface TerrainResult {
  obstacles: TerrainObstacle[];
  walls: Rect[];
  /** Y-sortable layer holding tree canopies, rocks and houses — the caller mixes Jesus/NPCs into it, keeping every entity's zIndex equal to its own y so depth is always correct. */
  dynamicLayer: Container;
}

/** An olive tree — the same tapered-trunk/puff-canopy construction as `buildTree`, but with the cooler `oliveFoliage` ramp so groves read distinctly from the general forest. */
function buildOliveTree(x: number, baseY: number, rng: () => number, trunkTarget?: Graphics, canopyTarget?: Graphics): Graphics {
  const g = trunkTarget ?? new Graphics();
  const canopy = canopyTarget ?? g;
  const trunkHeight = 10 + rng() * 4;
  const trunkTopY = baseY - trunkHeight;

  g.poly([x - 4, baseY, x - 1.4, trunkTopY + 2.5, x + 1.4, trunkTopY + 2.5, x + 4, baseY]).fill(hexToNumber(palette.wood.dark));
  g.rect(x - 2, trunkTopY, 2.2, trunkHeight).fill(hexToNumber(palette.wood.darker));
  g.rect(x + 0.2, trunkTopY, 2, trunkHeight).fill(hexToNumber(palette.wood.dark));

  const canopyY = trunkTopY + 2;
  const puffs: { dx: number; dy: number; r: number }[] = [];
  const ringCount = 6 + Math.floor(rng() * 3);
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2 + rng() * 0.5;
    const dist = 5 + rng() * 6;
    puffs.push({ dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist * 0.55 - 3, r: 4.5 + rng() * 3 });
  }
  for (const p of puffs) canopy.circle(x + p.dx - 1, canopyY + p.dy + 2, p.r * 0.95).fill(hexToNumber(palette.oliveFoliage.shadow));
  for (const p of puffs) canopy.circle(x + p.dx, canopyY + p.dy, p.r * 0.86).fill(hexToNumber(palette.oliveFoliage.base));
  for (const p of puffs.filter((p) => p.dx > -2)) {
    canopy.circle(x + p.dx + 1, canopyY + p.dy - 1, p.r * 0.5).fill(hexToNumber(palette.oliveFoliage.mid));
  }
  const highlightPicks = puffs.filter((p) => p.dx > 0 && p.dy < -1).slice(0, 2);
  for (const p of highlightPicks) {
    canopy.circle(x + p.dx + 1.2, canopyY + p.dy - 1.6, p.r * 0.3).fill({ color: hexToNumber(palette.oliveFoliage.highlight), alpha: 0.8 });
  }
  return g;
}

function buildVineRow(g: Graphics, x: number, y: number, length: number, rng: () => number): void {
  const stakeCount = Math.max(2, Math.round(length / 14));
  for (let i = 0; i < stakeCount; i++) {
    const sx = x + i * 14;
    g.rect(sx - 0.6, y - 8, 1.2, 8).fill(hexToNumber(palette.wood.dark));
    if (i > 0) {
      const prevX = x + (i - 1) * 14;
      g.moveTo(prevX, y - 6.5).lineTo(sx, y - 6).stroke({ width: 1, color: hexToNumber(palette.foliage.base), alpha: 0.7 });
      g.moveTo(prevX, y - 4).lineTo(sx, y - 3.5).stroke({ width: 1, color: hexToNumber(palette.foliage.base), alpha: 0.7 });
      for (let leaf = 0; leaf < 3; leaf++) {
        const lx = prevX + rng() * 14;
        const ly = y - 7 + rng() * 4;
        g.circle(lx, ly, 1.4 + rng() * 1).fill({ color: hexToNumber(palette.foliage.mid), alpha: 0.85 });
      }
    }
  }
}

function buildWheatPatch(ground: Graphics, cx: number, cy: number, radius: number, rng: () => number): void {
  ground.ellipse(cx, cy, radius, radius * 0.6).fill({ color: hexToNumber(palette.wheat.base), alpha: 0.5 });
  const bladeCount = Math.round(radius * radius / 40);
  for (let i = 0; i < bladeCount; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * radius;
    const bx = cx + Math.cos(angle) * dist;
    const by = cy + Math.sin(angle) * dist * 0.6;
    const len = 3 + rng() * 3;
    const lean = (rng() - 0.5) * 1.6;
    const shade = rng() > 0.5 ? palette.wheat.shadow : palette.wheat.highlight;
    ground.moveTo(bx, by).lineTo(bx + lean, by - len).stroke({ width: 0.8, color: hexToNumber(shade), alpha: 0.55 });
  }
}

/** A small clay-walled house with a terracotta roof. Returns its footprint rect for collision. */
function buildHouse(world: Container, x: number, y: number, rng: () => number): Rect {
  const g = new Graphics();
  const w = 34 + rng() * 8;
  const h = 22;
  const left = x - w / 2;
  const top = y - h;
  g.ellipse(x, y + 3, w / 2 + 3, 5).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.28 });
  g.rect(left, top, w, h).fill(hexToNumber(palette.clay.base));
  g.rect(left, top, w * 0.35, h).fill({ color: hexToNumber(palette.clay.shadow), alpha: 0.5 });
  g.rect(left, top, w, 2.5).fill({ color: hexToNumber(palette.clay.highlight), alpha: 0.4 });
  const roofOverhang = 4;
  g.poly([left - roofOverhang, top + 2, x, top - 12, left + w + roofOverhang, top + 2, left + w + roofOverhang, top + 6, x, top - 7, left - roofOverhang, top + 6]).fill(
    hexToNumber(palette.roofTile.base),
  );
  g.poly([left - roofOverhang, top + 2, x, top - 12, x, top - 7, left - roofOverhang, top + 6]).fill({
    color: hexToNumber(palette.roofTile.shadow),
    alpha: 0.5,
  });
  const doorW = 6;
  g.rect(x - doorW / 2, y - 12, doorW, 12).fill(hexToNumber(palette.wood.darker));
  g.rect(x - w / 3, top + 6, 5, 5).fill({ color: hexToNumber(palette.wood.darker), alpha: 0.8 });
  world.addChild(g);
  return { x: left, y: top, width: w, height: h };
}

function buildTent(world: Container, x: number, y: number, rng: () => number): void {
  const g = new Graphics();
  const w = 26;
  const h = 16;
  g.ellipse(x, y + 2, w / 2 + 2, 4).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.25 });
  g.poly([x - w / 2, y, x, y - h, x + w / 2, y]).fill(hexToNumber(palette.fence.mid));
  g.poly([x - w / 2, y, x, y - h, x, y]).fill({ color: hexToNumber(palette.fence.dark), alpha: 0.6 });
  g.poly([x - 3, y, x + 3, y - h * 0.4, x + 3, y]).fill(hexToNumber(palette.fence.darkest));
  world.addChild(g);
  void rng;
}

function buildCampfire(world: Container, x: number, y: number): void {
  const g = new Graphics();
  g.ellipse(x, y + 1, 7, 2.6).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.3 });
  for (const angle of [0, 60, 120, 180, 240, 300]) {
    const rad = (angle * Math.PI) / 180;
    g.rect(x + Math.cos(rad) * 3 - 0.5, y + Math.sin(rad) * 1.5, 4, 1).fill(hexToNumber(palette.wood.darker));
  }
  g.circle(x, y - 1, 2.4).fill({ color: hexToNumber(palette.lantern.glow), alpha: 0.3 });
  g.circle(x, y - 1.5, 1.4).fill({ color: hexToNumber(palette.lantern.flame), alpha: 0.75 });
  g.circle(x, y - 1.8, 0.7).fill({ color: hexToNumber(palette.lantern.flameCore), alpha: 0.9 });
  world.addChild(g);
}

/** A resting cluster of sheep silhouettes — camp dressing only, not the animated flock rig used inside a parable. */
function buildRestingSheep(world: Container, x: number, y: number, rng: () => number): void {
  const g = new Graphics();
  for (let i = 0; i < 3; i++) {
    const sx = x + (rng() - 0.5) * 16;
    const sy = y + (rng() - 0.5) * 8;
    g.ellipse(sx, sy + 2, 5, 2).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.25 });
    g.circle(sx - 2, sy, 3).fill(hexToNumber(palette.wool.shadow));
    g.circle(sx, sy - 0.5, 3.4).fill(hexToNumber(palette.wool.base));
    g.circle(sx + 2.6, sy, 2.6).fill(hexToNumber(palette.wool.base));
    g.circle(sx + 4.4, sy + 0.4, 1.6).fill(hexToNumber(palette.ink));
  }
  world.addChild(g);
}

function buildRiverAndBridge(world: Container, bridgeUnlocked: boolean): void {
  const { yTop, yBottom, xStart, xEnd } = RIVER;
  const water = new Graphics();
  water.rect(xStart, yTop - 6, xEnd - xStart, yBottom - yTop + 12).fill({ color: 0x4a3b24, alpha: 0.35 });
  water.rect(xStart, yTop, xEnd - xStart, yBottom - yTop).fill(hexToNumber(palette.water.deep));
  water.rect(xStart, yTop + 5, xEnd - xStart, yBottom - yTop - 10).fill(hexToNumber(palette.water.base));

  const rippleRng = createRng(4321);
  for (let x = xStart; x < xEnd; x += 13) {
    if (x > BRIDGE.xStart - 8 && x < BRIDGE.xEnd + 8) continue;
    const ry = yTop + 8 + rippleRng() * (yBottom - yTop - 16);
    water
      .moveTo(x, ry)
      .lineTo(x + 7 + rippleRng() * 10, ry + (rippleRng() - 0.5) * 3)
      .stroke({ width: 1, color: hexToNumber(palette.water.light), alpha: 0.32 });
  }
  world.addChild(water);

  const bridge = new Graphics();
  const bx1 = BRIDGE.xStart;
  const bx2 = BRIDGE.xEnd;
  bridge.rect(bx1 - 4, yTop - 4, bx2 - bx1 + 8, yBottom - yTop + 8).fill({ color: 0x1f1108, alpha: 0.28 });
  bridge.rect(bx1, yTop - 2, bx2 - bx1, yBottom - yTop + 4).fill(hexToNumber(palette.fence.base));
  const plankRng = createRng(9182);
  for (let y = yTop; y < yBottom; y += 6) {
    const shade = plankRng() > 0.5 ? palette.fence.darkest : palette.fence.dark;
    bridge.rect(bx1, y, bx2 - bx1, 1.3).fill({ color: hexToNumber(shade), alpha: 0.4 });
  }
  for (const railX of [bx1, bx2 - 2.5]) {
    bridge.rect(railX, yTop - 4, 2.5, yBottom - yTop + 8).fill(hexToNumber(palette.fence.dark));
  }
  if (!bridgeUnlocked) {
    // A "still needs repair" barrier — a couple of crossed planks and a gap in the deck.
    const midY = (yTop + yBottom) / 2;
    bridge.rect(bx1 + 6, midY - 12, bx2 - bx1 - 12, 24).fill({ color: hexToNumber(palette.water.deep), alpha: 0.6 });
    bridge
      .moveTo(bx1 + 4, yTop + 2)
      .lineTo(bx2 - 4, yBottom - 2)
      .stroke({ width: 3, color: hexToNumber(palette.wood.darker) });
    bridge
      .moveTo(bx2 - 4, yTop + 2)
      .lineTo(bx1 + 4, yBottom - 2)
      .stroke({ width: 3, color: hexToNumber(palette.wood.darker) });
  }
  world.addChild(bridge);
}

/** Builds the full Israel world — the ancient road, seven handcrafted locations, and the connective meadow between them. `totalStars` only affects the bridge's repaired/broken look; its collision comes from `gates.ts`. */
export function buildIsraelTerrain(world: Container, totalStars: number): TerrainResult {
  const ground = new Graphics();
  ground.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(hexToNumber(palette.grass.base));

  const patchRng = createRng(11);
  const patchCount = Math.round((WORLD_WIDTH * WORLD_HEIGHT) / 30000);
  for (let i = 0; i < patchCount; i++) {
    const px = patchRng() * WORLD_WIDTH;
    const py = patchRng() * WORLD_HEIGHT;
    const tint = hexToNumber(patchRng() > 0.5 ? palette.grass.light : palette.grass.dark);
    const blobCount = 2 + Math.floor(patchRng() * 2);
    for (let b = 0; b < blobCount; b++) {
      const bx = px + (patchRng() - 0.5) * 24;
      const by = py + (patchRng() - 0.5) * 16;
      ground.circle(bx, by, 7 + patchRng() * 11).fill({ color: tint, alpha: 0.05 });
    }
  }

  // The worn road itself — a soft dirt ribbon the whole world hangs off of.
  for (let i = 1; i < ROAD_PATH.length; i++) {
    const a = ROAD_PATH[i - 1];
    const b = ROAD_PATH[i];
    ground.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 15, color: 0xc7a874, alpha: 0.28, cap: "round" });
  }

  buildRiverAndBridge(world, isGateUnlocked(BRIDGE_GATE, totalStars));
  world.addChild(ground);

  const obstacles: TerrainObstacle[] = [];
  const walls: Rect[] = [];
  const dynamicLayer = new Container();
  dynamicLayer.sortableChildren = true;
  const trunkBatch = new Graphics();
  const bushBatch = new Graphics();
  const rockBatch = new Graphics();

  function addTree(x: number, y: number, rng: () => number, olive = false): void {
    const canopy = new Graphics();
    if (olive) buildOliveTree(x, y, rng, trunkBatch, canopy);
    else buildTree(x, y, rng, trunkBatch, canopy);
    canopy.zIndex = y;
    dynamicLayer.addChild(canopy);
    obstacles.push({ x, y, radius: 3.5 });
  }

  // --- Olive grove ---
  {
    const rng = createRng(101);
    for (let i = 0; i < 9; i++) {
      const x = OLIVE_GROVE.x + (rng() - 0.5) * 150;
      const y = OLIVE_GROVE.y + (rng() - 0.5) * 100;
      addTree(x, y, rng, true);
    }
  }

  // --- Vineyard ---
  {
    const rng = createRng(202);
    const vines = new Graphics();
    for (let row = 0; row < 3; row++) {
      buildVineRow(vines, VINEYARD.x - 40, VINEYARD.y - 20 + row * 16, 80, rng);
    }
    world.addChild(vines);
  }

  // --- Wheat field ---
  {
    const rng = createRng(303);
    buildWheatPatch(ground, WHEAT_FIELD.x, WHEAT_FIELD.y, 90, rng);
    const farmerNpcSpot = WHEAT_FIELD;
    void farmerNpcSpot;
  }

  // --- Forest patch ---
  {
    const rng = createRng(404);
    for (let i = 0; i < 14; i++) {
      const x = FOREST_PATCH.x + (rng() - 0.5) * 180;
      const y = FOREST_PATCH.y + (rng() - 0.5) * 140;
      if (rng() < 0.75) addTree(x, y, rng);
      else {
        buildBush(x, y, rng, bushBatch);
        obstacles.push({ x, y, radius: 3.5 });
      }
    }
  }

  // --- Rocky path near the hill viewpoint ---
  {
    const rng = createRng(505);
    for (let i = 0; i < 10; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 40 + rng() * 130;
      const x = HILL_VIEWPOINT.x + Math.cos(angle) * dist;
      const y = HILL_VIEWPOINT.y + Math.sin(angle) * dist * 0.6;
      const scale = 0.6 + rng() * 0.9;
      if (scale > 1.05) {
        const rock = buildRock(x, y, rng, scale);
        rock.zIndex = y;
        dynamicLayer.addChild(rock);
        obstacles.push({ x, y, radius: 5 * scale * 0.7 });
      } else {
        buildRock(x, y, rng, scale, rockBatch);
      }
    }
    const oliveRng = createRng(506);
    addTree(HILL_VIEWPOINT.x - 20, HILL_VIEWPOINT.y - 10, oliveRng, true);
  }

  // --- Farmhouse ---
  {
    const rng = createRng(606);
    const houseWall = buildHouse(world, FARMHOUSE.x, FARMHOUSE.y, rng);
    walls.push(houseWall);
    for (let i = 0; i < 3; i++) {
      const x = FARMHOUSE.x + 40 + (rng() - 0.5) * 30;
      const y = FARMHOUSE.y + (rng() - 0.5) * 20;
      if (rng() < 0.5) addTree(x, y, rng, true);
      else buildBush(x, y, rng, bushBatch);
    }
  }

  // --- Shepherd camp (the encounter lives here — see encounters.ts) ---
  {
    const rng = createRng(707);
    buildTent(world, SHEPHERD_CAMP.x + 30, SHEPHERD_CAMP.y - 10, rng);
    buildCampfire(world, SHEPHERD_CAMP.x + 5, SHEPHERD_CAMP.y + 8);
    buildRestingSheep(world, SHEPHERD_CAMP.x - 30, SHEPHERD_CAMP.y + 4, rng);
    for (let i = 0; i < 3; i++) {
      const x = SHEPHERD_CAMP.x + (rng() - 0.5) * 90;
      const y = SHEPHERD_CAMP.y - 40 - rng() * 20;
      addTree(x, y, rng);
    }
  }

  // --- General flowers/bushes scattered thinly through the connective meadow ---
  {
    const rng = createRng(808);
    const count = Math.round((WORLD_WIDTH * WORLD_HEIGHT) / 22000);
    for (let i = 0; i < count; i++) {
      const x = rng() * WORLD_WIDTH;
      const y = rng() * WORLD_HEIGHT;
      if (y > RIVER.yTop - 20 && y < RIVER.yBottom + 20) continue;
      const roll = rng();
      if (roll < 0.5) buildBush(x, y, rng, bushBatch);
      else if (roll < 0.75) buildRock(x, y, rng, 0.5 + rng() * 0.5, rockBatch);
      else addTree(x, y, rng, rng() < 0.3);
    }
  }

  world.addChild(trunkBatch);
  world.addChild(bushBatch);
  world.addChild(rockBatch);

  return { obstacles, walls, dynamicLayer };
}
