import { Container, Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { createRng } from "@/pixel-art/prng";
import { palette } from "@/pixel-art/palette";
import { buildBush, buildRock, buildTree } from "@/pixel-art/foliage";
import { JOURNEY_PATH, PEN, WORLD_HEIGHT, WORLD_WIDTH, journeyAt, nearestJourneyPoint } from "@/parables/lost-sheep/map";

/** How close to the rescue route's centerline nothing is allowed to grow — keeps the S-curve walkable end to end. */
const CORRIDOR_CLEAR = 58;

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

export interface TerrainResult {
  obstacles: TerrainObstacle[];
  /** A Y-sortable Container (already added to `world`) holding tree canopies and large rocks. The caller should add the shepherd/sheep/wolves/flock into it too, and keep each entity's zIndex equal to its y position, so tall scenery correctly layers in front of or behind moving characters. */
  dynamicLayer: Container;
}

/** Builds the large outdoor world the shepherd searches: ground, dappled texture, flowers, scattered trees/bushes/rocks, and a path from the pen. Returns the solid obstacles (tree trunks and large rocks) for collision, plus the Y-sortable layer for depth. */
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

  // The worn dirt path and the footprint/blood trail along the rescue route
  // are drawn later by `buildJourneyTrail`, once the ground beneath them exists.

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

  // Bushes and small rocks are ground-hugging and don't need Y-sorting
  // against the player, so every one of them is batched into two shared
  // Graphics instead of costing its own draw call. Trees and large rocks are
  // tall enough that the shepherd should visually pass in front of near ones
  // and behind far ones: each tree's trunk is drawn into a static, always
  // below-the-player batch (so the trunk never covers anyone's feet), while
  // its canopy is drawn into a shared Graphics for its Y-band (a horizontal
  // slice of the world) inside `dynamicLayer` — a container the caller mixes
  // the player/sheep/wolves into and sorts by zIndex=y every frame. Only the
  // ~dozen bands are depth-sorted rather than every tree individually, which
  // keeps draw calls low while still getting correct sorting almost
  // everywhere (it only misses at a band's exact edge). Large rocks are rare
  // enough to sort individually the same way.
  const obstacles: TerrainObstacle[] = [];
  const dynamicLayer = new Container();
  dynamicLayer.sortableChildren = true;
  const trunkBatch = new Graphics();
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
    if (nearestJourneyPoint(x, y).distance < CORRIDOR_CLEAR) continue;

    const roll = rng();
    if (roll < 0.4) {
      const bandKey = Math.floor(y / treeBandSize);
      let band = treeBands.get(bandKey);
      if (!band) {
        band = new Graphics();
        band.zIndex = bandKey * treeBandSize + treeBandSize;
        treeBands.set(bandKey, band);
        dynamicLayer.addChild(band);
      }
      buildTree(x, y, rng, trunkBatch, band);
      obstacles.push({ x, y: y - 6, radius: 4 });
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
  // Flanking terrain along the rescue route: sparse near the pen, thickening
  // into real forest by the time the route reaches the sheep's hill, so the
  // player is visually funneled along the S-curve without ever hitting a
  // wall — the environment guides instead of blocking.
  const FLANK_MIN = CORRIDOR_CLEAR + 14;
  const FLANK_MAX = CORRIDOR_CLEAR + 95;
  const flankRng = createRng(4242);
  for (const p of JOURNEY_PATH) {
    if (p.t < 0.05 || p.t > 0.92) continue; // leave the pen approach and the hill clearing open
    for (const side of [-1, 1] as const) {
      const density = 0.16 + 0.6 * p.t;
      if (flankRng() > density) continue;
      const off = FLANK_MIN + flankRng() * (FLANK_MAX - FLANK_MIN);
      const x = p.x + p.nx * off * side;
      const y = p.y + p.ny * off * side;
      if (x < 20 || x > WORLD_WIDTH - 20 || y < 20 || y > WORLD_HEIGHT - 20) continue;
      if (x > PEN.x - 50 && x < PEN.x + PEN.width + 50 && y > PEN.y - 50 && y < PEN.y + PEN.height + 50) continue;

      const treeChance = 0.3 + 0.5 * p.t;
      if (flankRng() < treeChance) {
        const bandKey = Math.floor(y / treeBandSize);
        let band = treeBands.get(bandKey);
        if (!band) {
          band = new Graphics();
          band.zIndex = bandKey * treeBandSize + treeBandSize;
          treeBands.set(bandKey, band);
          dynamicLayer.addChild(band);
        }
        buildTree(x, y, flankRng, trunkBatch, band);
        obstacles.push({ x, y: y - 6, radius: 4 });
      } else {
        buildBush(x, y, flankRng, bushBatch);
        obstacles.push({ x, y, radius: 3.5 });
      }
    }
  }

  // Four handcrafted landmarks along the route — a rock formation at the
  // first bend, a grassy rise the route curves around at the second, the
  // last broken fence post before the wilderness closes in, and a rocky
  // cliff face guarding the final approach to the hill. Each nudges the
  // player along the intended line without ever blocking it outright.
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
    const anchor = journeyAt(0.5);
    const cx = anchor.x - anchor.nx * 95;
    const cy = anchor.y - anchor.ny * 95;
    const mound = new Graphics();
    mound.ellipse(cx, cy + 8, 46, 20).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.3 });
    mound.ellipse(cx, cy + 3, 42, 23).fill(hexToNumber(palette.grass.dark));
    mound.ellipse(cx, cy, 36, 19).fill(hexToNumber(palette.grass.base));
    mound.ellipse(cx - 8, cy - 5, 20, 10).fill({ color: hexToNumber(palette.grass.light), alpha: 0.5 });
    world.addChild(mound);
    const hillRng = createRng(3355);
    for (let i = 0; i < 3; i++) {
      const rx = cx + (hillRng() - 0.5) * 40;
      const ry = cy + (hillRng() - 0.5) * 18;
      buildRock(rx, ry, hillRng, 0.6 + hillRng() * 0.3, rockBatch);
    }
  }

  {
    const anchor = journeyAt(0.68);
    const baseX = anchor.x + anchor.nx * 62;
    const baseY = anchor.y + anchor.ny * 62;
    const tx = anchor.ny;
    const ty = -anchor.nx;
    const fenceRemnant = new Graphics();
    const postRng = createRng(6060);
    for (let i = 0; i < 4; i++) {
      const px = baseX + tx * i * 16;
      const py = baseY + ty * i * 16;
      const height = i === 2 ? 6 : 11 + postRng() * 3; // one post snapped off short — the fence gave out here
      fenceRemnant.rect(px - 1.5, py - height, 3, height).fill(hexToNumber(palette.fence.dark));
      fenceRemnant.rect(px - 1.5, py - height, 1.2, height).fill(hexToNumber(palette.fence.mid));
    }
    world.addChild(fenceRemnant);
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

  world.addChild(trunkBatch);
  world.addChild(bushBatch);
  world.addChild(rockBatch);
  // `dynamicLayer` is intentionally NOT added to `world` here — the caller
  // adds it after the fence/flock/mound so those keep rendering below the
  // player as before, while still letting the player sort correctly against
  // tree canopies and large rocks within the layer itself.

  return { obstacles, dynamicLayer };
}
