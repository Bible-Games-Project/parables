import { Container, Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { createRng } from "@/pixel-art/prng";
import { palette } from "@/pixel-art/palette";
import { buildBush, buildRock, buildTree } from "@/pixel-art/foliage";
import { PEN, WORLD_HEIGHT, WORLD_WIDTH } from "@/parables/lost-sheep/map";

export interface TerrainObstacle {
  x: number;
  y: number;
  radius: number;
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

/** Builds the large outdoor world the shepherd searches: ground, dappled texture, flowers, scattered trees/bushes/rocks, and a path from the pen. Returns the solid obstacles (tree trunks and large rocks) for collision. */
export function buildTerrain(world: Container): TerrainObstacle[] {
  const ground = new Graphics();
  ground.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(hexToNumber(palette.grass.base));
  world.addChild(ground);

  // Dappled light/shade patches, built from soft overlapping blobs.
  const patchRng = createRng(55);
  const patchCount = Math.round((WORLD_WIDTH * WORLD_HEIGHT) / 48000);
  for (let i = 0; i < patchCount; i++) {
    const px = patchRng() * WORLD_WIDTH;
    const py = patchRng() * WORLD_HEIGHT;
    const tint = hexToNumber(patchRng() > 0.5 ? palette.grass.light : palette.grass.dark);
    const blobCount = 2 + Math.floor(patchRng() * 2);
    for (let b = 0; b < blobCount; b++) {
      const bx = px + (patchRng() - 0.5) * 26;
      const by = py + (patchRng() - 0.5) * 16;
      const br = 8 + patchRng() * 12;
      ground.circle(bx, by, br).fill({ color: tint, alpha: 0.05 });
    }
  }

  const path = new Graphics();
  path
    .moveTo(PEN.x + PEN.width / 2, PEN.y)
    .bezierCurveTo(
      PEN.x + PEN.width / 2 - 40,
      PEN.y - 160,
      PEN.x + 120,
      PEN.y - 340,
      PEN.x + 220,
      PEN.y - 520,
    )
    .stroke({ width: 18, color: 0xc7a874, alpha: 0.3, cap: "round" });
  world.addChild(path);

  // Flowers, scattered thinly across the whole field (avoiding the pen) — one shared Graphics, no per-flower draw call.
  const flowerRng = createRng(31);
  const flowers = new Graphics();
  const flowerCount = Math.round((WORLD_WIDTH * WORLD_HEIGHT) / 16000);
  for (let i = 0; i < flowerCount; i++) {
    const fx = flowerRng() * WORLD_WIDTH;
    const fy = flowerRng() * WORLD_HEIGHT;
    if (fx > PEN.x - 30 && fx < PEN.x + PEN.width + 30 && fy > PEN.y - 30 && fy < PEN.y + PEN.height + 30) continue;
    const variant = FLOWER_VARIANTS[Math.floor(flowerRng() * FLOWER_VARIANTS.length)];
    drawFlower(flowers, fx, fy, variant);
  }
  world.addChild(flowers);

  // Bushes and rocks are ground-hugging and don't need Y-sorting against the
  // player, so every one of them is batched into two shared Graphics instead
  // of costing its own draw call. Trees are tall enough that the shepherd
  // should visually pass in front of near ones and behind far ones, but
  // sorting each tree as its own display object gets expensive at this
  // density — instead every tree is drawn into a shared Graphics for its
  // Y-band (a horizontal slice of the world), and only the ~dozen bands are
  // depth-sorted. That keeps draw calls low while still getting correct
  // sorting almost everywhere (it only misses at a band's exact edge).
  const obstacles: TerrainObstacle[] = [];
  const propsLayer = new Container();
  const bushBatch = new Graphics();
  const rockBatch = new Graphics();
  const treeBandSize = 150;
  const treeBands = new Map<number, Graphics>();
  const rng = createRng(99);
  const propCount = Math.round((WORLD_WIDTH * WORLD_HEIGHT) / 17000);
  for (let i = 0; i < propCount; i++) {
    const x = rng() * WORLD_WIDTH;
    const y = rng() * WORLD_HEIGHT;
    const withinPen = x > PEN.x - 50 && x < PEN.x + PEN.width + 50 && y > PEN.y - 50 && y < PEN.y + PEN.height + 50;
    if (withinPen) continue;

    const roll = rng();
    if (roll < 0.4) {
      const bandKey = Math.floor(y / treeBandSize);
      let band = treeBands.get(bandKey);
      if (!band) {
        band = new Graphics();
        band.zIndex = bandKey * treeBandSize + treeBandSize;
        treeBands.set(bandKey, band);
        propsLayer.addChild(band);
      }
      buildTree(x, y, rng, band);
      obstacles.push({ x, y: y - 6, radius: 4 });
    } else if (roll < 0.75) {
      buildBush(x, y, rng, bushBatch);
    } else {
      const rockScale = 0.7 + rng() * 1.1;
      buildRock(x, y, rng, rockScale, rockBatch);
      if (rockScale >= 1.15) obstacles.push({ x, y, radius: 5 * rockScale * 0.7 });
    }
  }
  propsLayer.sortableChildren = true;
  world.addChild(bushBatch);
  world.addChild(rockBatch);
  world.addChild(propsLayer);

  return obstacles;
}
