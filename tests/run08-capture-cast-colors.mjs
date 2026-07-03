// Run 08 initial pass — capture per-speaker signature colors across the UI.
// Proves: dialogue frame/name/stripe change per speaker; request modal + sorter
// bubble carry the trigger NPC's color.
import { chromium } from '@playwright/test';

const OUT = 'screenshots/run08';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

async function talkAndShoot(room, x, y, name) {
  await page.goto(`http://localhost:8080/?qa-room=${room}&qa-no-save`);
  await page.waitForFunction(() => window.__QA__?.currentRoomId, null, { timeout: 20000 });
  await page.waitForFunction((r) => window.__QA__.currentRoomId === r, room, { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.evaluate(([tx, ty]) => window.__QA__.commands.teleportTo(tx, ty), [x, y]);
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__QA__.commands.pressSpace());
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('captured', name);
}

// 1. Riley (reception, 10,3) — coral #FF7A6B
await talkAndShoot('reception', 10, 4, 'color-riley-coral');

// 2. Nervous patient (reception, 5,8) — periwinkle #9FB4FF (same room, different speaker)
await talkAndShoot('reception', 5, 9, 'color-patient-periwinkle');

// 3. Dr. Martinez (er, 10,8) — scrub green #45D483
await talkAndShoot('er', 10, 9, 'color-martinez-green');

// 4. Aiyana request modal (hospital_entrance, 10,6) — sky #4FB3D9, then sorter bubble
await page.goto('http://localhost:8080/?qa-room=hospital_entrance&qa-no-save');
await page.waitForFunction((r) => window.__QA__?.currentRoomId === r, 'hospital_entrance', { timeout: 20000 });
await page.waitForTimeout(1200);
await page.evaluate(() => window.__QA__.commands.teleportTo(10, 7));
await page.waitForTimeout(600);
await page.evaluate(() => window.__QA__.commands.pressSpace());
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/color-aiyana-request-sky.png` });
console.log('captured aiyana request');
const accept = page.locator('[data-testid="button-encounter-accept"]');
if (await accept.count()) {
  await accept.click();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/color-aiyana-sorter-sky.png` });
  console.log('captured aiyana sorter');
}

// 5. Marcus request modal (lab, 9,7) — amber #FFAA33
await page.goto('http://localhost:8080/?qa-room=lab&qa-no-save');
await page.waitForFunction((r) => window.__QA__?.currentRoomId === r, 'lab', { timeout: 20000 });
await page.waitForTimeout(1200);
await page.evaluate(() => window.__QA__.commands.teleportTo(9, 8));
await page.waitForTimeout(600);
await page.evaluate(() => window.__QA__.commands.pressSpace());
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/color-marcus-request-amber.png` });
const accept2 = page.locator('[data-testid="button-encounter-accept"]');
if (await accept2.count()) {
  await accept2.click();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/color-marcus-sorter-amber.png` });
  console.log('captured marcus sorter');
}

await browser.close();
console.log('done');
