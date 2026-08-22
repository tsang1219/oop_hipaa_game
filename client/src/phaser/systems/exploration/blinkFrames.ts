import Phaser from 'phaser';

/**
 * ANIM-01 — "every character blinks."
 *
 * Instead of drawing a dark bar over where we *hope* the eyes are, this builds
 * a real closed-eye variant of every character sheet at boot, from the sheet's
 * own pixels. The idle frames (down / left / right — `up` has no eyes) get
 * their eye pixels replaced with the character's sampled skin colour plus a
 * one-pixel lid line. The result is registered as `${sheetKey}_blink` with
 * frame indices that line up 1:1 with the source sheet, so a blink is simply:
 *
 *     sprite.setTexture(blinkTextureKey(sheet), sameFrameIndex)   // ~100ms
 *     sprite.setTexture(sheet, sameFrameIndex)
 *
 * and the walk animations (which carry their own texture key) restore the
 * open-eye sheet on their own the moment the character moves.
 *
 * Eye detection (verified against all 13 sheets on disk, see RUN_REPORT-12):
 *   1. Every template-drawn face has exactly one bright highlight pixel per
 *      eye, with the pupil directly beside AND below it. That pair is the eye.
 *   2. The two AI-drawn player skins (Alex, Nikhil) have no highlight; their
 *      eyes are small dark blobs (2–9 px, ≥2 rows tall) floating inside skin,
 *      not touching the hair line. Those are found by connected components.
 *   If neither rule fires for a frame, that frame is left untouched (the
 *   character just doesn't blink in that facing) — never a wrong guess.
 */

const COLS = 3;
const FRAME = 32;
const IDLE_FRAMES = [0, 3, 6]; // down, left, right (row * COLS)

export const BLINK_SUFFIX = '_blink';
export function blinkTextureKey(sheetKey: string): string {
  return `${sheetKey}${BLINK_SUFFIX}`;
}

/** Data URLs of generated blink sheets — the React dialogue portrait crops
 *  these the same way it crops the walk sheet, so portraits blink too. */
const blinkSheetDataUrls = new Map<string, string>();
export function getBlinkSheetDataUrl(sheetKey: string): string | undefined {
  return blinkSheetDataUrls.get(sheetKey);
}

type Pixel = { r: number; g: number; b: number; a: number };
type PixelClass = 'none' | 'dark' | 'white' | 'skin';

interface EyeBox { x0: number; x1: number; y0: number; y1: number }

function classify(p: Pixel): PixelClass {
  if (p.a < 128) return 'none';
  const luma = (p.r + p.g + p.b) / 3;
  const sat = Math.max(p.r, p.g, p.b) - Math.min(p.r, p.g, p.b);
  if (luma < 75) return 'dark';
  if (luma > 215 && sat < 40) return 'white';
  return 'skin';
}

/**
 * Build the blink sheet for `sheetKey` if it doesn't exist yet.
 * Returns true when a blink texture is available afterwards.
 */
export function ensureBlinkTexture(scene: Phaser.Scene, sheetKey: string): boolean {
  const blinkKey = blinkTextureKey(sheetKey);
  if (scene.textures.exists(blinkKey)) return true;
  if (!scene.textures.exists(sheetKey)) return false;

  const tex = scene.textures.get(sheetKey);
  const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  if (!src || !(src as HTMLImageElement).width) return false;

  const w = (src as HTMLImageElement).width;
  const h = (src as HTMLImageElement).height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;
  ctx.imageSmoothingEnabled = false;
  try {
    ctx.drawImage(src, 0, 0);
  } catch (_) {
    return false;
  }

  let image: ImageData;
  try {
    image = ctx.getImageData(0, 0, w, h);
  } catch (_) {
    return false; // tainted canvas (cross-origin sheet) — no blink for this sheet
  }

  let modified = 0;
  for (const f of IDLE_FRAMES) {
    const fx = (f % COLS) * FRAME;
    const fy = Math.floor(f / COLS) * FRAME;
    if (fx + FRAME > w || fy + FRAME > h) continue;
    if (closeEyesInFrame(image, fx, fy)) modified++;
  }
  if (modified === 0) return false;

  ctx.putImageData(image, 0, 0);
  scene.textures.addCanvas(blinkKey, canvas);
  const blinkTex = scene.textures.get(blinkKey);
  const frameCount = Math.floor(w / FRAME) * Math.floor(h / FRAME);
  for (let i = 0; i < frameCount; i++) {
    blinkTex.add(i, 0, (i % COLS) * FRAME, Math.floor(i / COLS) * FRAME, FRAME, FRAME);
  }
  try {
    blinkSheetDataUrls.set(sheetKey, canvas.toDataURL('image/png'));
  } catch (_) { /* non-fatal — portrait just won't blink */ }
  return true;
}

/** Returns true if eyes were found and closed in this frame. */
function closeEyesInFrame(image: ImageData, fx: number, fy: number): boolean {
  const { width, data } = image;
  const px = (x: number, y: number): Pixel => {
    const i = ((fy + y) * width + (fx + x)) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };
  const cls = (x: number, y: number): PixelClass =>
    x < 0 || y < 0 || x >= FRAME || y >= FRAME ? 'none' : classify(px(x, y));
  const put = (x: number, y: number, p: Pixel) => {
    if (x < 0 || y < 0 || x >= FRAME || y >= FRAME) return;
    const i = ((fy + y) * width + (fx + x)) * 4;
    data[i] = p.r; data[i + 1] = p.g; data[i + 2] = p.b; data[i + 3] = 255;
  };

  let boxes = findEyesByHighlight(cls);
  if (boxes.length === 0) boxes = findEyesByBlob(cls);
  if (boxes.length === 0) return false;

  for (const box of boxes) {
    const yMid = Math.floor((box.y0 + box.y1) / 2);
    // Skin sample: look inward (toward the nose) first, then outward.
    const candidates: Array<[number, number]> = [
      [box.x1 + 2, yMid], [box.x0 - 2, yMid], [box.x1 + 2, yMid + 1],
      [box.x0 - 2, yMid + 1], [box.x1 + 1, box.y1 + 1], [box.x0, box.y1 + 1],
    ];
    let skin: Pixel | null = null;
    for (const [sx, sy] of candidates) {
      if (cls(sx, sy) === 'skin') { skin = px(sx, sy); break; }
    }
    if (!skin) {
      // Dark-skinned face (the officer): no "skin"-class pixel exists, so the
      // face colour itself is what reads as "dark". Use it — the eye highlight
      // vanishing IS the blink.
      for (const [sx, sy] of candidates) {
        if (cls(sx, sy) === 'dark') { skin = px(sx, sy); break; }
      }
    }
    if (!skin) continue;
    const lid: Pixel = {
      r: Math.round(skin.r * 0.62), g: Math.round(skin.g * 0.62), b: Math.round(skin.b * 0.62), a: 255,
    };
    for (let y = box.y0; y <= box.y1; y++) {
      for (let x = box.x0; x <= box.x1; x++) {
        put(x, y, y === yMid ? lid : skin);
      }
    }
  }
  return true;
}

/** Rule 1 — template faces: a bright highlight pixel with the pupil beside and below it. */
function findEyesByHighlight(cls: (x: number, y: number) => PixelClass): EyeBox[] {
  const boxes: EyeBox[] = [];
  for (let y = 7; y <= 11; y++) {
    for (let x = 12; x <= 19; x++) {
      if (cls(x, y) !== 'white') continue;
      if (cls(x, y + 1) !== 'dark') continue;
      const darkLeft = cls(x - 1, y) === 'dark';
      const darkRight = cls(x + 1, y) === 'dark';
      if (!darkLeft && !darkRight) continue;
      const box: EyeBox = darkLeft
        ? { x0: x - 1, x1: x, y0: y, y1: y + 2 }
        : { x0: x, x1: x + 1, y0: y, y1: y + 2 };
      if (!boxes.some(b => Math.abs(b.x0 - box.x0) < 2 && Math.abs(b.y0 - box.y0) < 2)) {
        boxes.push(box);
      }
    }
  }
  return boxes.slice(0, 2);
}

/** Rule 2 — hand-drawn faces without highlights: small dark blobs inside the face. */
function findEyesByBlob(cls: (x: number, y: number) => PixelClass): EyeBox[] {
  const X0 = 11, X1 = 20, Y0 = 7, Y1 = 11;
  const seen = new Set<number>();
  const key = (x: number, y: number) => y * FRAME + x;
  const blobs: Array<{ size: number; box: EyeBox; touchesTop: boolean }> = [];
  for (let y = Y0; y <= Y1; y++) {
    for (let x = X0; x <= X1; x++) {
      if (seen.has(key(x, y)) || cls(x, y) !== 'dark') continue;
      // flood fill (4-connected) within the window
      const stack: Array<[number, number]> = [[x, y]];
      seen.add(key(x, y));
      let size = 0;
      let touchesTop = false;
      let leaks = false; // dark neighbour outside the window = part of hair/outline
      const box: EyeBox = { x0: x, x1: x, y0: y, y1: y };
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        size++;
        if (cy === Y0) touchesTop = true;
        box.x0 = Math.min(box.x0, cx); box.x1 = Math.max(box.x1, cx);
        box.y0 = Math.min(box.y0, cy); box.y1 = Math.max(box.y1, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = cx + dx, ny = cy + dy;
          if (cls(nx, ny) !== 'dark') continue;
          if (nx < X0 || nx > X1 || ny < Y0 || ny > Y1) { leaks = true; continue; }
          if (seen.has(key(nx, ny))) continue;
          seen.add(key(nx, ny));
          stack.push([nx, ny]);
        }
      }
      const height = box.y1 - box.y0 + 1;
      if (size >= 2 && size <= 9 && height >= 2 && height <= 4 && !touchesTop && !leaks) {
        blobs.push({ size, box, touchesTop });
      }
    }
  }
  blobs.sort((a, b) => b.size - a.size);
  return blobs.slice(0, 2).map(b => b.box);
}
