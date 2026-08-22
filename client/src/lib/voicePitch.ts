/**
 * AUD-04 — per-character voice. Everything derives from the NPC's signature
 * hex colour (spriteAssetPaths.getNPCColor) so the same character always
 * sounds the same, and you can tell speakers apart with your eyes shut.
 * Framework-free so the React dialogue UI and the Phaser mixer share it.
 */
export interface VoiceProfile {
  baseHz: number;
  wave: OscillatorType;
  durationMs: number;
  /** frequency multiplier at the end of the blip (<1 = downward chirp) */
  chirp: number;
  gain: number;
  lowpassHz: number;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return { h: 0, s: 0, l: 0.5 };
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

/** Sample-mode playback-rate multiplier in ~[0.78, 1.32] (Run 12 WIP behaviour). */
export function voicePitchForColor(hex: string): number {
  const { h } = hexToHsl(hex);
  return 0.78 + (h / 360) * 0.54;
}

/**
 * Synth-mode profile. Hue walks the pitch from a low ~170 Hz (reds/oranges —
 * warm, grounded voices) up to ~560 Hz (blues/violets — lighter, quicker);
 * saturation picks the waveform (vivid colours get the brighter square,
 * muted ones the rounder triangle); lightness shortens the syllable.
 */
export function voiceProfileForColor(hex: string): VoiceProfile {
  const { h, s, l } = hexToHsl(hex);
  const baseHz = 170 * Math.pow(2, (h / 360) * 1.72);
  const wave: OscillatorType = s > 0.72 ? 'square' : s > 0.45 ? 'sawtooth' : 'triangle';
  const durationMs = Math.round(48 + (1 - l) * 34); // 48–82ms
  return {
    baseHz,
    wave,
    durationMs,
    chirp: h < 180 ? 0.9 : 1.08,
    gain: wave === 'square' ? 0.55 : wave === 'sawtooth' ? 0.7 : 1,
    lowpassHz: 1800 + (h / 360) * 1400,
  };
}
