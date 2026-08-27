// Run 11 (room-clean loop) — cut a room screenshot into nine overlapping 3× crops so every corner
// gets looked at. Coordinates printed per crop so defects can be located back to tiles.
//   node scripts/art/room-sweep.mjs <screenshot.png> <outDir> [--cols 3] [--rows 3] [--scale 3]
// Crops overlap by half a cell so nothing hides on a seam. For a 1280×960 capture each crop is
// ~640×480 source px rendered at 3× — read them ALL, in order.
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
const [src, outDir] = args;
if (!src || !outDir) { console.error('usage: room-sweep <screenshot.png> <outDir>'); process.exit(1); }
const COLS = opt('--cols', 3), ROWS = opt('--rows', 3), SC = opt('--scale', 3);
fs.mkdirSync(outDir, { recursive: true });
const uri = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 100, height: 100 } });
await page.setContent(`<canvas id="c"></canvas><img id="i" src="${uri}">`);
await page.waitForFunction(() => document.getElementById('i').complete);
const [W, H] = await page.evaluate(() => { const i = document.getElementById('i'); return [i.naturalWidth, i.naturalHeight]; });
// cell size with half-cell overlap: stride = (size - cell) / (n - 1)
const cw = Math.ceil(W / ((COLS + 1) / 2)), ch = Math.ceil(H / ((ROWS + 1) / 2));
const base = path.basename(src, '.png');
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const x = Math.min(Math.round(c * (W - cw) / Math.max(1, COLS - 1)), W - cw);
  const y = Math.min(Math.round(r * (H - ch) / Math.max(1, ROWS - 1)), H - ch);
  const data = await page.evaluate(([x, y, cw, ch, SC]) => {
    const img = document.getElementById('i'), cv = document.getElementById('c');
    cv.width = cw * SC; cv.height = ch * SC; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(img, x, y, cw, ch, 0, 0, cw * SC, ch * SC);
    return cv.toDataURL('image/png');
  }, [x, y, cw, ch, SC]);
  const out = path.join(outDir, `${base}-sweep-r${r}c${c}.png`);
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  console.log(`${out}  covers screenshot px [${x},${y} ${cw}x${ch}] = world px [${Math.round(x / 2)},${Math.round(y / 2)}] tiles [${(x / 64).toFixed(1)},${(y / 64).toFixed(1)}]..[${((x + cw) / 64).toFixed(1)},${((y + ch) / 64).toFixed(1)}]`);
}
await browser.close();
