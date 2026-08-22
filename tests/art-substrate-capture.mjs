// Run 11 (art-substrate) — capture every room as it currently renders.
//   node tests/art-substrate-capture.mjs <suffix>      e.g. before | after
// Boots each room through the QA deep-link (no menus), waits for the fade-in
// and the room banner to clear, and clips the screenshot to the game canvas.
import { chromium } from '@playwright/test';
import fs from 'fs';

const suffix = process.argv[2] || 'before';
const only = process.argv[3] ? process.argv[3].split(',') : null;
const OUT = 'screenshots/art-substrate';
fs.mkdirSync(OUT, { recursive: true });
const ROOMS = [
  'hospital_entrance', 'reception', 'hallway_reception_break', 'break_room', 'hallway_break_lab',
  'lab', 'hallway_lab_records', 'records_room', 'hallway_records_it', 'it_office',
  'hallway_it_er', 'er', 'supply_closet',
];
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const errors = [];
page.on('pageerror', e => errors.push(`PAGEERROR ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`CONSOLE ${m.text()}`); });

for (const room of ROOMS) {
  if (only && !only.includes(room)) continue;
  await page.goto(`http://localhost:8080/?qa-room=${room}&qa-no-save&qa_no_encounter=1`);
  try {
    await page.waitForFunction(r => window.__QA__?.currentRoomId === r, room, { timeout: 30000 });
  } catch (e) { console.log(`!! ${room}: never loaded (${String(e.message).split('\n')[0]})`); continue; }
  await page.waitForTimeout(3200); // fade-in (500ms) + room banner (300+400+1500+500ms)
  const box = await page.locator('canvas').first().boundingBox();
  const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
  await page.screenshot({ path: `${OUT}/${room}-${suffix}.png`, clip });
  console.log(`captured ${room}-${suffix} (${clip.width}x${clip.height})`);
}
await browser.close();
const real = errors.filter(e => !/favicon|404|net::ERR|ResizeObserver|WebAudio|WebSocket/.test(e));
console.log(real.length ? `ERRORS:\n${real.join('\n')}` : 'console clean');
