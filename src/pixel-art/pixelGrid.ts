/**
 * A pixel-grid sprite: rows of characters, each character mapped to a color
 * through `legend`. '.' is always transparent. This is the shared primitive
 * every hand-coded sprite (icons, characters, props) is authored with, so
 * swapping to real artwork later only means changing the renderer, not the
 * callers.
 */
export interface PixelGridSprite {
  rows: string[];
  legend: Record<string, string>;
}

export function drawPixelGridSprite(
  ctx: CanvasRenderingContext2D,
  sprite: PixelGridSprite,
  x: number,
  y: number,
  pixelSize: number,
): void {
  const { rows, legend } = sprite;
  for (let row = 0; row < rows.length; row++) {
    const line = rows[row];
    for (let col = 0; col < line.length; col++) {
      const char = line[col];
      if (char === "." || char === undefined) continue;
      const color = legend[char];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
    }
  }
}

export function spriteSize(sprite: PixelGridSprite): { cols: number; rows: number } {
  const rows = sprite.rows.length;
  const cols = rows > 0 ? Math.max(...sprite.rows.map((r) => r.length)) : 0;
  return { cols, rows };
}
