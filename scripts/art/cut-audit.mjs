// Run 11 (art audit) — which sliced frames cut an object in half?
//   node scripts/art/cut-audit.mjs [--all] [--out dir]
// For every manifest frame (floors/walls/trims/shadows and `split` blocks excluded — they are meant to
// tile), look at the source sheet just OUTSIDE each edge of the rect: an opaque pixel out there that
// touches an opaque pixel on the rect's edge means the object keeps going — the frame is a cut.
// Prints one line per flagged frame (edge → how many edge pixels continue) and writes a contact sheet
// of the flagged frames with a one-tile margin of context and the rect outlined (magenta) at 3×.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { chromium } from '@playwright/test';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');

const manifest = JSON.parse(fs.readFileSync('scripts/art/atlas-manifest.json', 'utf8'));
const TILE = manifest.tile ?? 32;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const showAll = args.includes('--all');
const only = opt('--only', null) ? new Set(fs.readFileSync(opt('--only'), 'utf8').split('\n').map(l => l.trim().split(/\s+/)[0]).filter(Boolean)) : null;
const outDir = opt('--out', '/private/tmp/claude-501/-Users-admin-Documents-GitHub-oop-hipaa-game/83d2d6a9-b2ae-402a-bb9f-a144641fd59e/scratchpad/audit');
fs.mkdirSync(outDir, { recursive: true });

const sheets = new Map();
const sheet = (id) => { if (!sheets.has(id)) sheets.set(id, PNG.sync.read(fs.readFileSync(path.join(manifest.vendor, manifest.sheets[id])))); return sheets.get(id); };
const alpha = (png, x, y) => (x < 0 || y < 0 || x >= png.width || y >= png.height) ? 0 : png.data[(y * png.width + x) * 4 + 3];

const SKIP = /^(floor|wall|trim|shadow)\./;
const rows = [];
for (const [name, f] of Object.entries(manifest.frames)) {
  if (SKIP.test(name) || f.split) continue;
  if (only && !only.has(name)) continue;
  const png = sheet(f.sheet);
  let x, y, w, h;
  if (f.px) [x, y, w, h] = f.px; else { const [tx, ty, tw, th] = f.t; x = tx * TILE; y = ty * TILE; w = tw * TILE; h = th * TILE; }
  // continuation count per edge: inside pixel opaque AND the pixel just outside opaque
  const cont = { top: 0, bottom: 0, left: 0, right: 0 };
  for (let i = 0; i < w; i++) {
    if (alpha(png, x + i, y) && alpha(png, x + i, y - 1)) cont.top++;
    if (alpha(png, x + i, y + h - 1) && alpha(png, x + i, y + h)) cont.bottom++;
  }
  for (let j = 0; j < h; j++) {
    if (alpha(png, x, y + j) && alpha(png, x - 1, y + j)) cont.left++;
    if (alpha(png, x + w - 1, y + j) && alpha(png, x + w, y + j)) cont.right++;
  }
  // how much of the rect is actually used (an empty frame is its own kind of wrong)
  let opaque = 0; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (alpha(png, x + i, y + j)) opaque++;
  const cut = Object.entries(cont).filter(([, n]) => n > 0).map(([e, n]) => `${e}:${n}`);
  const fill = opaque / (w * h);
  // the object's true extent: bbox of the 8-connected opaque region(s) touching the rect's opaque pixels
  let ext = null;
  if (cut.length) {
    const seen = new Set(); const stack = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (alpha(png, x + i, y + j)) { const k = (y + j) * png.width + x + i; if (!seen.has(k)) { seen.add(k); stack.push(k); } }
    let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1, n = 0;
    while (stack.length && n < 400000) {
      const k = stack.pop(); n++; const py = Math.floor(k / png.width), px = k % png.width;
      if (px < bx0) bx0 = px; if (px > bx1) bx1 = px; if (py < by0) by0 = py; if (py > by1) by1 = py;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = px + dx, ny = py + dy; if (alpha(png, nx, ny)) { const nk = ny * png.width + nx; if (!seen.has(nk)) { seen.add(nk); stack.push(nk); } } }
    }
    // snap to the tile grid
    const tx0 = Math.floor(bx0 / TILE), ty0 = Math.floor(by0 / TILE), tx1 = Math.floor(bx1 / TILE), ty1 = Math.floor(by1 / TILE);
    ext = { t: [tx0, ty0, tx1 - tx0 + 1, ty1 - ty0 + 1], px: [bx0, by0, bx1 - bx0 + 1, by1 - by0 + 1], huge: n >= 400000 };
  }
  if (cut.length || showAll || fill === 0) rows.push({ name, sheet: f.sheet, x, y, w, h, cut, fill, ext });
}
rows.sort((a, b) => a.sheet.localeCompare(b.sheet) || a.y - b.y || a.x - b.x);
for (const r of rows) {
  const here = `t:[${r.x / TILE},${r.y / TILE},${r.w / TILE},${r.h / TILE}]`;
  const ext = r.ext ? ` → object t:[${r.ext.t.join(',')}] (${r.ext.t[2]}x${r.ext.t[3]}${r.ext.huge ? ', huge' : ''}) px:[${r.ext.px.join(',')}]` : '';
  console.log(`${r.name.padEnd(34)} ${r.sheet.padEnd(11)} ${here.padEnd(18)} fill ${(r.fill * 100).toFixed(0).padStart(3)}%  ${r.cut.length ? 'CUT ' + r.cut.join(' ') : ''}${ext}`);
}
console.log(`\n${rows.length} flagged of ${Object.keys(manifest.frames).length} manifest entries`);

if (!rows.length) process.exit(0);
// contact sheet: each flagged frame with a 1-tile margin, rect outlined
const SC = +opt("--scale", 3), M = TILE, COLS = +opt("--cols", 6), LABEL = 26;
const cells = rows.map(r => {
  const png = sheet(r.sheet);
  const x0 = Math.max(0, r.x - M), y0 = Math.max(0, r.y - M), x1 = Math.min(png.width, r.x + r.w + M), y1 = Math.min(png.height, r.y + r.h + M);
  const cw = x1 - x0, ch = y1 - y0;
  const crop = new PNG({ width: cw, height: ch });
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const si = ((y0 + j) * png.width + x0 + i) * 4, di = (j * cw + i) * 4; crop.data[di] = png.data[si]; crop.data[di + 1] = png.data[si + 1]; crop.data[di + 2] = png.data[si + 2]; crop.data[di + 3] = png.data[si + 3]; }
  return { ...r, uri: 'data:image/png;base64,' + PNG.sync.write(crop).toString('base64'), cw, ch, rx: r.x - x0, ry: r.y - y0 };
});
const PER = +opt('--per', 24);
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 100, height: 100 } });
await page.setContent('<canvas id="c"></canvas>');
for (let pg = 0; pg * PER < cells.length; pg++) {
const pageCells = cells.slice(pg * PER, (pg + 1) * PER);
const CW = Math.max(...pageCells.map(c => c.cw)) * SC + 8, CH = Math.max(...pageCells.map(c => c.ch)) * SC + LABEL + 8;
const data = await page.evaluate(async ([cells, CW, CH, COLS, SC, LABEL]) => {
  const c = document.getElementById('c'); const R = Math.ceil(cells.length / COLS);
  c.width = COLS * CW; c.height = R * CH; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#202028'; g.fillRect(0, 0, c.width, c.height);
  for (let k = 0; k < cells.length; k++) {
    const cell = cells[k], ox = (k % COLS) * CW + 4, oy = Math.floor(k / COLS) * CH + LABEL;
    for (let yy = 0; yy < cell.ch * SC; yy += 12) for (let xx = 0; xx < cell.cw * SC; xx += 12) { g.fillStyle = ((xx + yy) / 12) % 2 ? '#3a3a44' : '#30303a'; g.fillRect(ox + xx, oy + yy, 12, 12); }
    const img = new Image(); img.src = cell.uri; await img.decode();
    g.drawImage(img, ox, oy, cell.cw * SC, cell.ch * SC);
    g.strokeStyle = '#ff33cc'; g.lineWidth = 2; g.strokeRect(ox + cell.rx * SC + 1, oy + cell.ry * SC + 1, cell.w * SC - 2, cell.h * SC - 2);
    g.fillStyle = '#ffd166'; g.font = 'bold 11px monospace'; g.textAlign = 'left';
    g.fillText(`${cell.name}  ${cell.w / 32}x${cell.h / 32}  ${cell.cut.join(' ')}`, ox, oy - 8);
  }
  return c.toDataURL('image/png');
}, [pageCells, CW, CH, COLS, SC, LABEL]);
const out = path.join(outDir, `${showAll ? 'frames-all' : 'frames-cut'}-${String(pg + 1).padStart(2, '0')}.png`);
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
console.log(`contact sheet -> ${out} (${pageCells[0].name} … ${pageCells[pageCells.length - 1].name})`);
}
await browser.close();
