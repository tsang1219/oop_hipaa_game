// Run 11 — before|after crop pair from two screenshots, same region, labeled.
//   node scripts/art/crop-pair.mjs <before.png> <after.png> <x> <y> <w> <h> <scale> <out.png> [labelA] [labelB]
import { chromium } from '@playwright/test';
import fs from 'fs';
const [,, a, b, xA, yA, wA, hA, scA, out, la = 'BEFORE', lb = 'AFTER'] = process.argv;
const [x, y, w, h, sc] = [xA, yA, wA, hA, scA].map(Number);
const uris = [a, b].map(f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'));
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 100, height: 100 } });
await page.setContent(`<canvas id="c"></canvas><img id="a" src="${uris[0]}"><img id="b" src="${uris[1]}">`);
await page.waitForFunction(() => document.getElementById('a').complete && document.getElementById('b').complete);
const data = await page.evaluate(([x, y, w, h, sc, la, lb]) => {
  const c = document.getElementById('c'); const GAP = 10, LABEL = 22;
  c.width = 2 * w * sc + GAP; c.height = h * sc + LABEL; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#111118'; g.fillRect(0, 0, c.width, c.height);
  [['a', la, 0], ['b', lb, w * sc + GAP]].forEach(([id, label, ox]) => {
    g.drawImage(document.getElementById(id), x, y, w, h, ox, LABEL, w * sc, h * sc);
    g.fillStyle = '#ffd166'; g.font = 'bold 14px monospace'; g.textAlign = 'left'; g.fillText(label, ox + 4, 16);
  });
  return c.toDataURL('image/png');
}, [x, y, w, h, sc, la, lb]);
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
console.log(out);
