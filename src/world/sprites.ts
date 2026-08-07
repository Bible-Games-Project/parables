import { Container, Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { palette } from "@/pixel-art/palette";

// ---------------------------------------------------------------------------
// Shared humanoid rig — the same construction technique as the shepherd in
// the Lost Sheep parable (layered shadow/base/highlight shapes, no black
// outlines), generalized with a color set so every human character in the
// game — Jesus, ambient villagers, future NPCs — reads as made by the same
// artist without duplicating the geometry each time.
// ---------------------------------------------------------------------------

export interface HumanoidColors {
  robeShadow: string;
  robeBase: string;
  robeHighlight: string;
  mantleShadow: string;
  mantleBase: string;
  mantleHighlight: string;
  clasp?: string;
}

export interface HumanoidVisual {
  container: Container;
  body: Container;
  torso: Container;
  head: Container;
  leftLeg: Container;
  rightLeg: Container;
  frontArm: Container;
  backArm: Container;
}

function buildHead(): Container {
  const head = new Container();
  const g = new Graphics();
  g.circle(0, 0, 5).fill(hexToNumber(palette.skin.base));
  g.circle(1.7, 0.6, 3.3).fill({ color: hexToNumber(palette.skin.shadow), alpha: 0.3 });
  g.circle(-1.5, -1.7, 1.8).fill({ color: hexToNumber(palette.skin.highlight), alpha: 0.4 });
  g.ellipse(0, -3, 5.3, 3.2).fill(hexToNumber(palette.hair.base));
  g.ellipse(0, -3.8, 5.3, 2).fill({ color: hexToNumber(palette.hair.shadow), alpha: 0.5 });
  g.ellipse(-4.4, -1, 1.4, 2).fill(hexToNumber(palette.hair.base));
  g.ellipse(4.4, -1, 1.4, 2).fill(hexToNumber(palette.hair.base));
  g.circle(-1.7, -0.3, 0.6).fill(hexToNumber(palette.ink));
  g.circle(1.7, -0.3, 0.6).fill(hexToNumber(palette.ink));
  g.poly([-3.6, 1, 3.6, 1, 2.2, 5.2, 0, 6.4, -2.2, 5.2]).fill(hexToNumber(palette.hair.base));
  g.poly([-1, 1.4, 1, 1.4, 0.6, 4.4, -0.6, 4.4]).fill({ color: hexToNumber(palette.hair.shadow), alpha: 0.55 });
  head.addChild(g);
  return head;
}

function buildLeg(): Container {
  const leg = new Container();
  const g = new Graphics();
  g.rect(-1.4, 3.2, 2.8, 5).fill(hexToNumber(palette.skin.base));
  g.rect(-1.4, 3.2, 1.4, 5).fill({ color: hexToNumber(palette.skin.shadow), alpha: 0.5 });
  g.rect(-1.6, 7.6, 3.2, 1.4).fill(hexToNumber(palette.hair.base));
  leg.addChild(g);
  return leg;
}

function buildArm(colors: HumanoidColors, sleeveTrim: boolean): Container {
  const arm = new Container();
  const g = new Graphics();
  g.rect(-1.3, 0, 2.6, 5).fill(hexToNumber(colors.robeBase));
  g.rect(-1.3, 0, 1.3, 5).fill(hexToNumber(colors.robeShadow));
  if (sleeveTrim) {
    g.rect(-1.4, 3.9, 2.8, 0.8).fill({ color: hexToNumber(palette.gold), alpha: 0.7 });
  }
  g.circle(0, 5.8, 1.4).fill(hexToNumber(palette.skin.base));
  arm.addChild(g);
  return arm;
}

/** The robe + mantle torso, built from a color set so the same shapes serve Jesus and every villager variant. */
function buildTorso(colors: HumanoidColors): Container {
  const torso = new Container();
  const robe = new Graphics();
  robe.poly([-4.8, -14, 4.8, -14, 7, 0, -7, 0]).fill(hexToNumber(colors.robeBase));
  robe.poly([-4.8, -14, -1, -14, -2.2, 0, -7, 0]).fill(hexToNumber(colors.robeShadow));
  robe.poly([2.2, -14, 4.8, -14, 7, 0, 3.2, 0]).fill({ color: hexToNumber(colors.robeHighlight), alpha: 0.5 });
  robe.rect(-0.9, -11.6, 0.5, 11.6).fill({ color: hexToNumber(colors.robeShadow), alpha: 0.5 });
  robe.rect(1.4, -10.8, 0.5, 10.8).fill({ color: hexToNumber(colors.robeShadow), alpha: 0.4 });
  robe.rect(-5.6, -8.3, 11.2, 1.5).fill(hexToNumber(palette.gold));
  robe.rect(-5.6, -8.3, 11.2, 0.5).fill({ color: 0xfff0c0, alpha: 0.5 });
  robe.rect(-7, -2.2, 14, 2.2).fill({ color: hexToNumber(colors.robeShadow), alpha: 0.35 });

  const mantle = new Graphics();
  mantle.poly([-5.8, -14.8, -1.6, -14.4, -2.7, -6, -6.2, -7.2]).fill(hexToNumber(colors.mantleBase));
  mantle.poly([-5.8, -14.8, -4, -14.6, -4.4, -9.2, -6.2, -9.8]).fill({ color: hexToNumber(colors.mantleShadow), alpha: 0.6 });
  mantle.poly([4.2, -14.8, 6.3, -14, 5.2, -8.4, 3.1, -8.7]).fill(hexToNumber(colors.mantleBase));
  mantle.poly([4.2, -14.8, 5.5, -14.1, 5.1, -11, 3.7, -11]).fill({ color: hexToNumber(colors.mantleHighlight), alpha: 0.4 });
  if (colors.clasp) {
    mantle.circle(-4.9, -14.2, 1.05).fill(hexToNumber(palette.gold));
    mantle.circle(-4.9, -14.2, 0.5).fill(hexToNumber(colors.clasp));
  }

  torso.addChild(robe, mantle);
  return torso;
}

function buildHumanoid(colors: HumanoidColors): HumanoidVisual {
  const container = new Container();
  const body = new Container();

  const shadow = new Graphics();
  shadow.ellipse(0.5, 7, 6.6, 2.1).fill({ color: 0x0a0603, alpha: 0.26 });

  const torso = buildTorso(colors);
  const leftLeg = buildLeg();
  leftLeg.position.set(-2.8, -3.2);
  const rightLeg = buildLeg();
  rightLeg.position.set(2.8, -3.2);
  const frontArm = buildArm(colors, false);
  frontArm.position.set(-5.6, -13);
  const backArm = buildArm(colors, true);
  backArm.position.set(5.6, -13);
  const head = buildHead();
  head.position.set(0, -18.6);

  body.addChild(shadow, leftLeg, rightLeg, torso, frontArm, backArm, head);
  container.addChild(body);

  return { container, body, torso, head, leftLeg, rightLeg, frontArm, backArm };
}

/** Jesus — warm off-white robe, muted brick-red mantle. The player's character in Israel. */
export function createJesusSprite(): HumanoidVisual {
  return buildHumanoid({
    robeShadow: palette.jesusRobe.shadow,
    robeBase: palette.jesusRobe.base,
    robeHighlight: palette.jesusRobe.highlight,
    mantleShadow: palette.jesusMantle.shadow,
    mantleBase: palette.jesusMantle.base,
    mantleHighlight: palette.jesusMantle.highlight,
    clasp: "#5f8f8a",
  });
}

export type VillagerVariant = "shepherd" | "farmer" | "traveller";

const VILLAGER_COLORS: Record<VillagerVariant, HumanoidColors> = {
  shepherd: {
    robeShadow: palette.robe.shadow,
    robeBase: palette.robe.base,
    robeHighlight: palette.robe.highlight,
    mantleShadow: palette.mantle.shadow,
    mantleBase: palette.mantle.base,
    mantleHighlight: palette.mantle.highlight,
  },
  farmer: {
    robeShadow: palette.farmerRobe.shadow,
    robeBase: palette.farmerRobe.base,
    robeHighlight: palette.farmerRobe.highlight,
    mantleShadow: palette.mantle.shadow,
    mantleBase: palette.mantle.base,
    mantleHighlight: palette.mantle.highlight,
  },
  traveller: {
    robeShadow: palette.fishermanRobe.shadow,
    robeBase: palette.fishermanRobe.base,
    robeHighlight: palette.fishermanRobe.highlight,
    mantleShadow: palette.mantle.shadow,
    mantleBase: palette.mantle.base,
    mantleHighlight: palette.mantle.highlight,
  },
};

/** An ambient villager — just makes the world feel lived-in, never triggers a parable on its own. */
export function createVillagerSprite(variant: VillagerVariant): HumanoidVisual {
  return buildHumanoid(VILLAGER_COLORS[variant]);
}
