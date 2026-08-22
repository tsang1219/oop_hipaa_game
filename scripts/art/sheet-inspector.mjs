// Run 11 (art-substrate) — labeled contact sheets for picking tile rects.
// Renders a tileset PNG in chunks at 2x with a 32px grid + absolute tile
// column/row labels, so frames can be chosen by exact tile coordinates.
//
//   node scripts/art/sheet-inspector.mjs <sheet.png> <outDir> [cols=16] [rows=12] [tile=32]
//
// Needs Google Chrome (PW_CHANNEL=chrome default) — no extra dependencies:
// pngjs ships inside playwright-core.
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');

const [,, src, outDir, colsArg = '16', rowsArg = '12', tileArg = '32'] = process.argv;
if (!src || !outDir) { console.error('usage: sheet-inspector <sheet.png> <outDir> [cols] [rows] [tile]'); process.exit(1); }
const COLS = +colsArg, ROWS = +rowsArg, TILE = +tileArg, SCALE = 2, ML = 40, MT = 28;
const png = PNG.sync.read(fs.readFileSync(src));
const W = png.width, H = png.height;
const tilesX = Math.ceil(W / TILE), tilesY = Math.ceil(H / TILE);
fs.mkdirSync(outDir, { recursive: true });
const dataUri = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
const base = path.basename(src, '.png');

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: COLS * TILE * SCALE + ML + 10, height: ROWS * TILE * SCALE + MT + 10 } });
await page.setContent(`<html><body style="margin:0;background:#1a1a1a"><canvas id="c"></canvas><img id="i" src="${dataUri}"></body></html>`);
await page.waitForFunction(() => document.getElementById('i').complete);

let n = 0;
for (let ty = 0; ty < tilesY; ty += ROWS) {
  for (let tx = 0; tx < tilesX; tx += COLS) {
    const data = await page.evaluate(([tx, ty, COLS, ROWS, TILE, SCALE, ML, MT, tilesX, tilesY]) => {
      const img = document.getElementById('i');
      const c = document.getElementById('c');
      const cols = Math.min(COLS, tilesX - tx), rows = Math.min(ROWS, tilesY - ty);
      c.width = cols * TILE * SCALE + ML; c.height = rows * TILE * SCALE + MT;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, c.width, c.height);
      // transparency checker
      for (let y = 0; y < rows * TILE * SCALE; y += 16) for (let x = 0; x < cols * TILE * SCALE; x += 16) {
        g.fillStyle = ((x + y) / 16) % 2 ? '#3a3a3a' : '#2c2c2c'; g.fillRect(ML + x, MT + y, 16, 16);
      }
      g.drawImage(img, tx * TILE, ty * TILE, cols * TILE, rows * TILE, ML, MT, cols * TILE * SCALE, rows * TILE * SCALE);
      g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1;
      for (let x = 0; x <= cols; x++) { g.beginPath(); g.moveTo(ML + x * TILE * SCALE + 0.5, MT); g.lineTo(ML + x * TILE * SCALE + 0.5, c.height); g.stroke(); }
      for (let y = 0; y <= rows; y++) { g.beginPath(); g.moveTo(ML, MT + y * TILE * SCALE + 0.5); g.lineTo(c.width, MT + y * TILE * SCALE + 0.5); g.stroke(); }
      g.fillStyle = '#ffd166'; g.font = 'bold 13px monospace'; g.textAlign = 'center';
      for (let x = 0; x < cols; x++) g.fillText(String(tx + x), ML + x * TILE * SCALE + TILE, 18);
      g.textAlign = 'right';
      for (let y = 0; y < rows; y++) g.fillText(String(ty + y), ML - 6, MT + y * TILE * SCALE + TILE + 4);
      return c.toDataURL('image/png');
    }, [tx, ty, COLS, ROWS, TILE, SCALE, ML, MT, tilesX, tilesY]);
    const out = path.join(outDir, `${base}__c${String(tx).padStart(2, '0')}_r${String(ty).padStart(3, '0')}.png`);
    fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
    n++;
  }
}
await browser.close();
console.log(`${base}: ${W}x${H} (${tilesX}x${tilesY} tiles) -> ${n} chunks in ${outDir}`);
