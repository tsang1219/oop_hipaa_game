// Run 14 (ui-polish) — UI-01 font candidates on a real dialogue screen.
//   BASE_URL=http://localhost:8090 PW_CHANNEL=chrome node tests/ui-font-candidates.mjs
// Opens Riley's dialogue in Reception, then re-shoots the same screen with
// --font-body swapped between candidates. Writes screenshots/ui-polish/font-*.png
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const OUT = 'screenshots/ui-polish';
fs.mkdirSync(OUT, { recursive: true });

const pixelOperatorB64 = fs.readFileSync(
  '/private/tmp/claude-501/-Users-admin-Documents-GitHub-oop-hipaa-game/e370fd08-e5a2-4874-b050-f99034e5e392/scratchpad/pixel_operator/PixelOperator.ttf',
).toString('base64');

const CANDIDATES = [
  { key: 'press-start-2p', family: "'Press Start 2P', monospace", size: '13px', note: 'the old wall of caps' },
  { key: 'pixelify-sans', family: "'Pixelify Sans', sans-serif", size: '19px', note: 'incumbent --font-body' },
  { key: 'dotgothic16', family: "'DotGothic16', sans-serif", size: '19px', gf: 'DotGothic16' },
  { key: 'vt323', family: "'VT323', monospace", size: '22px', gf: 'VT323' },
  { key: 'pixel-operator', family: "'Pixel Operator Probe', sans-serif", size: '19px' },
];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
const errors = [];
page.on('pageerror', e => errors.push(`PAGEERROR ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`CONSOLE ${m.text()}`); });

await page.goto(`${BASE}/?qa-room=reception&qa-no-save&qa_no_encounter=1`);
await page.waitForFunction(() => window.__QA__?.currentRoomId === 'reception', null, { timeout: 30000 });
await page.waitForTimeout(3200);

// Stand next to Riley (10,4) and open the conversation, the way qa-helpers does.
for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
  await page.evaluate(([x, y]) => window.__QA__.commands.teleportTo(x, y), [10 + dx, 4 + dy]);
  await page.waitForTimeout(500);
  const card = await page.locator('[data-testid="sorter-context-card"]').isVisible().catch(() => false);
  if (card) { // sorter trigger tile — decline and reposition
    await page.locator('[data-testid="button-sorter-context-confirm"]').click().catch(() => {});
    await page.waitForTimeout(400);
    continue;
  }
  const nearby = await page.evaluate(() => window.__QA__?.nearbyInteractable);
  if (nearby) break;
}
await page.evaluate(() => window.__QA__.commands.pressSpace());
await page.waitForSelector('[data-testid="container-battle-dialogue"]', { timeout: 15000 });
await page.waitForTimeout(400);
await page.evaluate(() => window.__QA__.commands.pressSpace()); // complete the typewriter
await page.waitForTimeout(400);

// Preload webfonts + the Pixel Operator data-URI face once.
await page.evaluate((b64) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=DotGothic16&family=VT323&display=swap';
  document.head.appendChild(link);
  const style = document.createElement('style');
  style.textContent = `@font-face {
    font-family: 'Pixel Operator Probe';
    src: url(data:font/ttf;base64,${b64}) format('truetype');
  }`;
  document.head.appendChild(style);
}, pixelOperatorB64);
await page.waitForTimeout(1500);

for (const c of CANDIDATES) {
  await page.evaluate(([family, size]) => {
    document.documentElement.style.setProperty('--font-body', family);
    document.querySelectorAll('[data-testid="container-battle-dialogue"] .font-body').forEach(el => {
      el.style.fontSize = size;
    });
  }, [c.family, c.size]);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  const box = await page.locator('canvas').first().boundingBox()
    ?? await page.locator('[data-testid="container-battle-dialogue"]').boundingBox();
  // The battle screen replaces the canvas; shoot the dialogue panel's ancestor box.
  const panel = await page.locator('[data-testid="container-battle-dialogue"]').boundingBox();
  const clip = panel
    ? { x: Math.max(0, panel.x - 20), y: Math.max(0, panel.y - 220), width: Math.min(1400, panel.width + 40), height: panel.height + 260 }
    : { x: box.x, y: box.y, width: box.width, height: box.height };
  await page.screenshot({ path: `${OUT}/font-${c.key}.png`, clip });
  console.log(`shot font-${c.key} (${c.family} @ ${c.size})`);
}

await browser.close();
const real = errors.filter(e => !/favicon|404|net::ERR|ResizeObserver|WebAudio|WebSocket/.test(e));
console.log(real.length ? `ERRORS:\n${real.join('\n')}` : 'console clean');
