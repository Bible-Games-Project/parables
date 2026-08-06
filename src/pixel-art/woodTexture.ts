import { palette } from "@/pixel-art/palette";
import { createRng } from "@/pixel-art/prng";

export type SurfaceState = "idle" | "hover" | "active" | "disabled";

const ART_PIXEL = 4;

interface WoodShades {
  darker: string;
  dark: string;
  base: string;
  light: string;
  highlight: string;
}

function shadesForState(state: SurfaceState): WoodShades {
  if (state === "disabled") return palette.woodDisabled;
  if (state === "hover") {
    return {
      darker: palette.wood.dark,
      dark: palette.wood.base,
      base: palette.wood.light,
      light: palette.wood.highlight,
      highlight: "#f2cf99",
    };
  }
  if (state === "active") {
    return {
      darker: "#241305",
      dark: palette.wood.darker,
      base: palette.wood.dark,
      light: palette.wood.base,
      highlight: palette.wood.light,
    };
  }
  return palette.wood;
}

/**
 * Paints a hand-authored wooden sign/panel texture directly on a canvas:
 * plank grain bands, a few knots, and a beveled pixel border. Deterministic
 * per (seed, size, state) so it doesn't flicker on re-render.
 */
export function paintWoodSurface(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: { seed: number; state: SurfaceState; cornerRadius?: number; dimForText?: boolean },
): void {
  const { seed, state } = options;
  const shades = shadesForState(state);
  const cols = Math.ceil(width / ART_PIXEL);
  const rows = Math.ceil(height / ART_PIXEL);
  const rng = createRng(seed);

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  roundedRectPath(ctx, 0, 0, width, height, options.cornerRadius ?? ART_PIXEL * 2);
  ctx.clip();

  // Base fill.
  ctx.fillStyle = shades.base;
  ctx.fillRect(0, 0, width, height);

  // Horizontal plank grain bands.
  let row = 0;
  while (row < rows) {
    const bandHeight = 3 + Math.floor(rng() * 3);
    const roll = rng();
    const shade = roll < 0.18 ? shades.dark : roll > 0.88 ? shades.light : null;
    if (shade) {
      ctx.fillStyle = shade;
      ctx.fillRect(0, row * ART_PIXEL, width, bandHeight * ART_PIXEL);
    }
    row += bandHeight;
  }

  // Plank seam lines every ~7 art-pixel rows.
  ctx.fillStyle = shades.darker;
  for (let seamRow = 6; seamRow < rows; seamRow += 7) {
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, seamRow * ART_PIXEL, width, ART_PIXEL);
    ctx.globalAlpha = 1;
  }

  // Knots.
  const knotCount = Math.max(1, Math.round((cols * rows) / 260));
  for (let i = 0; i < knotCount; i++) {
    const kx = Math.floor(rng() * (cols - 4)) + 2;
    const ky = Math.floor(rng() * (rows - 4)) + 2;
    ctx.fillStyle = shades.darker;
    ctx.fillRect(kx * ART_PIXEL, ky * ART_PIXEL, ART_PIXEL * 2, ART_PIXEL * 2);
    ctx.fillStyle = shades.dark;
    ctx.fillRect((kx + 1) * ART_PIXEL, (ky - 1) * ART_PIXEL, ART_PIXEL, ART_PIXEL);
  }

  // A semi-transparent black wash over the whole surface, so the text laid
  // on top of it stays readable no matter how light or busy the wood grain
  // underneath is — without hiding the grain itself.
  if (options.dimForText) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();

  // Beveled pixel border.
  const border = ART_PIXEL;
  roundedRectPath(ctx, 0, 0, width, height, options.cornerRadius ?? ART_PIXEL * 2);
  ctx.lineWidth = border;
  ctx.strokeStyle = shades.darker;
  ctx.stroke();

  if (state !== "active") {
    ctx.strokeStyle = shades.highlight;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(border, height - border);
    ctx.lineTo(border, border);
    ctx.lineTo(width - border, border);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
