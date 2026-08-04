import { Application, Container, Graphics } from "pixi.js";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "@/engine/constants";
import { hexToNumber, lerpColor } from "@/pixel-art/color";
import { createRng } from "@/pixel-art/prng";
import { palette } from "@/pixel-art/palette";

const HORIZON = 168;

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
  const grassBlades = drawGrassField(root);
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

    for (const blade of grassBlades) {
      blade.rotation = Math.sin(elapsed * 1.6 + blade.phase) * 0.12;
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
    cloud.addChild(makeCloudPuff());
    cloudLayer.addChild(cloud);
    clouds.push(cloud);

    const shadow = new Container() as CloudSprite;
    shadow.speed = speed;
    shadow.x = pos.x - 40;
    shadow.y = HORIZON + 30 + rng() * 20;
    shadow.scale.set(scale * 1.1, scale * 0.35);
    const shadowGfx = new Graphics();
    shadowGfx.ellipse(0, 0, 26, 10).fill({ color: 0x1a1108, alpha: 0.1 });
    shadow.addChild(shadowGfx);
    shadowLayer.addChild(shadow);
    shadows.push(shadow);
  }

  root.addChild(cloudLayer);
  return { clouds, shadows };
}

function makeCloudPuff(): Graphics {
  const g = new Graphics();
  const puffs = [
    { x: -18, y: 4, r: 10 },
    { x: 0, y: -4, r: 14 },
    { x: 18, y: 4, r: 11 },
    { x: -4, y: 8, r: 12 },
  ];
  for (const puff of puffs) {
    g.circle(puff.x, puff.y, puff.r).fill({ color: 0xfff6e6, alpha: 0.85 });
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
    const tree = new Graphics();
    tree.rect(x - 2, baseY - 10, 4, 14).fill(hexToNumber(palette.wood.darker));
    tree.circle(x, baseY - 20, 12).fill(hexToNumber(palette.grass.dark));
    tree.circle(x - 7, baseY - 14, 9).fill(hexToNumber(palette.grass.base));
    tree.circle(x + 7, baseY - 14, 9).fill(hexToNumber(palette.grass.base));
    tree.circle(x, baseY - 26, 8).fill(hexToNumber(palette.grass.light));
    layer.addChild(tree);
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

interface Blade extends Graphics {
  phase: number;
}

function drawGrassField(root: Container): Blade[] {
  const rng = createRng(7);
  const layer = new Container();
  const fieldTop = HORIZON + 60;

  const field = new Graphics();
  field.rect(0, fieldTop, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - fieldTop).fill(hexToNumber(palette.grass.base));
  layer.addChild(field);

  // Scattered flowers.
  const flowerColors = [0xd1453b, 0xe8b23d, 0xb583c9];
  for (let i = 0; i < 26; i++) {
    const fx = rng() * VIRTUAL_WIDTH;
    const fy = fieldTop + 6 + rng() * (VIRTUAL_HEIGHT - fieldTop - 10);
    const flower = new Graphics();
    const color = flowerColors[Math.floor(rng() * flowerColors.length)];
    flower.circle(fx, fy, 1.6).fill(color);
    layer.addChild(flower);
  }

  const blades: Blade[] = [];
  for (let x = 4; x < VIRTUAL_WIDTH; x += 9) {
    const y = fieldTop + rng() * (VIRTUAL_HEIGHT - fieldTop - 6);
    const blade = new Graphics() as Blade;
    blade.rect(-1, -7, 2, 7).fill(hexToNumber(palette.grass.light));
    blade.x = x;
    blade.y = y;
    blade.phase = rng() * Math.PI * 2;
    layer.addChild(blade);
    blades.push(blade);
  }

  root.addChild(layer);
  return blades;
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
