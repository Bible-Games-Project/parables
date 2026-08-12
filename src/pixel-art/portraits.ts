import { palette } from "@/pixel-art/palette";
import { JESUS_COLORS, type HumanoidColors } from "@/world/sprites";

/**
 * Facial states a portrait can show, hand-picked per dialogue line rather
 * than inferred from text — five is enough variety for a small handcrafted
 * cast without needing new art per state (each is just an eyebrow angle +
 * mouth curve change on the same face).
 */
export type Expression = "neutral" | "warm" | "concerned" | "sad" | "joyful";

/** Per-frame animation state driven by `Portrait.tsx`'s own rAF loop — purely cosmetic "this character is alive" cues, never synced to real speech timing. */
export interface PortraitAnim {
  /** 0 = eyes fully open, 1 = fully closed (a blink). */
  blink: number;
  /** 0 = mouth at its expression's rest shape, 1 = mouth at its most open (a "talking" cue). */
  mouthOpen: number;
  /** Small horizontal offset (head-space units) for a gentle idle sway. */
  swayX: number;
}

export type PortraitId = "jesus" | "shepherd-david";

type HairStyle = "cropped" | "waves" | "braid" | "bun" | "curls";
interface HairColors {
  shadow: string;
  base: string;
  highlight: string;
}

const EXPRESSIONS: Record<Expression, { browAngle: number; browLift: number; mouthCurve: number }> = {
  // browAngle: positive tilts the outer end up (relaxed/happy arch); negative tilts the inner end up (worried/sad).
  // browLift: positive raises the whole brow; negative lowers it toward the eyes.
  // mouthCurve: positive = smile, negative = frown, 0 = flat.
  neutral: { browAngle: 0, browLift: 0, mouthCurve: 0 },
  warm: { browAngle: 0.08, browLift: 0.25, mouthCurve: 0.5 },
  concerned: { browAngle: -0.24, browLift: 0.15, mouthCurve: -0.08 },
  sad: { browAngle: -0.2, browLift: -0.15, mouthCurve: -0.55 },
  joyful: { browAngle: 0.14, browLift: 0.5, mouthCurve: 0.85 },
};

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function fillEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  alpha = 1,
): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function fillPoly(ctx: CanvasRenderingContext2D, points: number[], color: string, alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Hair, ported from `buildHead`'s hairstyle switch in `src/world/sprites.ts` — kept in sync by eye, not by import, since the portrait redraws every frame in a plain 2D context instead of retained PixiJS `Graphics`. */
function drawHair(ctx: CanvasRenderingContext2D, style: HairStyle, hair: HairColors, swayX: number): void {
  if (style === "bun") {
    fillEllipse(ctx, swayX, -3, 5.1, 2.6, hair.base);
    fillEllipse(ctx, swayX, -3.6, 5.1, 1.7, hair.shadow, 0.5);
    fillCircle(ctx, swayX, -6.6, 1.9, hair.base);
    fillCircle(ctx, swayX + 0.3, -7, 1.1, hair.highlight, 0.4);
  } else if (style === "braid") {
    fillEllipse(ctx, swayX, -3, 5.3, 3, hair.base);
    fillEllipse(ctx, swayX, -3.8, 5.3, 1.9, hair.shadow, 0.5);
    ctx.fillStyle = hair.base;
    ctx.fillRect(swayX - 1, 1, 2, 6.6);
    ctx.fillStyle = hair.shadow;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(swayX - 1, 1, 1, 6.6);
    ctx.globalAlpha = 1;
  } else if (style === "curls") {
    for (const [dx, dy, r] of [
      [-3.4, -3.4, 1.9],
      [0, -4.4, 2.1],
      [3.4, -3.4, 1.9],
      [-2, -1.3, 1.6],
      [2, -1.3, 1.6],
    ] as const) {
      fillCircle(ctx, swayX + dx, dy, r, hair.base);
    }
    fillCircle(ctx, swayX + 0.4, -4.6, 1.1, hair.highlight, 0.4);
  } else if (style === "cropped") {
    fillEllipse(ctx, swayX, -2.6, 5.1, 2.2, hair.base);
    fillEllipse(ctx, swayX, -3.2, 5.1, 1.4, hair.shadow, 0.5);
  } else {
    // waves — the default silhouette (Jesus and most villagers).
    fillEllipse(ctx, swayX, -3, 5.3, 3.2, hair.base);
    fillEllipse(ctx, swayX, -3.8, 5.3, 2, hair.shadow, 0.5);
    fillEllipse(ctx, swayX - 4.4, -1, 1.4, 2, hair.base);
    fillEllipse(ctx, swayX + 4.4, -1, 1.4, 2, hair.base);
  }
}

function drawEyebrows(
  ctx: CanvasRenderingContext2D,
  hair: HairColors,
  browAngle: number,
  browLift: number,
  swayX: number,
): void {
  ctx.strokeStyle = hair.shadow;
  ctx.lineWidth = 0.5;
  ctx.lineCap = "round";
  const y = -1.7 - browLift;
  for (const side of [-1, 1] as const) {
    const cx = side * 1.7 + swayX;
    const innerX = cx - side * 0.8;
    const outerX = cx + side * 0.8;
    const tilt = browAngle * side;
    ctx.beginPath();
    ctx.moveTo(innerX, y - tilt);
    ctx.lineTo(outerX, y + tilt);
    ctx.stroke();
  }
}

function drawEyes(ctx: CanvasRenderingContext2D, blink: number, swayX: number): void {
  const eyeY = -0.3;
  const baseRy = 0.62;
  const ry = Math.max(0, baseRy * (1 - blink));
  for (const side of [-1, 1] as const) {
    const ex = side * 1.7 + swayX;
    if (ry < 0.14) {
      ctx.strokeStyle = palette.ink;
      ctx.lineWidth = 0.3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ex - 0.75, eyeY);
      ctx.lineTo(ex + 0.75, eyeY);
      ctx.stroke();
      continue;
    }
    fillEllipse(ctx, ex, eyeY, 0.85, ry, "#fbf3e6");
    fillEllipse(ctx, ex, eyeY, 0.5, Math.min(0.5, ry), palette.ink);
    if (ry > 0.3) fillEllipse(ctx, ex - 0.16, eyeY - ry * 0.35, 0.14, 0.14, "rgba(255,255,255,0.85)");
  }
}

function drawMouth(
  ctx: CanvasRenderingContext2D,
  curve: number,
  mouthOpen: number,
  lineColor: string,
  openColor: string,
  swayX: number,
): void {
  const y = 2.7;
  const halfWidth = 1.4;
  if (mouthOpen > 0.14) {
    const openHeight = 0.35 + mouthOpen * 0.85;
    fillEllipse(ctx, swayX, y + openHeight * 0.25, halfWidth * (0.5 + curve * 0.12), openHeight * 0.5, openColor);
    return;
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 0.42;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(swayX - halfWidth, y);
  ctx.quadraticCurveTo(swayX, y - curve * 1.1, swayX + halfWidth, y);
  ctx.stroke();
}

interface GenericFaceOptions {
  hairStyle: HairStyle;
  hairColors: HairColors;
  beard: boolean;
  headscarf: boolean;
}

/** A face built from the same `HumanoidColors` + hairstyle vocabulary as the in-world sprites (`src/world/sprites.ts`), just bigger and with the extra detail (eyebrows, an explicit mouth, blinkable eyes) the tiny in-game head has no room for. Reusable for any future speaker on the shared archetype system, not just Jesus. */
function drawGenericFace(
  ctx: CanvasRenderingContext2D,
  colors: HumanoidColors,
  options: GenericFaceOptions,
  expression: Expression,
  anim: PortraitAnim,
): void {
  const { hairStyle, hairColors: hair, beard, headscarf } = options;
  const { browAngle, browLift, mouthCurve } = EXPRESSIONS[expression];
  const swayX = anim.swayX;

  fillCircle(ctx, 0, 0, 5, palette.skin.base);
  fillCircle(ctx, 1.7, 0.6, 3.3, palette.skin.shadow, 0.3);
  fillCircle(ctx, -1.5, -1.7, 1.8, palette.skin.highlight, 0.4);

  drawHair(ctx, hairStyle, hair, swayX);
  drawEyebrows(ctx, hair, browAngle, browLift, swayX);
  drawEyes(ctx, anim.blink, swayX);

  if (beard) {
    fillPoly(ctx, [-3.2, 1.4, 3.2, 1.4, 2, 5.4, 0, 6.4, -2, 5.4], hair.base);
    drawMouth(ctx, mouthCurve, anim.mouthOpen, hair.shadow, "#3a2216", swayX);
  } else {
    fillPoly(ctx, [-3.6, 1, 3.6, 1, 2.2, 5.2, 0, 6.4, -2.2, 5.2], palette.skin.base);
    fillPoly(ctx, [-1, 1.4, 1, 1.4, 0.6, 4.4, -0.6, 4.4], palette.skin.shadow, 0.3);
    drawMouth(ctx, mouthCurve, anim.mouthOpen, palette.skin.shadow, "#5a2d20", swayX);
  }

  if (headscarf) {
    const scarfBase = colors.mantleBase;
    const scarfShadow = colors.mantleShadow;
    fillPoly(
      ctx,
      [-5.6, -4.6, 5.6, -4.6, 4.6, 2.2, 3.4, 0.4, 0, 1.8, -3.4, 0.4, -4.6, 2.2],
      scarfBase,
    );
    fillPoly(ctx, [-5.6, -4.6, -1, -4.8, -1.6, 1.2, -4.6, 2.2], scarfShadow, 0.4);
    ctx.fillStyle = scarfBase;
    ctx.fillRect(3.6, -1.2, 2.6, 5.6);
  }
}

/** A soft pixel-art halo behind Jesus's portrait head, matching `buildHalo()`'s in-world proportions. */
function drawHalo(ctx: CanvasRenderingContext2D): void {
  const cy = -6.4;
  ctx.globalAlpha = 0.15;
  fillEllipse(ctx, 0, cy + 0.7, 6.4, 2.1, palette.gold);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(0, cy, 5.4, 1.6, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawJesusFace(ctx: CanvasRenderingContext2D, expression: Expression, anim: PortraitAnim): void {
  drawHalo(ctx);
  drawGenericFace(
    ctx,
    JESUS_COLORS,
    { hairStyle: "waves", hairColors: palette.hair, beard: false, headscarf: false },
    expression,
    anim,
  );
}

/** Shepherd David's face, ported from the bespoke `buildShepherdHead()` in `src/parables/lost-sheep/sprites.ts` — ears, side-swept hair, catchlight eyes, nose hint, a beard — not on the shared archetype system, so it gets its own drawing code here too. The beard/hair shadow layers are toned down a touch versus the in-game sprite (which reads fine as a tiny stylized icon) so the same near-black tone doesn't swallow the whole face at portrait size; colors themselves are unchanged. */
function drawShepherdDavidFace(ctx: CanvasRenderingContext2D, expression: Expression, anim: PortraitAnim): void {
  const { browAngle, browLift, mouthCurve } = EXPRESSIONS[expression];
  const swayX = anim.swayX;
  const hair = palette.hair;

  fillCircle(ctx, 0, 0, 5.3, palette.skin.base);
  fillCircle(ctx, 1.8, 0.7, 3.6, palette.skin.shadow, 0.32);
  fillCircle(ctx, -1.6, -1.8, 2, palette.skin.highlight, 0.4);
  fillCircle(ctx, swayX - 5, 0.6, 1.1, palette.skin.base);
  fillCircle(ctx, swayX + 5, 0.6, 1.1, palette.skin.base);

  fillEllipse(ctx, swayX, -3.4, 5.6, 3, hair.base);
  fillEllipse(ctx, swayX, -4.2, 5.6, 1.7, hair.shadow, 0.3);
  fillEllipse(ctx, swayX - 1.4, -4.6, 2.6, 1.2, hair.highlight, 0.6);
  fillEllipse(ctx, swayX - 4.7, -1.6, 1.5, 2, hair.base);
  fillEllipse(ctx, swayX + 4.7, -1.6, 1.5, 2, hair.base);

  drawEyebrows(ctx, hair, browAngle, browLift, swayX);
  drawEyes(ctx, anim.blink, swayX);

  fillCircle(ctx, swayX - 0.4, 1.1, 0.4, palette.skin.shadow, 0.5);

  fillPoly(ctx, [-3.4, 1.6, 3.4, 1.6, 2.1, 5.6, 0, 6.9, -2.1, 5.6], hair.base);
  fillPoly(ctx, [-1.1, 2, 1.1, 2, 0.7, 4.8, -0.7, 4.8], hair.shadow, 0.4);

  drawMouth(ctx, mouthCurve, anim.mouthOpen, hair.shadow, "#3a2216", swayX);
}

const PORTRAIT_SCALE = 6.4;

/**
 * Draws the given speaker's face into `ctx`, filling a `size`x`size` square
 * centered on the canvas. Call once per animation frame — this clears and
 * redraws the whole thing, which is cheap at this scale (a few dozen fills),
 * so there's no need for retained/swappable sub-shapes.
 */
export function drawPortrait(
  ctx: CanvasRenderingContext2D,
  portraitId: PortraitId,
  expression: Expression,
  anim: PortraitAnim,
  size: number,
): void {
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2 + size * 0.06);
  ctx.scale(PORTRAIT_SCALE, PORTRAIT_SCALE);
  if (portraitId === "jesus") drawJesusFace(ctx, expression, anim);
  else drawShepherdDavidFace(ctx, expression, anim);
  ctx.restore();
}
