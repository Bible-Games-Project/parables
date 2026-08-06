import { Application, Container, Graphics } from "pixi.js";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "@/engine/constants";
import { hexToNumber, lerpColor } from "@/pixel-art/color";
import { createRng } from "@/pixel-art/prng";
import { palette } from "@/pixel-art/palette";
import { buildBush, buildDeadTree, buildRock, buildTree } from "@/pixel-art/foliage";

const HORIZON = 168;

const FLOWER_VARIANTS = [
  { petal: palette.flowers.poppyPetal, center: palette.flowers.poppyCenter },
  { petal: palette.flowers.daisyPetal, center: palette.flowers.daisyCenter },
  { petal: palette.flowers.violetPetal, center: palette.flowers.violetCenter },
];

/** A tiny five-dot blossom — a soft shadow, four petals, and a center dot. */
function buildFlower(x: number, y: number, rng: () => number): Graphics {
  const g = new Graphics();
  const variant = FLOWER_VARIANTS[Math.floor(rng() * FLOWER_VARIANTS.length)];
  const petal = hexToNumber(variant.petal);
  const center = hexToNumber(variant.center);
  g.circle(x + 0.4, y + 0.6, 1.1).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.28 });
  g.circle(x, y - 1, 0.9).fill(petal);
  g.circle(x, y + 1, 0.9).fill(petal);
  g.circle(x - 1, y, 0.9).fill(petal);
  g.circle(x + 1, y, 0.9).fill(petal);
  g.circle(x, y, 0.7).fill(center);
  return g;
}

/** Builds the animated cozy pixel-art landscape behind the Home screen. */
export function createHomeBackground(app: Application): () => void {
  const root = new Container();
  app.stage.addChild(root);

  drawSky(root);
  drawSun(root);
  const { clouds, shadows } = drawClouds(root);
  drawFarHill(root);
  drawTrees(root);
  drawNearHill(root);
  drawForestFloor(root);
  const birds = new Container();
  root.addChild(birds);

  let elapsed = 0;
  let nextBirdAt = 3;

  const tick = (ticker: { deltaTime: number }) => {
    const dt = ticker.deltaTime / 60;
    elapsed += dt;

    for (const cloud of clouds) {
      cloud.x += cloud.speed * dt;
      if (cloud.x > VIRTUAL_WIDTH + 40) cloud.x = -40;
    }
    for (const shadow of shadows) {
      shadow.x += shadow.speed * dt;
      if (shadow.x > VIRTUAL_WIDTH + 40) shadow.x = -40;
    }

    if (elapsed > nextBirdAt) {
      spawnBird(birds);
      nextBirdAt = elapsed + 4 + Math.random() * 5;
    }
    for (const child of [...birds.children]) {
      const bird = child as BirdSprite;
      bird.x += bird.speed * dt;
      bird.flapTime += dt;
      const flap = Math.sin(bird.flapTime * 12);
      bird.leftWing.rotation = -0.4 - flap * 0.5;
      bird.rightWing.rotation = 0.4 + flap * 0.5;
      if (bird.x > VIRTUAL_WIDTH + 20 || bird.x < -20) {
        birds.removeChild(bird);
        bird.destroy({ children: true });
      }
    }
  };

  app.ticker.add(tick);

  return () => {
    app.ticker.remove(tick);
    root.destroy({ children: true });
  };
}

function drawSky(root: Container): void {
  const sky = new Graphics();
  const steps = 24;
  const stepHeight = HORIZON / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const color =
      t < 0.55
        ? lerpColor(palette.sky.dusk[0], palette.sky.dusk[1], t / 0.55)
        : lerpColor(palette.sky.dusk[1], palette.sky.dusk[2], (t - 0.55) / 0.45);
    sky.rect(0, i * stepHeight, VIRTUAL_WIDTH, stepHeight + 1).fill(color);
  }
  // The far hill's silhouette dips below the horizon line on its low side
  // (deepest on the left) — extend the horizon color a little further down
  // so there's never a gap between the sky and the hill's curve.
  const horizonColor = lerpColor(palette.sky.dusk[1], palette.sky.dusk[2], 1);
  sky.rect(0, HORIZON, VIRTUAL_WIDTH, 40).fill(horizonColor);
  root.addChild(sky);
}

function drawSun(root: Container): void {
  const sun = new Graphics();
  const cx = VIRTUAL_WIDTH * 0.76;
  const cy = HORIZON - 22;
  sun.circle(cx, cy, 34).fill({ color: hexToNumber(palette.gold), alpha: 0.12 });
  sun.circle(cx, cy, 22).fill({ color: hexToNumber(palette.gold), alpha: 0.22 });
  sun.circle(cx, cy, 13).fill({ color: 0xfff1c9, alpha: 0.9 });
  root.addChild(sun);
}

interface CloudSprite extends Container {
  speed: number;
}

function drawClouds(root: Container): { clouds: CloudSprite[]; shadows: CloudSprite[] } {
  const rng = createRng(1337);
  const clouds: CloudSprite[] = [];
  const shadows: CloudSprite[] = [];
  const positions = [
    { x: 60, y: 34 },
    { x: 180, y: 22 },
    { x: 300, y: 46 },
    { x: 400, y: 28 },
  ];

  const shadowLayer = new Container();
  const cloudLayer = new Container();
  root.addChild(shadowLayer);

  for (const pos of positions) {
    const scale = 0.8 + rng() * 0.6;
    const speed = 2 + rng() * 3;

    const cloud = new Container() as CloudSprite;
    cloud.speed = speed;
    cloud.x = pos.x;
    cloud.y = pos.y;
    cloud.scale.set(scale);
    cloud.addChild(makeCloudPuff(rng));
    cloudLayer.addChild(cloud);
    clouds.push(cloud);

    const shadow = new Container() as CloudSprite;
    shadow.speed = speed;
    shadow.x = pos.x - 40;
    shadow.y = HORIZON + 30 + rng() * 20;
    shadow.scale.set(scale * 1.1, scale * 0.35);
    const shadowGfx = new Graphics();
    shadowGfx.ellipse(0, 0, 26, 10).fill({ color: hexToNumber(palette.sky.dusk[0]), alpha: 0.14 });
    shadow.addChild(shadowGfx);
    shadowLayer.addChild(shadow);
    shadows.push(shadow);
  }

  root.addChild(cloudLayer);
  return { clouds, shadows };
}

/**
 * Builds one handcrafted-feeling cloud from a cluster of irregular puffs in
 * three passes — a cool shadow silhouette peeking from underneath, the cream
 * base, and small warm highlights on the sun-facing puffs — instead of a
 * handful of uniform same-tone circles.
 */
function makeCloudPuff(rng: () => number): Graphics {
  const g = new Graphics();
  const puffs: { x: number; y: number; r: number }[] = [];

  const rowCount = 5 + Math.floor(rng() * 2);
  for (let i = 0; i < rowCount; i++) {
    const t = i / (rowCount - 1);
    const edgeFalloff = Math.max(0.4, 1 - Math.abs(t - 0.5) * 1.5);
    puffs.push({
      x: (t - 0.5) * 44 + (rng() - 0.5) * 4,
      y: -Math.sin(t * Math.PI) * 5 + (rng() - 0.5) * 3,
      r: (6.5 + rng() * 5) * edgeFalloff,
    });
  }
  const topCount = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < topCount; i++) {
    puffs.push({ x: (rng() - 0.5) * 22, y: -9 - rng() * 5, r: 5 + rng() * 4 });
  }

  for (const puff of puffs) {
    g.circle(puff.x - 1, puff.y + 3, puff.r * 0.9).fill({ color: hexToNumber(palette.cloud.shadow), alpha: 0.4 });
  }
  for (const puff of puffs) {
    g.circle(puff.x, puff.y, puff.r).fill({ color: hexToNumber(palette.cloud.base), alpha: 0.95 });
  }
  const highlightPicks = [...puffs].sort((a, b) => a.y - b.y).slice(0, Math.ceil(puffs.length * 0.4));
  for (const puff of highlightPicks) {
    g.circle(puff.x - puff.r * 0.15, puff.y - puff.r * 0.3, puff.r * 0.5).fill({
      color: hexToNumber(palette.cloud.highlight),
      alpha: 0.8,
    });
  }

  return g;
}

function drawFarHill(root: Container): void {
  const hill = new Graphics();
  hill.moveTo(0, HORIZON + 30);
  hill.bezierCurveTo(120, HORIZON - 10, 260, HORIZON + 20, VIRTUAL_WIDTH, HORIZON - 5);
  hill.lineTo(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  hill.lineTo(0, VIRTUAL_HEIGHT);
  hill.closePath();
  hill.fill(hexToNumber(palette.grass.dark));
  root.addChild(hill);
}

function drawTrees(root: Container): void {
  const rng = createRng(42);
  const layer = new Container();
  const treeXs = [26, 88, 150, 320, 388, 448];
  for (const x of treeXs) {
    const baseY = HORIZON + 18 + rng() * 6;
    layer.addChild(buildTree(x, baseY, rng));
  }
  root.addChild(layer);
}

function drawNearHill(root: Container): void {
  const hill = new Graphics();
  hill.moveTo(0, HORIZON + 46);
  hill.bezierCurveTo(140, HORIZON + 18, 300, HORIZON + 52, VIRTUAL_WIDTH, HORIZON + 24);
  hill.lineTo(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  hill.lineTo(0, VIRTUAL_HEIGHT);
  hill.closePath();
  hill.fill(hexToNumber(palette.grass.base));
  root.addChild(hill);
}

/**
 * The foreground ground: a plain grass fill with soft dappled shading, then
 * a scatter of more trees (the same handcrafted `buildTree`), a few dead
 * trees, rocks and bushes — a cozy forest floor instead of a flower/blade
 * pattern repeated everywhere. A column around the menu is left clear.
 */
function drawForestFloor(root: Container): void {
  const rng = createRng(7);
  const layer = new Container();
  const fieldTop = HORIZON + 30;

  const field = new Graphics();
  field.rect(0, fieldTop, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - fieldTop).fill(hexToNumber(palette.grass.base));
  for (let i = 0; i < 14; i++) {
    const px = rng() * VIRTUAL_WIDTH;
    const py = fieldTop + rng() * (VIRTUAL_HEIGHT - fieldTop);
    const tint = hexToNumber(rng() > 0.5 ? palette.grass.light : palette.grass.dark);
    const blobCount = 3 + Math.floor(rng() * 2);
    for (let b = 0; b < blobCount; b++) {
      const bx = px + (rng() - 0.5) * 20;
      const by = py + (rng() - 0.5) * 12;
      const br = 6 + rng() * 8;
      field.circle(bx, by, br).fill({ color: tint, alpha: 0.05 });
    }
  }
  field.zIndex = fieldTop;
  layer.addChild(field);

  const menuSafeX = { min: VIRTUAL_WIDTH / 2 - 115, max: VIRTUAL_WIDTH / 2 + 115 };
  const scatterRng = createRng(203);
  const propCount = 38;
  for (let i = 0; i < propCount; i++) {
    const x = scatterRng() * VIRTUAL_WIDTH;
    const y = fieldTop + 6 + scatterRng() * (VIRTUAL_HEIGHT - fieldTop - 8);
    if (x > menuSafeX.min && x < menuSafeX.max) continue;

    const roll = scatterRng();
    let prop: Graphics;
    if (roll < 0.5) {
      prop = buildTree(x, y, scatterRng);
    } else if (roll < 0.6) {
      prop = buildDeadTree(x, y, scatterRng);
    } else if (roll < 0.75) {
      prop = buildBush(x, y, scatterRng);
    } else if (roll < 0.9) {
      prop = buildRock(x, y, scatterRng, 0.7 + scatterRng() * 0.8);
    } else {
      prop = buildFlower(x, y, scatterRng);
    }
    prop.zIndex = y;
    layer.addChild(prop);
  }

  // A little extra life just outside the menu's safe column — flanking
  // trees and rocks so the center doesn't feel emptier than the edges,
  // while the safe column itself stays completely clear.
  const flankRng = createRng(509);
  const flankBand = 46;
  for (const side of [-1, 1]) {
    const edge = side < 0 ? menuSafeX.min : menuSafeX.max;
    for (let i = 0; i < 3; i++) {
      const x = edge + side * (6 + flankRng() * flankBand);
      const y = fieldTop + 10 + flankRng() * (VIRTUAL_HEIGHT - fieldTop - 14);
      const roll = flankRng();
      const prop = roll < 0.55 ? buildTree(x, y, flankRng) : buildRock(x, y, flankRng, 0.7 + flankRng() * 0.7);
      prop.zIndex = y;
      layer.addChild(prop);
    }
  }

  layer.sortableChildren = true;
  root.addChild(layer);
}

interface BirdSprite extends Container {
  speed: number;
  flapTime: number;
  leftWing: Graphics;
  rightWing: Graphics;
}

function spawnBird(parent: Container): void {
  const fromLeft = Math.random() > 0.5;
  const bird = new Container() as BirdSprite;
  bird.y = 20 + Math.random() * 50;
  bird.x = fromLeft ? -20 : VIRTUAL_WIDTH + 20;
  bird.speed = (fromLeft ? 1 : -1) * (16 + Math.random() * 8);
  bird.flapTime = Math.random() * 10;

  const body = new Graphics();
  body.circle(0, 0, 1.6).fill(0x2a1c12);
  bird.addChild(body);

  const leftWing = new Graphics();
  leftWing.moveTo(0, 0).lineTo(-5, -2).stroke({ width: 1.4, color: 0x2a1c12 });
  leftWing.x = -1;
  bird.addChild(leftWing);

  const rightWing = new Graphics();
  rightWing.moveTo(0, 0).lineTo(5, -2).stroke({ width: 1.4, color: 0x2a1c12 });
  rightWing.x = 1;
  bird.addChild(rightWing);

  bird.leftWing = leftWing;
  bird.rightWing = rightWing;
  parent.addChild(bird);
}
