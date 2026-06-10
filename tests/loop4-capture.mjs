// One-off visual QA capture for loop iteration 4.
// Run with: node tests/loop4-capture.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:8080';
const OUT = 'screenshots/loop4';
mkdirSync(OUT, { recursive: true });

const rooms = [
  'hospital_entrance',
  'reception',
  'hallway_reception_break',
  'break_room',
  'lab',
  'records_room',
  'it_office',
  'er',
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('[console.error]', msg.text().slice(0, 200));
});

// 1. Boot state (start menu)
await page.goto(`${BASE}/?qa-no-save`);
await page.waitForTimeout(4000);
await page.screenshot({ path: `${OUT}/00-boot.png` });

// 2. Each room via qa-room param
for (const roomId of rooms) {
  await page.goto(`${BASE}/?qa-room=${roomId}&qa-no-save`);
  await page.waitForTimeout(5000); // qa-room has internal delay + scene fade
  await page.screenshot({ path: `${OUT}/room-${roomId}.png` });
  console.log('captured', roomId);
}

await browser.close();
console.log('done');
