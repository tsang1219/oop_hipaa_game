// Run 14 (ui-polish) — final proof captures after all fixes landed.
//   BASE_URL=http://localhost:8090 PW_CHANNEL=chrome node tests/ui-final-captures.mjs
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const OUT = 'screenshots/ui-polish';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
const errors = [];
page.on('pageerror', e => errors.push(`PAGEERROR ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`CONSOLE ${m.text()}`); });

const shoot = async (path, clipBox) => {
  const box = clipBox ?? await page.locator('canvas').first().boundingBox();
  await page.screenshot({ path, clip: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) } });
  console.log('shot', path.split('/').pop());
};

// 1. Title variants (post footer/sponsor fixes)
for (const v of ['a', 'b', 'c', 'classic']) {
  await page.goto(`${BASE}/?title=${v}`);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/title-${v}.png` });
  console.log(`shot title-${v}`);
}

// 2. Live dialogue with the SHIPPED body font (no injection) — also shows the
//    HUD sitting under the encounter dim.
await page.goto(`${BASE}/?qa-room=reception&qa-no-save&qa_no_encounter=1`);
await page.waitForFunction(() => window.__QA__?.currentRoomId === 'reception', null, { timeout: 30000 });
await page.waitForTimeout(3200);
for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0]]) {
  await page.evaluate(([x, y]) => window.__QA__.commands.teleportTo(x, y), [10 + dx, 4 + dy]);
  await page.waitForTimeout(500);
  const card = await page.locator('[data-testid="sorter-context-card"]').isVisible().catch(() => false);
  if (card) { await page.locator('[data-testid="button-sorter-context-confirm"]').click().catch(() => {}); await page.waitForTimeout(600); continue; }
  if (await page.evaluate(() => window.__QA__?.nearbyInteractable)) break;
}
await page.evaluate(() => window.__QA__.commands.pressSpace());
await page.waitForSelector('[data-testid="container-battle-dialogue"]', { timeout: 15000 });
await page.waitForTimeout(400);
await page.evaluate(() => window.__QA__.commands.pressSpace());
await page.waitForTimeout(500);
await shoot(`${OUT}/dialogue-after-live.png`);

// 3. CLEARED stamp — a hallway completes with its single PHI-tip item.
await page.goto(`${BASE}/?qa-room=hallway_reception_break&qa-no-save&qa_no_encounter=1`);
await page.waitForFunction(() => window.__QA__?.currentRoomId === 'hallway_reception_break', null, { timeout: 30000 });
await page.waitForTimeout(3400);
const item = await page.evaluate(() => window.__QA__.roomItems?.[0]);
console.log('hallway item at', JSON.stringify(item));
await page.evaluate(([x, y]) => window.__QA__.commands.teleportTo(x, y), [item.x, item.y + 1]);
await page.waitForTimeout(600);
await page.evaluate(() => window.__QA__.commands.pressSpace());
await page.waitForSelector('[data-testid="educational-item-modal"]', { timeout: 10000 });
await page.waitForTimeout(600);
await page.locator('[data-testid="button-close-modal"]').click();
await page.waitForTimeout(2600); // exit anim + fanfare + stamp pop
const hud = await page.locator('[data-testid="room-progress-hud"]').boundingBox();
if (hud) await shoot(`${OUT}/hud-cleared-stamp.png`, { x: hud.x - 12, y: hud.y - 8, width: hud.width + 24, height: hud.height + 20 });
await shoot(`${OUT}/hud-cleared-room.png`);

// 4. HUD zoom re-shoot (post zero-glyph fix)
await page.goto(`${BASE}/?qa-room=reception&qa-no-save&qa_no_encounter=1`);
await page.waitForFunction(() => window.__QA__?.currentRoomId === 'reception', null, { timeout: 30000 });
await page.waitForTimeout(3600);
const hud2 = await page.locator('[data-testid="room-progress-hud"]').boundingBox();
await shoot(`${OUT}/hud-clipboard-zoom.png`, { x: hud2.x - 12, y: hud2.y - 8, width: hud2.width + 24, height: hud2.height + 20 });
await shoot(`${OUT}/hud-clipboard-reception.png`);

await browser.close();
const real = errors.filter(e => !/favicon|404|net::ERR|ResizeObserver|WebAudio|WebSocket/.test(e));
console.log(real.length ? `ERRORS:\n${real.join('\n')}` : 'console clean');
