// Run 11 — labeled contact sheet of atlas frames, filtered by manifest sheet id or name prefix.
//   node scripts/art/atlas-contact.mjs --sheet living [--out file.png]
//   node scripts/art/atlas-contact.mjs --prefix prop.couch
import { chromium } from '@playwright/test';
import fs from 'fs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const sheetId = opt('--sheet', null), prefix = opt('--prefix', null);
const manifest = JSON.parse(fs.readFileSync('scripts/art/atlas-manifest.json', 'utf8'));
const atlas = JSON.parse(fs.readFileSync(`${manifest.output}/${manifest.name}.json`, 'utf8'));
const names = Object.keys(atlas.frames).filter(n => {
  const base = n.replace(/\.\d+$/, '');
  const entry = manifest.frames[n] ?? manifest.frames[base];
  if (sheetId && entry?.sheet !== sheetId) return false;
  if (prefix && !n.startsWith(prefix)) return false;
  return true;
});
if (!names.length) { console.error('no frames matched'); process.exit(1); }
const SCALE = 2, COLS = 8, PAD = 8, LABEL = 14;
const cells = names.map(n => ({ n, f: atlas.frames[n].frame }));
const cw = Math.max(...cells.map(c => c.f.w * SCALE)) + PAD * 2, ch = Math.max(...cells.map(c => c.f.h * SCALE)) + LABEL + PAD * 2;
const rows = Math.ceil(cells.length / COLS);
const out = opt('--out', `/private/tmp/claude-501/-Users-admin-Documents-GitHub-oop-hipaa-game/8bd439a0-18e5-4ba6-b6d4-b4303712f20e/scratchpad/zoom/atlas-${sheetId ?? prefix}.png`);
const dataUri = 'data:image/png;base64,' + fs.readFileSync(`${manifest.output}/${manifest.name}.png`).toString('base64');
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
await page.setContent(`<canvas id="c"></canvas><img id="i" src="${dataUri}">`);
await page.waitForFunction(() => document.getElementById('i').complete);
const data = await page.evaluate(([cells, cw, ch, COLS, rows, SCALE, PAD, LABEL]) => {
  const img = document.getElementById('i'), c = document.getElementById('c');
  c.width = COLS * cw; c.height = rows * ch;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, c.width, c.height);
  cells.forEach((cell, i) => {
    const x = (i % COLS) * cw, y = Math.floor(i / COLS) * ch;
    g.fillStyle = (i % 2) ? '#343434' : '#3c3c3c'; g.fillRect(x, y, cw, ch);
    g.drawImage(img, cell.f.x, cell.f.y, cell.f.w, cell.f.h, x + PAD, y + PAD, cell.f.w * SCALE, cell.f.h * SCALE);
    g.fillStyle = '#ffd166'; g.font = '10px monospace'; g.textAlign = 'left';
    g.fillText(cell.n.replace(/^prop\./, ''), x + 2, y + ch - 4);
  });
  return c.toDataURL('image/png');
}, [cells, cw, ch, COLS, rows, SCALE, PAD, LABEL]);
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
console.log(`${names.length} frames -> ${out}`);
