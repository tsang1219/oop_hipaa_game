// Run 11 (art audit) — list every separate object (8-connected opaque region) in a region of a vendor
// sheet, with exact pixel rects, and render a labeled zoom so a manifest entry can be written from it.
//   node scripts/art/objects.mjs <sheetId|path> <tx0> <ty0> <tw> <th> [--scale 4] [--out file.png] [--min 12]
// sheetId = a key of manifest.sheets (e.g. hospital); tiles are 32 px. Components smaller than --min px
// (area) are dropped. Output lines: #n px:[x,y,w,h] tiles:[tx,ty,tw,th] size WxH.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { chromium } from '@playwright/test';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');
const manifest = JSON.parse(fs.readFileSync('scripts/art/atlas-manifest.json', 'utf8'));
const TILE = 32;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [id, tx0A, ty0A, twA, thA] = args;
const src = manifest.sheets[id] ? path.join(manifest.vendor, manifest.sheets[id]) : id;
const png = PNG.sync.read(fs.readFileSync(src));
const x0 = +tx0A * TILE, y0 = +ty0A * TILE, W = +twA * TILE, H = +thA * TILE;
const SC = +opt('--scale', 4), MIN = +opt('--min', 12);
const a = (x, y) => (x < 0 || y < 0 || x >= png.width || y >= png.height) ? 0 : png.data[(y * png.width + x) * 4 + 3];
const seen = new Uint8Array(png.width * png.height);
const comps = [];
for (let y = y0; y < Math.min(png.height, y0 + H); y++) for (let x = x0; x < Math.min(png.width, x0 + W); x++) {
  const k = y * png.width + x;
  if (!a(x, y) || seen[k]) continue;
  let bx0 = x, by0 = y, bx1 = x, by1 = y, n = 0; const stack = [k]; seen[k] = 1;
  while (stack.length) {
    const q = stack.pop(); n++; const qy = Math.floor(q / png.width), qx = q % png.width;
    if (qx < bx0) bx0 = qx; if (qx > bx1) bx1 = qx; if (qy < by0) by0 = qy; if (qy > by1) by1 = qy;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = qx + dx, ny = qy + dy; if (a(nx, ny)) { const nk = ny * png.width + nx; if (!seen[nk]) { seen[nk] = 1; stack.push(nk); } } }
  }
  if (n >= MIN) comps.push({ x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1, n });
}
comps.sort((p, q) => p.y - q.y || p.x - q.x);
comps.forEach((c, i) => console.log(`#${String(i + 1).padEnd(3)} px:[${c.x},${c.y},${c.w},${c.h}]  tiles:[${Math.floor(c.x / TILE)},${Math.floor(c.y / TILE)},${Math.ceil((c.x + c.w) / TILE) - Math.floor(c.x / TILE)},${Math.ceil((c.y + c.h) / TILE) - Math.floor(c.y / TILE)}]  ${c.w}x${c.h}  (${c.n}px)`));

const out = opt('--out', `/private/tmp/claude-501/-Users-admin-Documents-GitHub-oop-hipaa-game/83d2d6a9-b2ae-402a-bb9f-a144641fd59e/scratchpad/audit/objects-${path.basename(id).replace(/\W+/g, '_')}-${tx0A}-${ty0A}.png`);
const crop = new PNG({ width: Math.min(W, png.width - x0), height: Math.min(H, png.height - y0) });
for (let j = 0; j < crop.height; j++) for (let i = 0; i < crop.width; i++) { const si = ((y0 + j) * png.width + x0 + i) * 4, di = (j * crop.width + i) * 4; for (let c = 0; c < 4; c++) crop.data[di + c] = png.data[si + c]; }
const uri = 'data:image/png;base64,' + PNG.sync.write(crop).toString('base64');
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 100, height: 100 } });
await page.setContent(`<canvas id="c"></canvas><img id="i" src="${uri}">`);
await page.waitForFunction(() => document.getElementById('i').complete);
const data = await page.evaluate(([comps, x0, y0, SC, TILE, cw, ch]) => {
  const ML = 34, MT = 22; const img = document.getElementById('i'), c = document.getElementById('c');
  c.width = cw * SC + ML; c.height = ch * SC + MT; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, c.width, c.height);
  for (let yy = 0; yy < ch * SC; yy += 16) for (let xx = 0; xx < cw * SC; xx += 16) { g.fillStyle = ((xx + yy) / 16) % 2 ? '#3a3a3a' : '#2c2c2c'; g.fillRect(ML + xx, MT + yy, 16, 16); }
  g.drawImage(img, ML, MT, cw * SC, ch * SC);
  g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1;
  for (let x = 0; x <= cw; x += TILE) { g.beginPath(); g.moveTo(ML + x * SC + .5, MT); g.lineTo(ML + x * SC + .5, c.height); g.stroke(); }
  for (let y = 0; y <= ch; y += TILE) { g.beginPath(); g.moveTo(ML, MT + y * SC + .5); g.lineTo(c.width, MT + y * SC + .5); g.stroke(); }
  g.fillStyle = '#ffd166'; g.font = 'bold 12px monospace'; g.textAlign = 'center';
  for (let x = 0; x < cw; x += TILE) g.fillText(String((x0 + x) / TILE), ML + x * SC + TILE * SC / 2, 15);
  g.textAlign = 'right'; for (let y = 0; y < ch; y += TILE) g.fillText(String((y0 + y) / TILE), ML - 4, MT + y * SC + TILE * SC / 2 + 4);
  comps.forEach((cc, i) => {
    const rx = ML + (cc.x - x0) * SC, ry = MT + (cc.y - y0) * SC;
    g.strokeStyle = '#ff33cc'; g.lineWidth = 1; g.strokeRect(rx + .5, ry + .5, cc.w * SC - 1, cc.h * SC - 1);
    g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(rx, ry, 22, 12); g.fillStyle = '#ff88ee'; g.font = 'bold 10px monospace'; g.textAlign = 'left'; g.fillText(String(i + 1), rx + 2, ry + 10);
  });
  return c.toDataURL('image/png');
}, [comps, x0, y0, SC, TILE, crop.width, crop.height]);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
console.log(`${comps.length} objects -> ${out}`);
