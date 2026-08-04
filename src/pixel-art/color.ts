export function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export function lerpColor(a: string, b: string, t: number): number {
  const ah = hexToNumber(a);
  const bh = hexToNumber(b);
  const ar = (ah >> 16) & 0xff;
  const ag = (ah >> 8) & 0xff;
  const ab = ah & 0xff;
  const br = (bh >> 16) & 0xff;
  const bg = (bh >> 8) & 0xff;
  const bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
