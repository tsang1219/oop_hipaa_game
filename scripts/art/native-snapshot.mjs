// Run 11 — pixel-exact 640x480 frame straight from Phaser's renderer (no CSS scaling), plus a 2x nearest crop.
//   node scripts/art/native-snapshot.mjs <room> <outDir> [x y w h]
import { chromium } from '@playwright/test';
import fs from 'fs';
import { createRequire } from 'module';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');
const [,, room = 'reception', outDir = 'screenshots/art-substrate', cx = '140', cy = '255', cw = '170', ch = '110'] = process.argv;
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
await page.goto(`http://localhost:8080/?qa-room=${room}&qa-no-save&qa_no_encounter=1`);
await page.waitForFunction(r => window.__QA__?.currentRoomId === r, room, { timeout: 30000 });
await page.waitForTimeout(3200);
const dataUrl = await page.evaluate(() => new Promise(res => { const s = window.__QA_SCENE__; s.game.renderer.snapshot(img => res(img.src)); }));
const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
fs.writeFileSync(`${outDir}/${room}-native-1x.png`, buf);
const p = PNG.sync.read(buf);
const x0 = +cx, y0 = +cy, w = +cw, h = +ch, Z = 2;
const o = new PNG({ width: w * Z, height: h * Z });
for (let y = 0; y < h * Z; y++) for (let x = 0; x < w * Z; x++) {
  const si = ((y0 + Math.floor(y / Z)) * p.width + (x0 + Math.floor(x / Z))) * 4, di = (y * o.width + x) * 4;
  o.data[di] = p.data[si]; o.data[di + 1] = p.data[si + 1]; o.data[di + 2] = p.data[si + 2]; o.data[di + 3] = 255;
}
fs.writeFileSync(`${outDir}/${room}-floor-native-2x.png`, PNG.sync.write(o));
console.log(`native ${p.width}x${p.height} -> ${outDir}/${room}-native-1x.png, crop x2 -> ${outDir}/${room}-floor-native-2x.png`);
await browser.close();
