import { Container, Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { createRng } from "@/pixel-art/prng";
import { palette } from "@/pixel-art/palette";
import { PEN, WORLD_HEIGHT, WORLD_WIDTH } from "@/parables/lost-sheep/map";

function drawTree(x: number, y: number): Graphics {
  const tree = new Graphics();
  tree.rect(x - 2, y - 8, 4, 12).fill(hexToNumber(palette.wood.darker));
  tree.circle(x, y - 16, 11).fill(hexToNumber(palette.grass.dark));
  tree.circle(x - 6, y - 11, 8).fill(hexToNumber(palette.grass.base));
  tree.circle(x + 6, y - 11, 8).fill(hexToNumber(palette.grass.base));
  tree.circle(x, y - 21, 7).fill(hexToNumber(palette.grass.light));
  return tree;
}

function drawBush(x: number, y: number): Graphics {
  const bush = new Graphics();
  bush.circle(x - 4, y, 4).fill(hexToNumber(palette.grass.dark));
  bush.circle(x + 4, y, 4).fill(hexToNumber(palette.grass.dark));
  bush.circle(x, y - 3, 5).fill(hexToNumber(palette.grass.base));
  return bush;
}

function drawRock(x: number, y: number): Graphics {
  const rock = new Graphics();
  rock.poly([x - 5, y + 4, x - 3, y - 3, x + 2, y - 5, x + 6, y + 1, x + 4, y + 4]).fill(0x6b6a63);
  rock.poly([x - 2, y + 1, x + 1, y - 2, x + 4, y + 1, x + 2, y + 3]).fill(0x82817a);
  return rock;
}

/** Builds the large outdoor world the shepherd searches: ground, scattered trees/bushes/rocks, and a path from the pen. */
export function buildTerrain(world: Container): void {
  const ground = new Graphics();
  ground.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(hexToNumber(palette.grass.base));
  world.addChild(ground);

  const patches = new Graphics();
  const patchRng = createRng(55);
  for (let i = 0; i < 40; i++) {
    const x = patchRng() * WORLD_WIDTH;
    const y = patchRng() * WORLD_HEIGHT;
    const r = 20 + patchRng() * 30;
    patches.circle(x, y, r).fill({
      color: patchRng() > 0.5 ? hexToNumber(palette.grass.light) : hexToNumber(palette.grass.dark),
      alpha: 0.12,
    });
  }
  world.addChild(patches);

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
    .stroke({ width: 18, color: 0xc7a874, alpha: 0.35, cap: "round" });
  world.addChild(path);

  const propsLayer = new Container();
  const rng = createRng(99);
  const propCount = 46;
  for (let i = 0; i < propCount; i++) {
    const x = rng() * WORLD_WIDTH;
    const y = rng() * WORLD_HEIGHT;
    const withinPen = x > PEN.x - 40 && x < PEN.x + PEN.width + 40 && y > PEN.y - 40 && y < PEN.y + PEN.height + 40;
    if (withinPen) continue;
    const roll = rng();
    const prop = roll < 0.55 ? drawTree(x, y) : roll < 0.8 ? drawBush(x, y) : drawRock(x, y);
    prop.zIndex = y;
    propsLayer.addChild(prop);
  }
  propsLayer.sortableChildren = true;
  world.addChild(propsLayer);
}
