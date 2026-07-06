// Room + overlay polish capture. Usage: node tests/loop-polish-capture.mjs <outdir>
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
const OUT = `screenshots/${process.argv[2] || 'polish'}`;
mkdirSync(OUT, { recursive: true });
const rooms = ['reception', 'break_room', 'lab', 'records_room', 'it_office', 'er'];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 960 } });
for (const r of rooms) {
  await p.goto(`http://localhost:8080/?qa-room=${r}&qa-no-save`);
  await p.waitForTimeout(4500);
  await p.screenshot({ path: `${OUT}/room-${r}.png` });
  console.log('captured', r);
}
// dialogue (portrait fallback) — stand next to the lab researcher, then talk
await p.goto('http://localhost:8080/?qa-room=lab&qa-no-save');
await p.waitForFunction(() => window.__QA__?.currentRoomId === 'lab', null, { timeout: 20000 });
await p.waitForTimeout(1400);
await p.evaluate(() => window.__QA__.commands.teleportTo(3, 6));
await p.waitForTimeout(500);
await p.evaluate(() => window.__QA__.commands.pressSpace());
await p.waitForTimeout(1600);
await p.screenshot({ path: `${OUT}/dialogue.png` });
console.log('captured dialogue');
await b.close();
