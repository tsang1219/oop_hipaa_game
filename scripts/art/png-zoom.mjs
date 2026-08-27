// Run 11 — nearest-neighbour zoom of a PNG region:  node scripts/art/png-zoom.mjs <in.png> <x> <y> <w> <h> <scale> <out.png>
import { chromium } from '@playwright/test';
import fs from 'fs';
const [,, src, xA, yA, wA, hA, scA, out] = process.argv;
const [x, y, w, h, sc] = [xA, yA, wA, hA, scA].map(Number);
const uri = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 100, height: 100 } });
await page.setContent(`<canvas id="c"></canvas><img id="i" src="${uri}">`);
await page.waitForFunction(() => document.getElementById('i').complete);
const data = await page.evaluate(([x, y, w, h, sc]) => {
  const img = document.getElementById('i'), c = document.getElementById('c');
  c.width = w * sc; c.height = h * sc; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(img, x, y, w, h, 0, 0, w * sc, h * sc); return c.toDataURL('image/png');
}, [x, y, w, h, sc]);
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
