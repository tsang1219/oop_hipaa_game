export const TILE = 32;

// ── Color utility helpers ────────────────────────────────────────────
/** Darken a 0xRRGGBB color by reducing each channel by `amount` (clamped to 0). */
export function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) - amount);
  const g = Math.max(0, ((color >> 8) & 0xff) - amount);
  const b = Math.max(0, (color & 0xff) - amount);
  return (r << 16) | (g << 8) | b;
}

/** Lighten a 0xRRGGBB color by increasing each channel by `amount` (clamped to 255). */
export function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + amount);
  const g = Math.min(255, ((color >> 8) & 0xff) + amount);
  const b = Math.min(255, (color & 0xff) + amount);
  return (r << 16) | (g << 8) | b;
}
