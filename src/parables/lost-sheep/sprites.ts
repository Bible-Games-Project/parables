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
  g.circle(-1.6, -1.8, 2).fill({ color: hexToNumber(palette.skin.highlight), alpha: 0.4 });
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
  // Eyes — a readable, gentle expression: dark iris with a bright catchlight.
  g.circle(-1.8, -0.4, 0.65).fill(hexToNumber(palette.ink));
  g.circle(1.8, -0.4, 0.65).fill(hexToNumber(palette.ink));
  g.circle(-1.6, -0.6, 0.22).fill({ color: 0xffffff, alpha: 0.9 });
  g.circle(2, -0.6, 0.22).fill({ color: 0xffffff, alpha: 0.9 });
  // Nose hint, soft mouth, and a fuller beard with its own texture.
  g.rect(-0.4, 0.4, 0.8, 1.4).fill({ color: hexToNumber(palette.skin.shadow), alpha: 0.5 });
  g.rect(-1, 1.9, 2, 0.5).fill({ color: hexToNumber(palette.skin.shadow), alpha: 0.4 });
  g.poly([-3.8, 1.1, 3.8, 1.1, 2.4, 5.6, 0, 6.9, -2.4, 5.6]).fill(hexToNumber(palette.hair.base));
  g.poly([-1.1, 1.5, 1.1, 1.5, 0.7, 4.8, -0.7, 4.8]).fill({ color: hexToNumber(palette.hair.shadow), alpha: 0.6 });
  g.poly([-2.6, 1.5, -0.7, 1.5, -1.1, 3.9]).fill({ color: hexToNumber(palette.hair.highlight), alpha: 0.4 });
  g.poly([1.3, 1.5, 2.7, 1.7, 1.6, 4.3]).fill({ color: hexToNumber(palette.hair.highlight), alpha: 0.25 });
  head.addChild(g);
  return head;
}

/** A proper shepherd's crook: a grained shaft, a bound leather grip, and a filled hook silhouette (not just an outline) so it reads clearly as a crook at a glance. */
function buildStaff(): Container {
  const staff = new Container();
  const g = new Graphics();
  g.rect(-1, -22, 2, 29).fill(hexToNumber(palette.wood.base));
  g.rect(-1, -22, 1, 29).fill(hexToNumber(palette.wood.dark));
  g.rect(0.3, -21, 0.5, 20).fill({ color: hexToNumber(palette.wood.highlight), alpha: 0.75 });
  // Fine grain flecks along the shaft.
  for (const gy of [-17, -11, -5, 1, 5]) {
    g.rect(-1, gy, 2, 0.6).fill({ color: hexToNumber(palette.wood.darker), alpha: 0.35 });
  }
  // Leather-wrapped grip band.
  g.rect(-1.4, -4, 2.8, 4.2).fill({ color: hexToNumber(palette.mantle.shadow), alpha: 0.85 });
  for (const gy of [-3.2, -1.8, -0.4]) {
    g.rect(-1.4, gy, 2.8, 0.5).fill({ color: hexToNumber(palette.mantle.base), alpha: 0.7 });
  }
  // Filled crook — a curled hook silhouette, not just a thin arc, so it
  // instantly reads as a shepherd's staff.
  g.moveTo(0, -22)
    .bezierCurveTo(-1, -27, -6.4, -27.6, -6.6, -23.4)
    .bezierCurveTo(-6.8, -19.8, -2.4, -19.6, -1.4, -22.4)
    .bezierCurveTo(-0.9, -23.8, 0.4, -23.4, 0, -22)
    .closePath()
    .fill(hexToNumber(palette.wood.dark));
  g.moveTo(-0.6, -22.4)
    .bezierCurveTo(-1.6, -26, -5.8, -26.4, -5.9, -23.4)
    .bezierCurveTo(-6, -20.8, -3, -20.6, -2.2, -22.6)
    .stroke({ width: 0.6, color: hexToNumber(palette.wood.highlight), alpha: 0.6 });
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
  // A couple of soft fabric-fold creases for dimensionality.
  robe.moveTo(-3.6, -10.8).lineTo(-3, -4.6).stroke({ width: 0.5, color: hexToNumber(palette.robe.shadow), alpha: 0.3 });
  robe.moveTo(4, -10.4).lineTo(4.6, -4.4).stroke({ width: 0.5, color: hexToNumber(palette.robe.shadow), alpha: 0.3 });
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
  // A small clasp pin — the warm gold ring holds a tiny cool bead, a subtle
  // complementary-color accent against the otherwise all-warm palette.
  mantle.circle(-5.4, -15.4, 1.2).fill(hexToNumber(palette.gold));
  mantle.circle(-5.4, -15.4, 0.55).fill(0x5f8f8a);

  torso.addChild(robe, mantle);
  return torso;
}

export function createShepherdSprite(): ShepherdVisual {
  const container = new Container();
  const body = new Container();

  // A soft ground-contact shadow, matching the sheep's shadow style exactly
  // (same color/alpha), scaled up for the shepherd's bigger footprint.
  const shadow = new Graphics();
  shadow.ellipse(0.5, 7.6, 7.2, 2.3).fill({ color: 0x0a0603, alpha: 0.28 });

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

  body.addChild(shadow, leftLeg, rightLeg, torso, frontArm, staffArm, head);
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
  shadow.ellipse(0.5, 9.2, 5.6, 1.9).fill({ color: 0x0a0603, alpha: 0.28 });

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

  // Legs pivot right at the wool's lower edge (local 0,0) and extend
  // straight down to the ground, so a walk cycle can rotate them like a
  // pendulum that reads as sprouting from the belly instead of the
  // mid-body — always fully visible below the wool, never tucked under it.
  const frontLeg = new Container();
  {
    const g = new Graphics();
    g.rect(-1, 0, 2, 4.4).fill(hexToNumber(palette.ink));
    g.rect(-1, 3.2, 2, 1.2).fill(hexToNumber(palette.hair.shadow));
    frontLeg.addChild(g);
  }
  frontLeg.position.set(-2, 5.2);

  const backLeg = new Container();
  {
    const g = new Graphics();
    g.rect(-1, 0, 2, 4.4).fill(hexToNumber(palette.ink));
    g.rect(-1, 3.2, 2, 1.2).fill(hexToNumber(palette.hair.shadow));
    backLeg.addChild(g);
  }
  backLeg.position.set(3, 5.4);

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

/**
 * A weathered post built entirely from `palette.fence`'s dark, desaturated
 * monochrome ramp: a grain-striped shaft (several thin vertical bands
 * instead of a flat two-tone split), a knot, a chamfered top cap, and a
 * grounding contact shadow. Highlights stay thin and muted — never a bright
 * wash — to keep the whole thing reading as old, elegant timber.
 */
function drawFencePost(g: Graphics, x: number, y: number, rng: () => number): void {
  const h = 12 + rng() * 4;
  const topY = y - h * 0.62;
  const botY = y + h * 0.38;
  const w = 1.9 + rng() * 0.4;
  const shaftTop = topY + 2;
  const shaftHeight = botY - shaftTop;

  g.ellipse(x + 0.8, botY + 1, 2.4, 1.1).fill({ color: 0x0a0603, alpha: 0.3 });

  // Base shaft.
  g.rect(x - w, shaftTop, w * 2, shaftHeight).fill(hexToNumber(palette.fence.dark));

  // Vertical grain striations — several thin bands of darker/lighter fence
  // tones instead of one flat split, for a hand-carved plank feel.
  const grainCount = 4 + Math.floor(rng() * 2);
  for (let i = 0; i < grainCount; i++) {
    const gx = x - w + (i / grainCount) * w * 2 + rng() * 0.3;
    const gw = 0.4 + rng() * 0.3;
    const shade = rng() > 0.5 ? palette.fence.darkest : palette.fence.base;
    g.rect(gx, shaftTop, gw, shaftHeight).fill({ color: hexToNumber(shade), alpha: 0.55 });
  }

  // A single thin, muted highlight edge on the lit side only — subtle, not bright.
  g.rect(x + w * 0.55, shaftTop, w * 0.22, shaftHeight * 0.85).fill({
    color: hexToNumber(palette.fence.mid),
    alpha: 0.5,
  });

  // Knot.
  g.ellipse(x - w * 0.2 + rng() * w * 0.4, shaftTop + shaftHeight * (0.35 + rng() * 0.3), 0.9, 0.7).fill({
    color: hexToNumber(palette.fence.darkest),
    alpha: 0.7,
  });

  // Weathered split-log cap.
  g.poly([x - w, shaftTop, x + w, shaftTop, x + w * 0.3 + (rng() - 0.5), topY - 1.8]).fill(
    hexToNumber(palette.fence.base),
  );
  g.poly([x - w, shaftTop, x, shaftTop, x - w * 0.1, topY - 0.6]).fill({
    color: hexToNumber(palette.fence.darkest),
    alpha: 0.4,
  });
}

/** A rail plank with fine horizontal grain lines and a thin muted highlight along its lit edge, built from the dark `palette.fence` ramp only. */
function drawGrainedRail(g: Graphics, x1: number, x2: number, ry: number, thickness: number, rng: () => number): void {
  if (x2 <= x1) return;
  g.rect(x1, ry - thickness / 2, x2 - x1, thickness).fill(hexToNumber(palette.fence.base));

  // Fine horizontal grain streaks.
  const streaks = Math.max(2, Math.round((x2 - x1) / 10));
  for (let i = 0; i < streaks; i++) {
    const sx = x1 + rng() * (x2 - x1);
    const sw = 4 + rng() * 6;
    const sy = ry - thickness / 2 + rng() * thickness;
    const shade = rng() > 0.5 ? palette.fence.darkest : palette.fence.dark;
    g.rect(Math.min(sx, x2 - sw), sy, Math.min(sw, x2 - x1), Math.max(0.5, thickness * 0.18)).fill({
      color: hexToNumber(shade),
      alpha: 0.5,
    });
  }

  g.rect(x1, ry - thickness / 2, x2 - x1, thickness * 0.28).fill({
    color: hexToNumber(palette.fence.mid),
    alpha: 0.35,
  });
  g.rect(x1, ry + thickness / 2 - 0.5, x2 - x1, 0.5).fill({ color: hexToNumber(palette.fence.darkest), alpha: 0.7 });
}

function drawHorizontalRails(g: Graphics, x1: number, x2: number, y: number, rng: () => number): void {
  if (x2 <= x1) return;
  for (const offset of [-4.4, 3.4]) {
    drawGrainedRail(g, x1, x2, y + offset, 2.3, rng);
  }
}

function drawVerticalRails(g: Graphics, y1: number, y2: number, x: number, rng: () => number): void {
  for (const offset of [-4.4, 3.4]) {
    const rx = x + offset;
    const thickness = 2.3;
    g.rect(rx - thickness / 2, y1, thickness, y2 - y1).fill(hexToNumber(palette.fence.base));
    const streaks = Math.max(2, Math.round((y2 - y1) / 10));
    for (let i = 0; i < streaks; i++) {
      const sy = y1 + rng() * (y2 - y1);
      const sh = 4 + rng() * 6;
      const sx = rx - thickness / 2 + rng() * thickness;
      const shade = rng() > 0.5 ? palette.fence.darkest : palette.fence.dark;
      g.rect(sx, Math.min(sy, y2 - sh), Math.max(0.5, thickness * 0.18), Math.min(sh, y2 - y1)).fill({
        color: hexToNumber(shade),
        alpha: 0.5,
      });
    }
    g.rect(rx - thickness / 2, y1, thickness * 0.28, y2 - y1).fill({
      color: hexToNumber(palette.fence.mid),
      alpha: 0.35,
    });
    g.rect(rx + thickness / 2 - 0.5, y1, 0.5, y2 - y1).fill({ color: hexToNumber(palette.fence.darkest), alpha: 0.7 });
  }
}

/** A handcrafted post-and-rail fence around the pen, with a gap left open for the gate. */
export function createFenceOutline(width: number, height: number, gate: { x: number; width: number }): Container {
  const container = new Container();
  const g = new Graphics();
  const rng = createRng(2451);
  const postSpacing = 15;

  drawHorizontalRails(g, 0, gate.x, height, rng);
  drawHorizontalRails(g, gate.x + gate.width, width, height, rng);
  drawHorizontalRails(g, 0, width, 0, rng);
  drawVerticalRails(g, 0, height, 0, rng);
  drawVerticalRails(g, 0, height, width, rng);

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
