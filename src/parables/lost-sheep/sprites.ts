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
  /** Empty marker positioned exactly at the lantern's flame — query its global position each frame so the night light follows the lantern itself, not the shepherd's body center. */
  lanternGlow: Container;
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

/**
 * A small hand lantern: a brass frame with a caged glass body, a carry
 * handle, and a warm layered-alpha glow standing in for the flame — no
 * post-processing, just several soft circles the way every other light
 * accent in this game is faked. `glow` is an empty marker positioned right
 * at the flame's center so the caller can read its exact world position
 * each frame (see Shepherd.getLanternWorldPosition in entities.ts) and have
 * the night light originate from the lantern itself, not the shepherd's body.
 */
function buildLantern(): { container: Container; glow: Container } {
  const lantern = new Container();
  const g = new Graphics();

  // Carry handle.
  g.moveTo(-2.2, -11.5)
    .quadraticCurveTo(0, -14.5, 2.2, -11.5)
    .stroke({ width: 0.8, color: hexToNumber(palette.lantern.frame) });

  // Cap.
  g.poly([-3, -11, 3, -11, 2, -8.6, -2, -8.6]).fill(hexToNumber(palette.lantern.frameLight));
  g.rect(-3.4, -8.6, 6.8, 1).fill(hexToNumber(palette.lantern.frame));

  // Glass body.
  g.rect(-2.6, -7.6, 5.2, 7.4).fill(hexToNumber(palette.lantern.glass));
  g.rect(-2.6, -7.6, 1.6, 7.4).fill({ color: 0x000000, alpha: 0.2 });

  // Corner posts (the cage).
  for (const cx of [-2.6, 2.6]) {
    g.rect(cx - 0.4, -8.6, 0.8, 9.4).fill(hexToNumber(palette.lantern.frame));
  }

  // Base.
  g.poly([-3.4, -0.2, 3.4, -0.2, 2.6, 1.4, -2.6, 1.4]).fill(hexToNumber(palette.lantern.frameLight));
  g.rect(-3.4, -1.2, 6.8, 1).fill(hexToNumber(palette.lantern.frame));

  // Flame glow — layered soft circles standing in for light bloom, warmest and brightest at the core.
  g.circle(0, -4, 4.2).fill({ color: hexToNumber(palette.lantern.glow), alpha: 0.22 });
  g.circle(0, -4, 2.6).fill({ color: hexToNumber(palette.lantern.flame), alpha: 0.55 });
  g.circle(0, -4, 1.3).fill({ color: hexToNumber(palette.lantern.flameCore), alpha: 0.9 });

  lantern.addChild(g);

  const glow = new Container();
  glow.position.set(0, -4);
  lantern.addChild(glow);

  return { container: lantern, glow };
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

/** The robe and its draped mantle, grouped so idle breathing can gently scale the torso without touching the facing flip on `body`. The hem is drawn down to y=0 (where the legs' own top edge sits, see buildShepherdLeg) so the robe and legs read as one continuous body with no gap at the waist. */
function buildShepherdTorso(): Container {
  const torso = new Container();

  const robe = new Graphics();
  robe.poly([-5.2, -15, 5.2, -15, 7.6, 0, -7.6, 0]).fill(hexToNumber(palette.robe.base));
  robe.poly([-5.2, -15, -1.2, -15, -2.4, 0, -7.6, 0]).fill(hexToNumber(palette.robe.shadow));
  robe.poly([2.4, -15, 5.2, -15, 7.6, 0, 3.6, 0]).fill({ color: hexToNumber(palette.robe.highlight), alpha: 0.5 });
  robe.rect(-1, -12.6, 0.6, 11.4).fill({ color: hexToNumber(palette.robe.shadow), alpha: 0.55 });
  robe.rect(1.6, -11.7, 0.6, 10.5).fill({ color: hexToNumber(palette.robe.shadow), alpha: 0.45 });
  // A couple of soft fabric-fold creases for dimensionality, now reaching all the way to the hem.
  robe.moveTo(-3.6, -10.8).lineTo(-3.2, -0.6).stroke({ width: 0.5, color: hexToNumber(palette.robe.shadow), alpha: 0.3 });
  robe.moveTo(4, -10.4).lineTo(4.8, -0.6).stroke({ width: 0.5, color: hexToNumber(palette.robe.shadow), alpha: 0.3 });
  robe.rect(-6, -8.9, 12, 1.7).fill(hexToNumber(palette.gold));
  robe.rect(-6, -8.9, 12, 0.6).fill({ color: 0xfff0c0, alpha: 0.55 });
  // A soft hem shadow right where the robe meets the legs — sells the drape
  // and grounds the transition instead of a hard flat cutoff.
  robe.rect(-7.6, -2.4, 15.2, 2.4).fill({ color: hexToNumber(palette.robe.shadow), alpha: 0.4 });
  robe.rect(-7.2, -0.5, 14.4, 0.5).fill({ color: 0x1a0f08, alpha: 0.35 });

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
  const { container: lantern, glow: lanternGlow } = buildLantern();
  lantern.position.set(0, 6.1);
  staffArm.addChild(lantern);

  const head = buildShepherdHead();
  head.position.set(0, -20);

  body.addChild(shadow, leftLeg, rightLeg, torso, frontArm, staffArm, head);
  container.addChild(body);

  return { container, body, torso, head, leftLeg, rightLeg, frontArm, staffArm, lanternGlow };
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
  /** Three pixel "Z" letters floating above the head, hidden unless the wolf is asleep (guarding, per entities.ts). Each child gets its own bob animation. */
  zzz: Container;
}

/** One blocky pixel "Z" — top bar, stepped diagonal, bottom bar, built from plain rects so it stays consistent with every other hand-coded shape in this game (no font rendering). */
function buildZzzLetter(size: number): Graphics {
  const g = new Graphics();
  const w = size * 2;
  const h = size * 2;
  const t = size * 0.42;
  g.rect(-w / 2, -h / 2, w, t).fill(0xf5f0e0);
  g.rect(-w / 2, h / 2 - t, w, t).fill(0xf5f0e0);
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const fx = -w / 2 + (w - t) * (i / (steps - 1));
    const fy = -h / 2 + t + (h - 3 * t) * (i / (steps - 1));
    g.rect(fx, fy, t, t).fill(0xf5f0e0);
  }
  return g;
}

function buildWolfZzz(): Container {
  const zzz = new Container();
  const specs = [
    { size: 1.5, x: 0, y: 0 },
    { size: 2, x: 2.4, y: -3.4 },
    { size: 2.5, x: 5.2, y: -7.4 },
  ];
  for (const spec of specs) {
    const letter = buildZzzLetter(spec.size);
    letter.position.set(spec.x, spec.y);
    zzz.addChild(letter);
  }
  zzz.position.set(2, -13);
  zzz.visible = false;
  return zzz;
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

  const zzz = buildWolfZzz();

  body.addChild(tail, backLeg, frontLeg, torso, head, zzz);
  container.addChild(body);

  return { container, body, head, tail, frontLeg, backLeg, zzz };
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

export interface PenExtensionShape {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A handcrafted post-and-rail fence tracing an L-shaped enclosure — the main
 * pen plus a smaller extension bumped out on its east side — with a gap
 * left open for the gate. All coordinates are local to the pen's own origin
 * (the caller positions the returned container at the pen's world x/y), and
 * `extension` uses the same local space (so its `x` is normally `width`,
 * flush against the main pen's east wall).
 */
export function createFenceOutline(
  width: number,
  height: number,
  gate: { x: number; width: number },
  extension: PenExtensionShape,
): Container {
  const container = new Container();
  const g = new Graphics();
  const rng = createRng(2451);
  const postSpacing = 15;

  const exRight = extension.x + extension.width;
  const exBottom = extension.y + extension.height;

  const walls = [
    { x1: 0, y1: 0, x2: width, y2: 0 }, // north
    { x1: width, y1: 0, x2: width, y2: extension.y }, // east, above the extension
    { x1: width, y1: extension.y, x2: exRight, y2: extension.y }, // extension north
    { x1: exRight, y1: extension.y, x2: exRight, y2: exBottom }, // extension east
    { x1: exRight, y1: exBottom, x2: width, y2: exBottom }, // extension south
    { x1: width, y1: exBottom, x2: width, y2: height }, // east, below the extension
    { x1: 0, y1: height, x2: gate.x, y2: height }, // south, left of the gate
    { x1: gate.x + gate.width, y1: height, x2: width, y2: height }, // south, right of the gate
    { x1: 0, y1: 0, x2: 0, y2: height }, // west
  ];

  for (const wall of walls) {
    if (wall.y1 === wall.y2) {
      drawHorizontalRails(g, Math.min(wall.x1, wall.x2), Math.max(wall.x1, wall.x2), wall.y1, rng);
    } else {
      drawVerticalRails(g, Math.min(wall.y1, wall.y2), Math.max(wall.y1, wall.y2), wall.x1, rng);
    }
  }

  // Posts at every wall's endpoints plus regular intervals along its length,
  // deduplicated so the shared corners between walls only get drawn once.
  const postKeys = new Set<string>();
  const posts: { x: number; y: number }[] = [];
  const addPost = (x: number, y: number) => {
    const key = `${Math.round(x)},${Math.round(y)}`;
    if (postKeys.has(key)) return;
    postKeys.add(key);
    posts.push({ x, y });
  };
  for (const wall of walls) {
    const length = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
    const steps = Math.max(1, Math.round(length / postSpacing));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      addPost(wall.x1 + (wall.x2 - wall.x1) * t, wall.y1 + (wall.y2 - wall.y1) * t);
    }
  }
  addPost(gate.x, height);
  addPost(gate.x + gate.width, height);

  for (const post of posts) {
    // Never plant a post inside the gate gap itself.
    if (Math.abs(post.y - height) < 0.5 && post.x > gate.x + 0.5 && post.x < gate.x + gate.width - 0.5) continue;
    drawFencePost(g, post.x, post.y, rng);
  }

  container.addChild(g);
  return container;
}
