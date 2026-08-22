// Run 11 (art-substrate) — zoom a tile-rect of a sheet for close inspection.
//   node scripts/art/tile-zoom.mjs <sheet.png> <tx> <ty> <tw> <th> <scale> <out.png> [bg=#2c2c2c] [tile=32]
import { chromium } from '@playwright/test';
import fs from 'fs';
const [,, src, txA, tyA, twA, thA, scA, out, bg = '#2c2c2c', tileA = '32'] = process.argv;
const tx = +txA, ty = +tyA, tw = +twA, th = +thA, SC = +scA, TILE = +tileA;
const dataUri = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
await page.setContent(`<html><body style="margin:0"><canvas id="c"></canvas><img id="i" src="${dataUri}"></body></html>`);
await page.waitForFunction(() => document.getElementById('i').complete);
const data = await page.evaluate(([tx, ty, tw, th, SC, TILE, bg]) => {
  const img = document.getElementById('i'), c = document.getElementById('c');
  const ML = 30, MT = 22;
  c.width = tw * TILE * SC + ML; c.height = th * TILE * SC + MT;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = bg; g.fillRect(ML, MT, tw * TILE * SC, th * TILE * SC);
  g.drawImage(img, tx * TILE, ty * TILE, tw * TILE, th * TILE, ML, MT, tw * TILE * SC, th * TILE * SC);
  g.strokeStyle = 'rgba(255,0,255,0.45)'; g.lineWidth = 1;
  for (let x = 0; x <= tw; x++) { g.beginPath(); g.moveTo(ML + x * TILE * SC + 0.5, MT); g.lineTo(ML + x * TILE * SC + 0.5, c.height); g.stroke(); }
  for (let y = 0; y <= th; y++) { g.beginPath(); g.moveTo(ML, MT + y * TILE * SC + 0.5); g.lineTo(c.width, MT + y * TILE * SC + 0.5); g.stroke(); }
  g.fillStyle = '#ffd166'; g.font = 'bold 12px monospace'; g.textAlign = 'center';
  for (let x = 0; x < tw; x++) g.fillText(String(tx + x), ML + x * TILE * SC + TILE * SC / 2, 15);
  g.textAlign = 'right';
  for (let y = 0; y < th; y++) g.fillText(String(ty + y), ML - 4, MT + y * TILE * SC + TILE * SC / 2 + 4);
  return c.toDataURL('image/png');
}, [tx, ty, tw, th, SC, TILE, bg]);
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
console.log('wrote', out);
