import { Container, Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { palette } from "@/pixel-art/palette";

// ---------------------------------------------------------------------------
// Shared humanoid rig — the same construction technique as the shepherd in
// the Lost Sheep parable (layered shadow/base/highlight shapes, no black
// outlines), generalized with a color set AND a structural "shape" so every
// human character in the game — Jesus, ambient villagers, future NPCs —
// reads as made by the same artist while still looking like real, different
// people rather than palette-swapped clones.
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

type HairStyle = "cropped" | "waves" | "braid" | "bun" | "curls";
type Accessory = "none" | "staff" | "basket" | "satchel";

export interface HumanoidShape {
  /** Overall size, applied to a wrapper above the facing-flip so it never fights left/right flipping. */
  heightScale?: number;
  /** Extra scale on just the head — bigger for children, giving them believable cartoon proportions. */
  headScale?: number;
  /** Shoulder/hip width, applied to the torso and limb offsets. */
  widthScale?: number;
  /** Knee-length tunic (legs visible) vs full ankle-length robe (legs hidden) — the single strongest silhouette read. */
  hemLength?: "short" | "long";
  hairStyle?: HairStyle;
  hairColors?: { shadow: string; base: string; highlight: string };
  headscarf?: boolean;
  beard?: boolean;
  /** Whether the shoulder mantle wrap is worn — younger characters go without for a lighter silhouette. */
  mantle?: boolean;
  /** A slight forward lean for elderly characters. */
  stooped?: boolean;
  accessory?: Accessory;
}

interface ResolvedShape extends Required<Omit<HumanoidShape, "hairColors">> {
  hairColors: { shadow: string; base: string; highlight: string };
}

const SHAPE_DEFAULTS: ResolvedShape = {
  heightScale: 1,
  headScale: 1,
  widthScale: 1,
  hemLength: "long",
  hairStyle: "waves",
  hairColors: palette.hair,
  headscarf: false,
  beard: false,
  mantle: true,
  stooped: false,
  accessory: "none",
};

function resolveShape(shape: HumanoidShape): ResolvedShape {
  return { ...SHAPE_DEFAULTS, ...shape };
}

function buildHead(colors: HumanoidColors, shape: ResolvedShape): Container {
  const head = new Container();
  const g = new Graphics();
  const hair = shape.hairColors;

  g.circle(0, 0, 5).fill(hexToNumber(palette.skin.base));
  g.circle(1.7, 0.6, 3.3).fill({ color: hexToNumber(palette.skin.shadow), alpha: 0.3 });
  g.circle(-1.5, -1.7, 1.8).fill({ color: hexToNumber(palette.skin.highlight), alpha: 0.4 });

  if (shape.hairStyle === "bun") {
    g.ellipse(0, -3, 5.1, 2.6).fill(hexToNumber(hair.base));
    g.ellipse(0, -3.6, 5.1, 1.7).fill({ color: hexToNumber(hair.shadow), alpha: 0.5 });
    g.circle(0, -6.6, 1.9).fill(hexToNumber(hair.base));
    g.circle(0.3, -7, 1.1).fill({ color: hexToNumber(hair.highlight), alpha: 0.4 });
  } else if (shape.hairStyle === "braid") {
    g.ellipse(0, -3, 5.3, 3).fill(hexToNumber(hair.base));
    g.ellipse(0, -3.8, 5.3, 1.9).fill({ color: hexToNumber(hair.shadow), alpha: 0.5 });
    g.rect(-1, 1, 2, 6.6).fill(hexToNumber(hair.base));
    g.rect(-1, 1, 1, 6.6).fill({ color: hexToNumber(hair.shadow), alpha: 0.4 });
    g.rect(-1, 3.4, 2, 0.5).fill({ color: hexToNumber(hair.highlight), alpha: 0.4 });
    g.rect(-1, 5.6, 2, 0.5).fill({ color: hexToNumber(hair.highlight), alpha: 0.4 });
  } else if (shape.hairStyle === "curls") {
    for (const [dx, dy, r] of [
      [-3.4, -3.4, 1.9],
      [0, -4.4, 2.1],
      [3.4, -3.4, 1.9],
      [-2, -1.3, 1.6],
      [2, -1.3, 1.6],
    ] as const) {
      g.circle(dx, dy, r).fill(hexToNumber(hair.base));
    }
    g.circle(0.4, -4.6, 1.1).fill({ color: hexToNumber(hair.highlight), alpha: 0.4 });
    g.circle(-2.8, -3.8, 0.8).fill({ color: hexToNumber(hair.shadow), alpha: 0.4 });
  } else if (shape.hairStyle === "cropped") {
    g.ellipse(0, -2.6, 5.1, 2.2).fill(hexToNumber(hair.base));
    g.ellipse(0, -3.2, 5.1, 1.4).fill({ color: hexToNumber(hair.shadow), alpha: 0.5 });
  } else {
    // waves — the original silhouette.
    g.ellipse(0, -3, 5.3, 3.2).fill(hexToNumber(hair.base));
    g.ellipse(0, -3.8, 5.3, 2).fill({ color: hexToNumber(hair.shadow), alpha: 0.5 });
    g.ellipse(-4.4, -1, 1.4, 2).fill(hexToNumber(hair.base));
    g.ellipse(4.4, -1, 1.4, 2).fill(hexToNumber(hair.base));
  }

  g.circle(-1.7, -0.3, 0.6).fill(hexToNumber(palette.ink));
  g.circle(1.7, -0.3, 0.6).fill(hexToNumber(palette.ink));

  if (shape.beard) {
    g.poly([-3.2, 1.4, 3.2, 1.4, 2, 5.4, 0, 6.4, -2, 5.4]).fill(hexToNumber(hair.base));
    g.poly([-1, 1.8, 1, 1.8, 0.5, 4.2, -0.5, 4.2]).fill({ color: hexToNumber(hair.shadow), alpha: 0.5 });
  } else {
    g.poly([-3.6, 1, 3.6, 1, 2.2, 5.2, 0, 6.4, -2.2, 5.2]).fill(hexToNumber(palette.skin.base));
    g.poly([-1, 1.4, 1, 1.4, 0.6, 4.4, -0.6, 4.4]).fill({ color: hexToNumber(palette.skin.shadow), alpha: 0.3 });
  }

  if (shape.headscarf) {
    const scarfBase = hexToNumber(colors.mantleBase);
    const scarfShadow = hexToNumber(colors.mantleShadow);
    g.poly([-5.6, -4.6, 5.6, -4.6, 4.6, 2.2, 3.4, 0.4, 0, 1.8, -3.4, 0.4, -4.6, 2.2]).fill(scarfBase);
    g.poly([-5.6, -4.6, -1, -4.8, -1.6, 1.2, -4.6, 2.2]).fill({ color: scarfShadow, alpha: 0.4 });
    g.rect(3.6, -1.2, 2.6, 5.6).fill(scarfBase);
    g.rect(3.6, -1.2, 1.2, 5.6).fill({ color: scarfShadow, alpha: 0.35 });
  }

  head.addChild(g);
  head.scale.set(shape.headScale);
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

/** The robe + mantle torso, built from a color set and a resolved shape so the same technique serves every archetype. */
function buildTorso(colors: HumanoidColors, shape: ResolvedShape): Container {
  const torso = new Container();
  const hemY = shape.hemLength === "short" ? -6 : 0;
  const robe = new Graphics();
  robe.poly([-4.8, -14, 4.8, -14, 7, hemY, -7, hemY]).fill(hexToNumber(colors.robeBase));
  robe.poly([-4.8, -14, -1, -14, -2.2, hemY, -7, hemY]).fill(hexToNumber(colors.robeShadow));
  robe.poly([2.2, -14, 4.8, -14, 7, hemY, 3.2, hemY]).fill({ color: hexToNumber(colors.robeHighlight), alpha: 0.5 });
  robe.rect(-0.9, -11.6, 0.5, hemY + 11.6).fill({ color: hexToNumber(colors.robeShadow), alpha: 0.5 });
  robe.rect(1.4, -10.8, 0.5, hemY + 10.8).fill({ color: hexToNumber(colors.robeShadow), alpha: 0.4 });
  robe.rect(-5.6, -8.3, 11.2, 1.5).fill(hexToNumber(palette.gold));
  robe.rect(-5.6, -8.3, 11.2, 0.5).fill({ color: 0xfff0c0, alpha: 0.5 });
  robe.rect(-7, hemY - 2.2, 14, 2.2).fill({ color: hexToNumber(colors.robeShadow), alpha: 0.35 });

  if (shape.hemLength === "short") {
    // A knee-length tunic ends well above where the leg graphics begin (y=0) — without
    // this, that stretch is fully transparent, reading as a gap between torso and legs.
    // Filling it with skin tone (tapering from the tunic's own hem width down to the
    // legs' stance width) makes the silhouette read as a continuous, clothed body.
    robe.poly([-7, hemY, 7, hemY, 4, 0, -4, 0]).fill(hexToNumber(palette.skin.base));
    robe.poly([-7, hemY, 0, hemY, 0.3, 0, -4, 0]).fill({ color: hexToNumber(palette.skin.shadow), alpha: 0.3 });
  }

  torso.addChild(robe);

  if (shape.mantle) {
    const mantle = new Graphics();
    mantle.poly([-5.8, -14.8, -1.6, -14.4, -2.7, -6, -6.2, -7.2]).fill(hexToNumber(colors.mantleBase));
    mantle.poly([-5.8, -14.8, -4, -14.6, -4.4, -9.2, -6.2, -9.8]).fill({ color: hexToNumber(colors.mantleShadow), alpha: 0.6 });
    mantle.poly([4.2, -14.8, 6.3, -14, 5.2, -8.4, 3.1, -8.7]).fill(hexToNumber(colors.mantleBase));
    mantle.poly([4.2, -14.8, 5.5, -14.1, 5.1, -11, 3.7, -11]).fill({ color: hexToNumber(colors.mantleHighlight), alpha: 0.4 });
    if (colors.clasp) {
      mantle.circle(-4.9, -14.2, 1.05).fill(hexToNumber(palette.gold));
      mantle.circle(-4.9, -14.2, 0.5).fill(hexToNumber(colors.clasp));
    }
    torso.addChild(mantle);
  }

  return torso;
}

/** A simple hand-carried prop, attached to `body` so it isn't distorted by the torso's width scale. */
function addAccessory(body: Container, accessory: Accessory): void {
  const g = new Graphics();
  if (accessory === "staff") {
    g.rect(-7.6, -18.4, 1.3, 20.4).fill(hexToNumber(palette.wood.dark));
    g.rect(-7.6, -18.4, 0.6, 20.4).fill({ color: hexToNumber(palette.wood.light), alpha: 0.4 });
    g.rect(-8.1, -18.9, 2.3, 1.4).fill(hexToNumber(palette.wood.darker));
  } else if (accessory === "basket") {
    g.ellipse(6.6, -3.6, 2.7, 1.9).fill(hexToNumber(palette.wood.dark));
    g.ellipse(6.6, -4.4, 2.7, 1.4).fill({ color: hexToNumber(palette.wood.light), alpha: 0.5 });
    g.moveTo(4.4, -4.6).lineTo(5.4, -6.4).stroke({ width: 0.8, color: hexToNumber(palette.wood.darker), alpha: 0.8 });
    g.moveTo(8.8, -4.6).lineTo(7.8, -6.4).stroke({ width: 0.8, color: hexToNumber(palette.wood.darker), alpha: 0.8 });
  } else if (accessory === "satchel") {
    g.moveTo(-4.2, -14.4).lineTo(4.6, -2.2).stroke({ width: 1.2, color: hexToNumber(palette.fence.dark), alpha: 0.85 });
    g.rect(3, -3.4, 3.6, 3.2).fill(hexToNumber(palette.fence.mid));
    g.rect(3, -3.4, 3.6, 1).fill({ color: hexToNumber(palette.fence.highlight), alpha: 0.35 });
  }
  body.addChild(g);
}

function buildHumanoid(colors: HumanoidColors, shapeInput: HumanoidShape = {}): HumanoidVisual {
  const shape = resolveShape(shapeInput);
  const container = new Container();
  // A separate wrapper carries heightScale/stoop so `body.scale.x` stays free for the left/right facing flip.
  const sizeWrap = new Container();
  const body = new Container();

  const shadow = new Graphics();
  shadow.ellipse(0.5, 7, 6.6 * shape.widthScale, 2.1).fill({ color: 0x0a0603, alpha: 0.26 });

  const torso = buildTorso(colors, shape);
  torso.scale.x = shape.widthScale;
  const leftLeg = buildLeg();
  leftLeg.position.set(-2.8 * shape.widthScale, -3.2);
  const rightLeg = buildLeg();
  rightLeg.position.set(2.8 * shape.widthScale, -3.2);
  const frontArm = buildArm(colors, false);
  frontArm.position.set(-5.6 * shape.widthScale, -13);
  const backArm = buildArm(colors, true);
  backArm.position.set(5.6 * shape.widthScale, -13);
  const head = buildHead(colors, shape);
  head.position.set(0, -18.6);

  body.addChild(shadow, leftLeg, rightLeg, torso, frontArm, backArm, head);
  if (shape.accessory !== "none") addAccessory(body, shape.accessory);

  sizeWrap.addChild(body);
  sizeWrap.scale.set(shape.heightScale);
  if (shape.stooped) {
    sizeWrap.rotation = 0.05;
    sizeWrap.position.y = 0.8;
  }
  container.addChild(sizeWrap);

  return { container, body, torso, head, leftLeg, rightLeg, frontArm, backArm };
}

/** A subtle pixel-art halo, warm and pastel — attached just behind Jesus's head so it moves with him without fighting his idle head-sway. */
function buildHalo(): Graphics {
  const g = new Graphics();
  const cy = -24.4;
  g.ellipse(0, cy + 0.7, 6.4, 2.1).fill({ color: hexToNumber(palette.gold), alpha: 0.13 });
  g.ellipse(0, cy, 5.4, 1.6).stroke({ width: 1.3, color: hexToNumber(palette.gold), alpha: 0.85 });
  g.ellipse(0, cy - 0.35, 5.4, 1.6).stroke({ width: 0.55, color: hexToNumber(palette.wool.highlight), alpha: 0.55 });
  return g;
}

/** Jesus's colors — warm off-white robe, muted brick-red mantle. Exported so the dialogue-box portrait (`src/pixel-art/portraits.ts`) can render a matching face without duplicating this palette choice. */
export const JESUS_COLORS: HumanoidColors = {
  robeShadow: palette.jesusRobe.shadow,
  robeBase: palette.jesusRobe.base,
  robeHighlight: palette.jesusRobe.highlight,
  mantleShadow: palette.jesusMantle.shadow,
  mantleBase: palette.jesusMantle.base,
  mantleHighlight: palette.jesusMantle.highlight,
  clasp: "#5f8f8a",
};

/** Jesus — warm off-white robe, muted brick-red mantle, a soft halo. The player's character in Israel. */
export function createJesusSprite(): HumanoidVisual {
  const visual = buildHumanoid(JESUS_COLORS);
  const halo = buildHalo();
  visual.body.addChildAt(halo, visual.body.getChildIndex(visual.head));
  return visual;
}

export type VillagerVariant =
  | "shepherd"
  | "adultMan"
  | "adultWoman"
  | "elderMan"
  | "elderWoman"
  | "youngMan"
  | "youngWoman"
  | "teen"
  | "child";

interface ArchetypeDefinition {
  colors: HumanoidColors;
  shape: HumanoidShape;
}

const NEUTRAL_MANTLE = {
  mantleShadow: palette.mantle.shadow,
  mantleBase: palette.mantle.base,
  mantleHighlight: palette.mantle.highlight,
};

/**
 * Nine handcrafted archetypes covering the ages and roles that populate
 * Israel — every one shares the same layered-Graphics construction
 * technique and warm-pastel palette family, but differs in silhouette
 * (hem length, width, height, hair, accessories) so the world doesn't read
 * as clones in different shirts. `shepherd` is reserved for the Lost Sheep
 * encounter's own character; the rest are the ambient cast.
 */
export const VILLAGER_ARCHETYPES: Record<VillagerVariant, ArchetypeDefinition> = {
  shepherd: {
    colors: {
      robeShadow: palette.shepherdRobe.shadow,
      robeBase: palette.shepherdRobe.base,
      robeHighlight: palette.shepherdRobe.highlight,
      ...NEUTRAL_MANTLE,
    },
    shape: { hemLength: "short", hairStyle: "cropped", beard: true, accessory: "staff", widthScale: 1.05 },
  },
  adultMan: {
    colors: {
      robeShadow: palette.fishermanRobe.shadow,
      robeBase: palette.fishermanRobe.base,
      robeHighlight: palette.fishermanRobe.highlight,
      ...NEUTRAL_MANTLE,
    },
    shape: { hemLength: "short", hairStyle: "cropped", beard: true, accessory: "satchel", widthScale: 1.05 },
  },
  adultWoman: {
    colors: {
      robeShadow: palette.farmerRobe.shadow,
      robeBase: palette.farmerRobe.base,
      robeHighlight: palette.farmerRobe.highlight,
      ...NEUTRAL_MANTLE,
    },
    shape: { hemLength: "long", hairStyle: "braid", accessory: "basket", widthScale: 0.92 },
  },
  elderMan: {
    colors: {
      robeShadow: palette.elderRobe.shadow,
      robeBase: palette.elderRobe.base,
      robeHighlight: palette.elderRobe.highlight,
      ...NEUTRAL_MANTLE,
    },
    shape: {
      hemLength: "short",
      hairStyle: "cropped",
      hairColors: palette.hairGray,
      beard: true,
      stooped: true,
      accessory: "staff",
      widthScale: 0.98,
    },
  },
  elderWoman: {
    colors: {
      robeShadow: palette.elderRobe.shadow,
      robeBase: palette.elderRobe.base,
      robeHighlight: palette.elderRobe.highlight,
      ...NEUTRAL_MANTLE,
    },
    shape: {
      hemLength: "long",
      hairStyle: "bun",
      hairColors: palette.hairGray,
      headscarf: true,
      stooped: true,
      widthScale: 0.88,
    },
  },
  youngMan: {
    colors: {
      robeShadow: palette.youthRobe.shadow,
      robeBase: palette.youthRobe.base,
      robeHighlight: palette.youthRobe.highlight,
      ...NEUTRAL_MANTLE,
    },
    shape: { hemLength: "short", hairStyle: "waves", widthScale: 0.96, heightScale: 0.98 },
  },
  youngWoman: {
    colors: {
      robeShadow: palette.youthRobe.shadow,
      robeBase: palette.youthRobe.base,
      robeHighlight: palette.youthRobe.highlight,
      ...NEUTRAL_MANTLE,
      clasp: "#8a6a9a",
    },
    shape: { hemLength: "long", hairStyle: "braid", widthScale: 0.86, heightScale: 0.97 },
  },
  teen: {
    colors: {
      robeShadow: palette.youthRobe.shadow,
      robeBase: palette.youthRobe.base,
      robeHighlight: palette.youthRobe.highlight,
      ...NEUTRAL_MANTLE,
    },
    shape: { hemLength: "short", hairStyle: "curls", mantle: false, widthScale: 0.82, heightScale: 0.86 },
  },
  child: {
    colors: {
      robeShadow: palette.childRobe.shadow,
      robeBase: palette.childRobe.base,
      robeHighlight: palette.childRobe.highlight,
      ...NEUTRAL_MANTLE,
    },
    shape: {
      hemLength: "short",
      hairStyle: "curls",
      mantle: false,
      widthScale: 0.72,
      heightScale: 0.68,
      headScale: 1.18,
    },
  },
};

/** An ambient villager — just makes the world feel lived-in, never triggers a parable on its own (except `shepherd`, reserved for the one handcrafted Lost Sheep encounter). */
export function createVillagerSprite(variant: VillagerVariant): HumanoidVisual {
  const archetype = VILLAGER_ARCHETYPES[variant];
  return buildHumanoid(archetype.colors, archetype.shape);
}
