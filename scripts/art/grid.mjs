// Run 11 — before/after grid: one row per room, one column per suffix.
//   node scripts/art/grid.mjs before after [variantA ...]
import { chromium } from '@playwright/test';
import fs from 'fs';
const DIR = 'screenshots/art-substrate';
const suffixes = process.argv.slice(2).length ? process.argv.slice(2) : ['before', 'after'];
const ROOMS = ['hospital_entrance', 'reception', 'hallway_reception_break', 'break_room', 'hallway_break_lab', 'lab', 'hallway_lab_records', 'records_room', 'hallway_records_it', 'it_office', 'hallway_it_er', 'er', 'supply_closet'];
const rooms = ROOMS.filter(r => fs.existsSync(`${DIR}/${r}-${suffixes[1] ?? suffixes[0]}.png`));
const CW = 480, CH = 360, ML = 150, MT = 34, GAP = 8;
const cells = rooms.map(r => suffixes.map(s => fs.existsSync(`${DIR}/${r}-${s}.png`) ? 'data:image/png;base64,' + fs.readFileSync(`${DIR}/${r}-${s}.png`).toString('base64') : null));
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
await page.setContent('<canvas id="c"></canvas>');
const data = await page.evaluate(async ([rooms, suffixes, cells, CW, CH, ML, MT, GAP]) => {
  const c = document.getElementById('c');
  c.width = ML + suffixes.length * (CW + GAP); c.height = MT + rooms.length * (CH + GAP);
  const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.fillStyle = '#111118'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#ffd166'; g.font = 'bold 16px monospace'; g.textAlign = 'center';
  suffixes.forEach((s, i) => g.fillText(s.toUpperCase(), ML + i * (CW + GAP) + CW / 2, 22));
  for (let r = 0; r < rooms.length; r++) {
    g.fillStyle = '#e8e8f0'; g.font = 'bold 13px monospace'; g.textAlign = 'left';
    g.fillText(rooms[r], 8, MT + r * (CH + GAP) + 20);
    for (let i = 0; i < suffixes.length; i++) {
      const x = ML + i * (CW + GAP), y = MT + r * (CH + GAP);
      if (!cells[r][i]) { g.fillStyle = '#2a2a36'; g.fillRect(x, y, CW, CH); g.fillStyle = '#666'; g.textAlign = 'center'; g.fillText('(not yet)', x + CW / 2, y + CH / 2); g.textAlign = 'left'; continue; }
      const img = new Image(); img.src = cells[r][i]; await img.decode();
      g.drawImage(img, x, y, CW, CH);
    }
  }
  return c.toDataURL('image/png');
}, [rooms, suffixes, cells, CW, CH, ML, MT, GAP]);
const out = `${DIR}/grid-${suffixes.join('-vs-')}.png`;
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
console.log(`wrote ${out} (${rooms.length} rooms × ${suffixes.length})`);
