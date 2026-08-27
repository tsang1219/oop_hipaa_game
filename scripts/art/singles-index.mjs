// Run 11 (art audit) — locate every LimeZu "single" (one object per PNG, Theme_Sorter_Singles) inside
// its theme sheet by exact pixel match, so objects can be sliced by their true extent instead of by
// eye. The theme sheets pack the singles edge to edge, which is why tile-snapped rects cut objects.
//   node scripts/art/singles-index.mjs <sheetId> <singlesDir> [--out scripts/art/singles/<sheetId>.json]
// Writes one JSON per theme: [{ n, file, w, h, at: [x, y], bbox: [x, y, w, h] }] (at = where the
// padded single sits on the sheet, bbox = its opaque pixels), plus a numbered contact sheet for browsing
// (scratchpad/audit/singles-<sheetId>.png). Singles that appear nowhere are listed at the end.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { chromium } from '@playwright/test';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');
const manifest = JSON.parse(fs.readFileSync('scripts/art/atlas-manifest.json', 'utf8'));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [sheetId, singlesDir] = args;
const sheet = PNG.sync.read(fs.readFileSync(path.join(manifest.vendor, manifest.sheets[sheetId])));
const SW = sheet.width, SH = sheet.height, SD = sheet.data;
const rgba = (d, i) => ((d[i] << 24) | (d[i + 1] << 16) | (d[i + 2] << 8) | d[i + 3]) >>> 0;
// index of sheet pixel positions by colour (opaque only)
const index = new Map();
for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) { const i = (y * SW + x) * 4; if (!SD[i + 3]) continue; const c = rgba(SD, i); let arr = index.get(c); if (!arr) { arr = []; index.set(c, arr); } arr.push(y * SW + x); }

const files = fs.readdirSync(singlesDir).filter(f => f.endsWith('.png')).sort((a, b) => (parseInt(a.match(/(\d+)\.png$/)?.[1] ?? 0) - parseInt(b.match(/(\d+)\.png$/)?.[1] ?? 0)));
const found = [], missing = [];
for (const file of files) {
  const s = PNG.sync.read(fs.readFileSync(path.join(singlesDir, file)));
  const op = []; let bx0 = s.width, by0 = s.height, bx1 = -1, by1 = -1;
  for (let y = 0; y < s.height; y++) for (let x = 0; x < s.width; x++) { const i = (y * s.width + x) * 4; if (!s.data[i + 3]) continue; op.push(x, y, rgba(s.data, i)); if (x < bx0) bx0 = x; if (y < by0) by0 = y; if (x > bx1) bx1 = x; if (y > by1) by1 = y; }
  if (!op.length) { missing.push(file + ' (empty)'); continue; }
  // anchor on the opaque pixel with the rarest colour in the sheet — fewest candidates to verify
  let best = 0, bestN = Infinity;
  for (let k = 0; k < op.length; k += 3) { const n = index.get(op[k + 2])?.length ?? 0; if (n < bestN) { bestN = n; best = k; } }
  const ax = op[best], ay = op[best + 1];
  const cands = index.get(op[best + 2]) ?? [];
  let hit = null;
  for (const p of cands) {
    const ox = (p % SW) - ax, oy = Math.floor(p / SW) - ay;
    if (ox < 0 || oy < 0 || ox + s.width > SW || oy + s.height > SH) continue;
    let ok = true;
    for (let k = 0; k < op.length; k += 3) { const i = ((oy + op[k + 1]) * SW + ox + op[k]) * 4; if (rgba(SD, i) !== op[k + 2]) { ok = false; break; } }
    if (ok) { hit = [ox, oy]; break; }
  }
  if (!hit) { missing.push(file); continue; }
  found.push({ n: parseInt(file.match(/(\d+)\.png$/)?.[1] ?? '0'), file, w: s.width, h: s.height, at: hit, bbox: [hit[0] + bx0, hit[1] + by0, bx1 - bx0 + 1, by1 - by0 + 1] });
}
found.sort((a, b) => a.n - b.n);
const out = opt('--out', `scripts/art/singles/${sheetId}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ sheet: sheetId, source: manifest.sheets[sheetId], singles: singlesDir, objects: found, missing }, null, 1));
console.log(`${found.length} singles located in ${sheetId}, ${missing.length} not found -> ${out}`);
if (missing.length) console.log('not found: ' + missing.slice(0, 20).join(', ') + (missing.length > 20 ? ` … +${missing.length - 20}` : ''));

// contact sheet: the theme sheet at 2× with every located single outlined + numbered
const SC = +opt('--scale', 2), PAGE = +opt('--page', 1600); // px of sheet per page
const uri = 'data:image/png;base64,' + fs.readFileSync(path.join(manifest.vendor, manifest.sheets[sheetId])).toString('base64');
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 100, height: 100 } });
await page.setContent(`<canvas id="c"></canvas><img id="i" src="${uri}">`);
await page.waitForFunction(() => document.getElementById('i').complete);
for (let py = 0; py < SH; py += PAGE) {
  const ph = Math.min(PAGE, SH - py);
  const data = await page.evaluate(([found, py, ph, SW, SC]) => {
    const ML = 34, MT = 22, TILE = 32; const img = document.getElementById('i'), c = document.getElementById('c');
    c.width = SW * SC + ML; c.height = ph * SC + MT; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, c.width, c.height);
    for (let yy = 0; yy < ph * SC; yy += 16) for (let xx = 0; xx < SW * SC; xx += 16) { g.fillStyle = ((xx + yy) / 16) % 2 ? '#3a3a3a' : '#2c2c2c'; g.fillRect(ML + xx, MT + yy, 16, 16); }
    g.drawImage(img, 0, py, SW, ph, ML, MT, SW * SC, ph * SC);
    g.strokeStyle = 'rgba(255,255,255,0.15)';
    for (let x = 0; x <= SW; x += TILE) { g.beginPath(); g.moveTo(ML + x * SC + .5, MT); g.lineTo(ML + x * SC + .5, c.height); g.stroke(); }
    for (let y = 0; y <= ph; y += TILE) { g.beginPath(); g.moveTo(ML, MT + y * SC + .5); g.lineTo(c.width, MT + y * SC + .5); g.stroke(); }
    g.fillStyle = '#ffd166'; g.font = 'bold 11px monospace'; g.textAlign = 'center';
    for (let x = 0; x < SW; x += TILE) g.fillText(String(x / TILE), ML + x * SC + TILE, 14);
    g.textAlign = 'right'; for (let y = 0; y < ph; y += TILE) g.fillText(String((py + y) / TILE), ML - 4, MT + y * SC + TILE + 4);
    for (const o of found) {
      const [bx, by, bw, bh] = o.bbox; if (by + bh <= py || by >= py + ph) continue;
      const rx = ML + bx * SC, ry = MT + (by - py) * SC;
      g.strokeStyle = '#ff33cc'; g.lineWidth = 1; g.strokeRect(rx + .5, ry + .5, bw * SC - 1, bh * SC - 1);
      g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(rx, ry, 24, 11); g.fillStyle = '#ff9ae9'; g.font = 'bold 9px monospace'; g.textAlign = 'left'; g.fillText(String(o.n), rx + 2, ry + 9);
    }
    return c.toDataURL('image/png');
  }, [found, py, ph, SW, SC]);
  const png = `/private/tmp/claude-501/-Users-admin-Documents-GitHub-oop-hipaa-game/83d2d6a9-b2ae-402a-bb9f-a144641fd59e/scratchpad/audit/singles-${sheetId}-${String(py / PAGE).padStart(2, '0')}.png`;
  if (args.includes('--no-contact')) break;
  fs.writeFileSync(png, Buffer.from(data.split(',')[1], 'base64'));
  console.log(`contact -> ${png}`);
}
await browser.close();
