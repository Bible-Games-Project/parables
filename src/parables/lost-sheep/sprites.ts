import { Container, Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { createRng } from "@/pixel-art/prng";
import { palette } from "@/pixel-art/palette";

// ---------------------------------------------------------------------------
// Shepherd — a multi-part rig (head/robe/legs/arms/staff) so entities.ts can
// drive a real walk cycle and idle sway instead of a single flat bob.
// ---------------------------------------------------------------------------

export interface ShepherdVisual {
  container: Container;
  body: Container;
  torso: Container;
  head: Container;
  leftLeg: Container;
  rightLeg: Container;
  frontArm: Container;
  staffArm: Container;
}

function buildShepherdHead(): Container {
  const head = new Container();
  const g = new Graphics();
  g.circle(0, 0, 5.3).fill(hexToNumber(palette.skin.base));
  g.circle(1.8, 0.7, 3.6).fill({ color: hexToNumber(palette.skin.shadow), alpha: 0.32 });
  // Ears.
  g.circle(-5, 0.6, 1.1).fill(hexToNumber(palette.skin.base));
  g.circle(5, 0.6, 1.1).fill(hexToNumber(palette.skin.base));
  // Hair — fuller, side-swept, with a highlight streak for volume.
  g.ellipse(0, -3.1, 5.6, 3.5).fill(hexToNumber(palette.hair.base));
  g.ellipse(0, -4, 5.6, 2.2).fill({ color: hexToNumber(palette.hair.shadow), alpha: 0.5 });
  g.ellipse(-1.4, -4.4, 2.4, 1.1).fill({ color: hexToNumber(palette.hair.highlight), alpha: 0.7 });
  g.ellipse(-4.7, -1.1, 1.5, 2.2).fill(hexToNumber(palette.hair.base));
  g.ellipse(4.7, -1.1, 1.5, 2.2).fill(hexToNumber(palette.hair.base));
  // Eyebrows.
  g.rect(-3, -1.9, 2.2, 0.7).fill(hexToNumber(palette.hair.shadow));
  g.rect(0.8, -1.9, 2.2, 0.7).fill(hexToNumber(palette.hair.shadow));
  // Eyes.
  g.circle(-1.8, -0.4, 0.6).fill(hexToNumber(palette.ink));
  g.circle(1.8, -0.4, 0.6).fill(hexToNumber(palette.ink));
  g.circle(-1.6, -0.6, 0.2).fill({ color: 0xffffff, alpha: 0.85 });
  g.circle(2, -0.6, 0.2).fill({ color: 0xffffff, alpha: 0.85 });
  // Nose hint + beard.
  g.rect(-0.4, 0.4, 0.8, 1.4).fill({ color: hexToNumber(palette.skin.shadow), alpha: 0.5 });
  g.poly([-3.6, 1.1, 3.6, 1.1, 2.2, 5.2, 0, 6.4, -2.2, 5.2]).fill(hexToNumber(palette.hair.base));
  g.poly([-1.1, 1.5, 1.1, 1.5, 0.7, 4.5, -0.7, 4.5]).fill({ color: hexToNumber(palette.hair.shadow), alpha: 0.6 });
  g.poly([-2.4, 1.4, -0.6, 1.4, -1, 3.6]).fill({ color: hexToNumber(palette.hair.highlight), alpha: 0.35 });
  head.addChild(g);
  return head;
}

function buildStaff(): Container {
  const staff = new Container();
  const g = new Graphics();
  g.rect(-1, -26, 2, 33).fill(hexToNumber(palette.wood.base));
  g.rect(-1, -26, 1, 33).fill(hexToNumber(palette.wood.dark));
  g.rect(0.3, -25, 0.5, 24).fill({ color: hexToNumber(palette.wood.highlight), alpha: 0.8 });
  g.moveTo(0, -26).arc(-2.4, -25.4, 2.6, 0, Math.PI * 1.3).stroke({ width: 1.7, color: hexToNumber(palette.wood.dark) });
  g.moveTo(0.2, -26.2).arc(-2.2, -25.6, 2.4, 0.1, Math.PI * 1.15).stroke({
    width: 0.7,
    color: hexToNumber(palette.wood.highlight),
    alpha: 0.7,
  });
  staff.addChild(g);
  return staff;
}

function buildShepherdLeg(): Container {
  const leg = new Container();
  const g = new Graphics();
  g.rect(-1.5, 3.4, 3, 5.2).fill(hexToNumber(palette.skin.base));
  g.rect(-1.5, 3.4, 1.5, 5.2).fill({ color: hexToNumber(palette.skin.shadow), alpha: 0.5 });
  g.rect(-1.7, 8, 3.4, 1.5).fill(hexToNumber(palette.hair.base));
  g.rect(-1.7, 9.5, 3.4, 1.2).fill(hexToNumber(palette.skin.highlight));
  leg.addChild(g);
  return leg;
}

function buildShepherdArm(withSleeveTrim: boolean): Container {
  const arm = new Container();
  const g = new Graphics();
  g.rect(-1.4, 0, 2.8, 5.3).fill(hexToNumber(palette.robe.base));
  g.rect(-1.4, 0, 1.4, 5.3).fill(hexToNumber(palette.robe.shadow));
  if (withSleeveTrim) {
    g.rect(-1.5, 4.1, 3, 0.9).fill({ color: hexToNumber(palette.gold), alpha: 0.8 });
  }
  g.circle(0, 6.1, 1.5).fill(hexToNumber(palette.skin.base));
  arm.addChild(g);
  return arm;
}

/** The robe and its draped mantle, grouped so idle breathing can gently scale the torso without touching the facing flip on `body`. */
function buildShepherdTorso(): Container {
  const torso = new Container();

  const robe = new Graphics();
  robe.poly([-5.2, -15, 5.2, -15, 7, -3.5, -7, -3.5]).fill(hexToNumber(palette.robe.base));
  robe.poly([-5.2, -15, -1.2, -15, -2.2, -3.5, -7, -3.5]).fill(hexToNumber(palette.robe.shadow));
  robe.poly([2.4, -15, 5.2, -15, 7, -3.5, 3.4, -3.5]).fill({ color: hexToNumber(palette.robe.highlight), alpha: 0.5 });
  robe.rect(-1, -12.6, 0.6, 8.6).fill({ color: hexToNumber(palette.robe.shadow), alpha: 0.55 });
  robe.rect(1.6, -11.7, 0.6, 7.4).fill({ color: hexToNumber(palette.robe.shadow), alpha: 0.45 });
  robe.rect(-6, -8.9, 12, 1.7).fill(hexToNumber(palette.gold));
  robe.rect(-6, -8.9, 12, 0.6).fill({ color: 0xfff0c0, alpha: 0.55 });

  // Mantle: a rustier wrap over both shoulders, layered on top of the robe
  // so the silhouette immediately reads as shepherd's clothing.
  const mantle = new Graphics();
  mantle.poly([-6.3, -16, -1.8, -15.6, -3, -6.5, -6.8, -7.8]).fill(hexToNumber(palette.mantle.base));
  mantle.poly([-6.3, -16, -4.4, -15.8, -4.9, -10, -6.8, -10.6]).fill({
    color: hexToNumber(palette.mantle.shadow),
    alpha: 0.6,
  });
  mantle.poly([4.6, -16, 6.9, -15, 5.7, -9, 3.4, -9.4]).fill(hexToNumber(palette.mantle.base));
  mantle.poly([4.6, -16, 6, -15.3, 5.6, -12, 4, -12]).fill({ color: hexToNumber(palette.mantle.highlight), alpha: 0.4 });
  mantle.circle(-5.4, -15.4, 1.2).fill(hexToNumber(palette.gold));

  torso.addChild(robe, mantle);
  return torso;
}

export function createShepherdSprite(): ShepherdVisual {
  const container = new Container();
  const body = new Container();

  const torso = buildShepherdTorso();

  const leftLeg = buildShepherdLeg();
  leftLeg.position.set(-3, -3.5);
  const rightLeg = buildShepherdLeg();
  rightLeg.position.set(3, -3.5);

  const frontArm = buildShepherdArm(false);
  frontArm.position.set(-6, -14);

  const staffArm = buildShepherdArm(true);
  staffArm.position.set(6, -14);
  const staff = buildStaff();
  staff.position.set(0, 6.1);
  staffArm.addChild(staff);

  const head = buildShepherdHead();
  head.position.set(0, -20);

  body.addChild(leftLeg, rightLeg, torso, frontArm, staffArm, head);
  container.addChild(body);

  return { container, body, torso, head, leftLeg, rightLeg, frontArm, staffArm };
}

// ---------------------------------------------------------------------------
// Sheep — used for both the lost sheep and the flock. A clustered wool
// silhouette plus a head that can dip for grazing and legs that lift for a
// walk cycle.
// ---------------------------------------------------------------------------

export interface SheepVisual {
  container: Container;
  body: Container;
  head: Container;
  frontLeg: Container;
  backLeg: Container;
}

export function createSheepSprite(scale = 1): SheepVisual {
  const container = new Container();
  const body = new Container();

  const shadow = new Graphics();
  shadow.ellipse(0.5, 4.6, 5.4, 1.8).fill({ color: 0x0a0603, alpha: 0.28 });

  const woolPuffs = [
    { dx: -4.2, dy: 0.4, r: 3.6 },
    { dx: -1.2, dy: -1.6, r: 4.4 },
    { dx: 2.2, dy: -1, r: 4 },
    { dx: 4.6, dy: 0.8, r: 3 },
    { dx: 0.4, dy: 1.8, r: 3.6 },
  ];
  const wool = new Graphics();
  for (const p of woolPuffs) {
    wool.circle(p.dx - 0.6, p.dy + 1.4, p.r * 0.92).fill(hexToNumber(palette.wool.shadow));
  }
  for (const p of woolPuffs) {
    wool.circle(p.dx, p.dy, p.r * 0.84).fill(hexToNumber(palette.wool.base));
  }
  for (const p of woolPuffs.filter((p) => p.dy < 0)) {
    wool.circle(p.dx + 0.5, p.dy - 0.8, p.r * 0.45).fill({ color: hexToNumber(palette.wool.highlight), alpha: 0.85 });
  }

  // Legs pivot at the hip (local 0,0) and extend straight down, so a walk
  // cycle can rotate them like a pendulum — always fully visible below the
  // wool — instead of lifting them up into hiding under it.
  const frontLeg = new Container();
  {
    const g = new Graphics();
    g.rect(-1, 0, 2, 4.2).fill(hexToNumber(palette.ink));
    g.rect(-1, 3, 2, 1.2).fill(hexToNumber(palette.hair.shadow));
    frontLeg.addChild(g);
  }
  frontLeg.position.set(-2, 2);

  const backLeg = new Container();
  {
    const g = new Graphics();
    g.rect(-1, 0, 2, 4.2).fill(hexToNumber(palette.ink));
    g.rect(-1, 3, 2, 1.2).fill(hexToNumber(palette.hair.shadow));
    backLeg.addChild(g);
  }
  backLeg.position.set(3, 2.2);

  const head = new Container();
  {
    const g = new Graphics();
    g.poly([-2.8, -0.8, -4.6, -1.9, -3.3, 0.5]).fill(hexToNumber(palette.ink));
    g.poly([2.8, -0.8, 4.6, -1.9, 3.3, 0.5]).fill(hexToNumber(palette.ink));
    g.circle(0, 0, 3.1).fill(hexToNumber(palette.ink));
    g.circle(-1.6, -2.4, 1.4).fill(hexToNumber(palette.wool.base));
    g.circle(-1, -0.3, 0.4).fill({ color: 0xffffff, alpha: 0.85 });
    g.circle(1, -0.3, 0.4).fill({ color: 0xffffff, alpha: 0.85 });
    head.addChild(g);
  }
  head.position.set(6.4, -1.4);

  // Legs are added after the wool so they always render on top of it, fully readable while walking.
  body.addChild(shadow, wool, frontLeg, backLeg, head);
  body.scale.set(scale);
  container.addChild(body);

  return { container, body, head, frontLeg, backLeg };
}

// ---------------------------------------------------------------------------
// Wolf — an elongated, low silhouette with a distinct head/tail so it reads
// as a predator, with legs and tail driven from entities.ts for a run gait.
// ---------------------------------------------------------------------------

export interface WolfVisual {
  container: Container;
  body: Container;
  head: Container;
  tail: Container;
  frontLeg: Container;
  backLeg: Container;
}

export function createWolfSprite(): WolfVisual {
  const container = new Container();
  const body = new Container();

  const torso = new Graphics();
  torso.ellipse(0, -3, 7.6, 3.1).fill({ color: hexToNumber(palette.fur.shadow), alpha: 0.7 });
  torso.ellipse(-3.2, -6.2, 5.6, 3.8).fill(hexToNumber(palette.fur.base));
  torso.ellipse(4, -7, 5.2, 3.8).fill(hexToNumber(palette.fur.base));
  torso.ellipse(0.4, -8.4, 5.8, 2.1).fill({ color: hexToNumber(palette.fur.light), alpha: 0.75 });
  torso.ellipse(-1.6, -4, 3.6, 1.6).fill({ color: hexToNumber(palette.fur.belly), alpha: 0.6 });

  const tail = new Container();
  {
    const g = new Graphics();
    g.poly([0, 0, -3, -0.8, -6, 0.6, -7.4, 2.8, -4.4, 1.8, -1.4, 1.6]).fill(hexToNumber(palette.fur.base));
    g.poly([-4, 0.6, -6.4, 1, -7, 2.4]).fill({ color: hexToNumber(palette.fur.shadow), alpha: 0.6 });
    tail.addChild(g);
  }
  tail.position.set(-7.6, -5.6);

  const head = new Container();
  {
    const g = new Graphics();
    g.poly([-2.6, -1.2, 3.2, -2.6, 5.4, -1, 3.4, 0.8, -2.6, 1.2]).fill(hexToNumber(palette.fur.base));
    g.poly([3.4, -1.6, 5.4, -1, 4.2, 0.1]).fill({ color: hexToNumber(palette.fur.shadow), alpha: 0.6 });
    g.poly([-1.8, -1.2, -2.8, -4.2, -0.5, -1.9]).fill(hexToNumber(palette.fur.base));
    g.poly([0.6, -1.7, 0.4, -4.6, 2.3, -2.1]).fill(hexToNumber(palette.fur.base));
    g.poly([-1.5, -1.5, -2.1, -3.4, -0.8, -1.9]).fill({ color: hexToNumber(palette.fur.shadow), alpha: 0.6 });
    g.circle(3, -1.5, 0.5).fill(hexToNumber(palette.fur.eye));
    g.circle(3.5, -0.7, 0.5).fill(hexToNumber(palette.fur.eye));
    head.addChild(g);
  }
  head.position.set(6.4, -6.6);

  const frontLeg = new Container();
  {
    const g = new Graphics();
    g.rect(-1.1, 0, 2.2, 5).fill(hexToNumber(palette.fur.shadow));
    g.rect(-1.1, 0, 1.1, 5).fill(hexToNumber(palette.fur.base));
    frontLeg.addChild(g);
  }
  frontLeg.position.set(3.4, -3.4);

  const backLeg = new Container();
  {
    const g = new Graphics();
    g.rect(-1.1, 0, 2.2, 5).fill(hexToNumber(palette.fur.shadow));
    g.rect(-1.1, 0, 1.1, 5).fill(hexToNumber(palette.fur.base));
    backLeg.addChild(g);
  }
  backLeg.position.set(-3.6, -3.2);

  body.addChild(tail, backLeg, frontLeg, torso, head);
  container.addChild(body);

  return { container, body, head, tail, frontLeg, backLeg };
}

// ---------------------------------------------------------------------------
// Fence — a proper post-and-rail enclosure with a gap left open for the gate.
// ---------------------------------------------------------------------------

function drawFencePost(g: Graphics, x: number, y: number, rng: () => number): void {
  const h = 12 + rng() * 4;
  const topY = y - h * 0.62;
  const botY = y + h * 0.38;
  const w = 1.6 + rng() * 0.4;
  g.ellipse(x + 0.8, botY + 1, 2.2, 1).fill({ color: 0x120a06, alpha: 0.24 });
  g.rect(x - w, topY + 2, w, botY - topY - 2).fill(hexToNumber(palette.wood.darker));
  g.rect(x, topY + 2, w, botY - topY - 2).fill(hexToNumber(palette.wood.dark));
  g.rect(x + w * 0.3, topY + 2, w * 0.35, (botY - topY - 2) * 0.7).fill(hexToNumber(palette.wood.light));
  g.poly([x - w, topY + 2, x + w, topY + 2, x + (rng() - 0.5), topY - 1.6]).fill(hexToNumber(palette.wood.base));
}

function drawHorizontalRails(g: Graphics, x1: number, x2: number, y: number): void {
  if (x2 <= x1) return;
  const thickness = 2.3;
  for (const offset of [-4.4, 3.4]) {
    const ry = y + offset;
    g.rect(x1, ry - thickness / 2, x2 - x1, thickness).fill(hexToNumber(palette.wood.dark));
    g.rect(x1, ry - thickness / 2, x2 - x1, thickness * 0.4).fill({
      color: hexToNumber(palette.wood.light),
      alpha: 0.6,
    });
    g.rect(x1, ry + thickness / 2 - 0.5, x2 - x1, 0.5).fill({ color: hexToNumber(palette.wood.darker), alpha: 0.6 });
  }
}

function drawVerticalRails(g: Graphics, y1: number, y2: number, x: number): void {
  const thickness = 2.3;
  for (const offset of [-4.4, 3.4]) {
    const rx = x + offset;
    g.rect(rx - thickness / 2, y1, thickness, y2 - y1).fill(hexToNumber(palette.wood.dark));
    g.rect(rx - thickness / 2, y1, thickness * 0.4, y2 - y1).fill({
      color: hexToNumber(palette.wood.light),
      alpha: 0.6,
    });
    g.rect(rx + thickness / 2 - 0.5, y1, 0.5, y2 - y1).fill({ color: hexToNumber(palette.wood.darker), alpha: 0.6 });
  }
}

/** A handcrafted post-and-rail fence around the pen, with a gap left open for the gate. */
export function createFenceOutline(width: number, height: number, gate: { x: number; width: number }): Container {
  const container = new Container();
  const g = new Graphics();
  const rng = createRng(2451);
  const postSpacing = 15;

  drawHorizontalRails(g, 0, gate.x, height);
  drawHorizontalRails(g, gate.x + gate.width, width, height);
  drawHorizontalRails(g, 0, width, 0);
  drawVerticalRails(g, 0, height, 0);
  drawVerticalRails(g, 0, height, width);

  for (let x = 0; x <= width; x += postSpacing) {
    drawFencePost(g, x, 0, rng);
  }
  for (let x = 0; x <= width; x += postSpacing) {
    if (x > gate.x - postSpacing * 0.4 && x < gate.x + gate.width + postSpacing * 0.4) continue;
    drawFencePost(g, x, height, rng);
  }
  drawFencePost(g, gate.x, height, rng);
  drawFencePost(g, gate.x + gate.width, height, rng);
  for (let y = postSpacing; y < height; y += postSpacing) {
    drawFencePost(g, 0, y, rng);
    drawFencePost(g, width, y, rng);
  }

  container.addChild(g);
  return container;
}
