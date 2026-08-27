// Run 11 — side-by-side comparison of vendor animated-object sheets (all frames, 3x, 32px grid).
//   node scripts/art/sheet-compare.mjs <out.png> <sheetName> [sheetName...]   (names relative to 3_Animated_objects/32x32/spritesheets, no .png)
// Composite: every candidate door sheet, all frames, 3x, stacked with labels.
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
const V = 'attached_assets/vendor/modern-interiors/3_Animated_objects/32x32/spritesheets';
const names = process.argv.slice(3);
const out = process.argv[2];
const SCALE = 3;
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
const imgs = names.map(n => ({ n, uri: 'data:image/png;base64,' + fs.readFileSync(path.join(V, n + '.png')).toString('base64') }));
await page.setContent('<canvas id="c"></canvas>' + imgs.map((im, i) => `<img id="i${i}" src="${im.uri}">`).join(''));
await page.waitForFunction((n) => { for (let i = 0; i < n; i++) if (!document.getElementById('i' + i).complete) return false; return true; }, imgs.length);
const data = await page.evaluate(([names, SCALE]) => {
  const els = names.map((_, i) => document.getElementById('i' + i));
  const W = Math.max(...els.map(e => e.naturalWidth)) * SCALE + 10;
  const H = els.reduce((a, e) => a + e.naturalHeight * SCALE + 22, 0);
  const c = document.getElementById('c'); c.width = Math.min(W, 2400); c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, c.width, c.height);
  let y = 0;
  els.forEach((e, i) => {
    g.fillStyle = '#ffd166'; g.font = 'bold 12px monospace'; g.textAlign = 'left';
    g.fillText(`${names[i]}  ${e.naturalWidth}x${e.naturalHeight}`, 4, y + 14); y += 18;
    // checker
    for (let yy = 0; yy < e.naturalHeight * SCALE; yy += 16) for (let xx = 0; xx < Math.min(e.naturalWidth * SCALE, c.width); xx += 16) { g.fillStyle = ((xx + yy) / 16) % 2 ? '#3a3a3a' : '#2c2c2c'; g.fillRect(xx, y + yy, 16, 16); }
    g.drawImage(e, 0, 0, e.naturalWidth, e.naturalHeight, 0, y, e.naturalWidth * SCALE, e.naturalHeight * SCALE);
    // 32px grid
    g.strokeStyle = 'rgba(255,255,255,0.25)';
    for (let x = 0; x <= e.naturalWidth; x += 32) { g.beginPath(); g.moveTo(x * SCALE + .5, y); g.lineTo(x * SCALE + .5, y + e.naturalHeight * SCALE); g.stroke(); }
    for (let yy = 0; yy <= e.naturalHeight; yy += 32) { g.beginPath(); g.moveTo(0, y + yy * SCALE + .5); g.lineTo(e.naturalWidth * SCALE, y + yy * SCALE + .5); g.stroke(); }
    y += e.naturalHeight * SCALE + 4;
  });
  return c.toDataURL('image/png');
}, [names, SCALE]);
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
console.log(out);
