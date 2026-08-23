// Run 11 — how the 640x480 canvas is scaled at a few viewport sizes, plus a zoomed crop of the same floor region at each (fractional CSS scales make pixel art uneven).
import { chromium } from '@playwright/test';
import fs from 'fs';
import { createRequire } from 'module';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');
const S = process.env.OUT_DIR || "screenshots/art-substrate";
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
function crop(buf, x0, y0, w, h, zoom, out) {
  const p = PNG.sync.read(buf); const o = new PNG({ width: w * zoom, height: h * zoom });
  for (let y = 0; y < h * zoom; y++) for (let x = 0; x < w * zoom; x++) {
    const si = ((y0 + Math.floor(y / zoom)) * p.width + (x0 + Math.floor(x / zoom))) * 4, di = (y * o.width + x) * 4;
    o.data[di] = p.data[si]; o.data[di + 1] = p.data[si + 1]; o.data[di + 2] = p.data[si + 2]; o.data[di + 3] = 255;
  }
  fs.writeFileSync(out, PNG.sync.write(o));
}
for (const [vw, vh, tag] of [[1280, 960, 'vp1280'], [1400, 1100, 'vp1400'], [2000, 1500, 'vp2000'], [600, 500, 'vp600']]) {
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  await page.goto('http://localhost:8080/?qa-room=reception&qa-no-save&qa_no_encounter=1');
  await page.waitForFunction(() => window.__QA__?.currentRoomId === 'reception', null, { timeout: 30000 });
  await page.waitForTimeout(3200);
  const info = await page.evaluate(() => { const c = document.querySelector('canvas'); const r = c.getBoundingClientRect(); const cs = getComputedStyle(c); return { cssW: r.width, cssH: r.height, bufW: c.width, bufH: c.height, rendering: cs.imageRendering, dpr: devicePixelRatio }; });
  const scale = info.cssW / info.bufW;
  console.log(tag, JSON.stringify(info), 'css scale =', scale.toFixed(3));
  const box = await page.locator('canvas').first().boundingBox();
  const shot = await page.screenshot({ clip: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) } });
  // same floor region in canvas units: x 140..300, y 260..380 (reception, below the benches, left-centre)
  const cx = 140 * scale, cy = 255 * scale, cw = 170 * scale, ch = 110 * scale;
  crop(shot, Math.round(cx), Math.round(cy), Math.round(cw), Math.round(ch), Math.max(1, Math.round(4 / scale)), `${S}/floor-${tag}.png`);
  await page.close();
}
await browser.close();
