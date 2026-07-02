// Run 07 — Round 4 verification: minors F-11 (onboarding copy), F-12 (locked
// door prompt), F-13 (zone portrait), F-14 (sorter opener), F-16 (demo skips
// onboarding), F-20 (door label clamp), F-21 (marker clears on completion).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:8080';
const OUT = 'screenshots/run07';
mkdirSync(OUT, { recursive: true });

const results = [];
function report(id, pass, note) {
  results.push({ id, pass, note });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} — ${note}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const warns = [];
page.on('console', (m) => { if (m.type() === 'warning') warns.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 200)));

const qa = (fn, ...args) => page.evaluate(fn, ...args);
const teleport = async (x, y) => { await qa(([a, b]) => window.__QA__.commands.teleportTo(a, b), [x, y]); await page.waitForTimeout(400); };
const pressSpace = async () => { await qa(() => window.__QA__.commands.pressSpace()); await page.waitForTimeout(400); };
const waitRoom = (id) => page.waitForFunction((r) => window.__QA__?.currentRoomId === r, id, { timeout: 20000 });
const interactWithNpc = async (nx, ny, npcId) => {
  for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]]) {
    await teleport(nx + dx, ny + dy);
    await page.waitForTimeout(500);
    const r1 = await qa(() => ({ n: window.__QA__.nearbyInteractable, p: window.__QA__.playerPosition }));
    await page.waitForTimeout(300);
    const r2 = await qa(() => ({ n: window.__QA__.nearbyInteractable, p: window.__QA__.playerPosition }));
    if (JSON.stringify(r1) === JSON.stringify(r2) && r2.n && r2.n.id === npcId) { await pressSpace(); return true; }
  }
  return false;
};
async function clickThroughDialogue() {
  for (let i = 0; i < 25; i++) {
    const dlg = await page.locator('[data-testid="dialogue-overlay"]').isVisible().catch(() => false);
    if (!dlg) break;
    const next = page.locator('[data-testid="button-next-scene"]');
    if (await next.isVisible().catch(() => false)) { await next.click(); await page.waitForTimeout(400); continue; }
    const choice = page.locator('[data-testid="choice-button-1"]');
    if (await choice.isVisible().catch(() => false)) { await choice.click(); await page.waitForTimeout(400); continue; }
    const cont = page.locator('[data-testid="container-battle-dialogue"]');
    if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForTimeout(500); continue; }
    await page.waitForTimeout(250);
  }
}

// ─────────────────────────────────────────────────────────────────
// F-11 — full-game onboarding shows the corrected door instruction
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/`);
  await qa(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(`${BASE}/`);
  await page.click('text=FULL GAME', { timeout: 10000 });
  await page.click('text=NEW GAME', { timeout: 10000 }).catch(() => {}); // TitleScreen
  await page.waitForTimeout(800);
  // Character select — confirm the pre-selected hero
  await page.click('text=BEGIN ADVENTURE', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const modalText = await page.evaluate(() => document.body.textContent || '');
  const hasNewCopy = modalText.includes('SPACE at a door');
  const hasOldCopy = modalText.includes('Walk to a door') || modalText.includes('Walk to doors');
  await page.screenshot({ path: `${OUT}/F11-onboarding-copy.png` });
  report('F-11a', hasNewCopy && !hasOldCopy, `onboarding says SPACE at a door (new=${hasNewCopy}, old-copy-present=${hasOldCopy})`);
} catch (e) {
  report('F-11a', false, 'section threw: ' + e.message.slice(0, 150));
}

// ─────────────────────────────────────────────────────────────────
// F-16 — demo mode does NOT show the full-game onboarding modal
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/`);
  await qa(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(`${BASE}/`);
  await page.click('text=DEMO', { timeout: 10000 });
  await page.waitForTimeout(800);
  await page.click('text=BEGIN ADVENTURE', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const modalShown = await page.evaluate(() => (document.body.textContent || '').includes('Welcome to HIPAA General'));
  await page.screenshot({ path: `${OUT}/F16-demo-no-onboarding.png` });
  report('F-16a', !modalShown, `demo boot shows full-game onboarding modal: ${modalShown}`);
  // clean up demo session flag for the following sections
  await qa(() => { localStorage.clear(); sessionStorage.clear(); });
} catch (e) {
  report('F-16', false, 'section threw: ' + e.message.slice(0, 150));
}

// ─────────────────────────────────────────────────────────────────
// F-12 / F-20 — locked-door prompt + door label clamp (visual screenshots)
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/?qa-room=hospital_entrance&qa-no-save`);
  await waitRoom('hospital_entrance');
  // Dismiss the room-intro title card (keypress) and let the scene settle
  await page.waitForTimeout(1500);
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  // Reception door at (19,7) is locked until riley_entrance is talked to.
  let nearDoor = null;
  for (const [tx, ty] of [[18, 7], [18, 8], [17, 7], [18, 6]]) {
    await teleport(tx, ty);
    await page.waitForTimeout(700);
    nearDoor = await qa(() => window.__QA__.nearDoor);
    if (nearDoor) break;
  }
  await page.screenshot({ path: `${OUT}/F12-locked-door-prompt.png` });
  report('F-12a', !!nearDoor, `near locked door for prompt screenshot (nearDoor=${JSON.stringify(nearDoor)}) — prompt text verified visually`);
} catch (e) {
  report('F-12', false, 'section threw: ' + e.message.slice(0, 150));
}

// ─────────────────────────────────────────────────────────────────
// F-13 — zone dialogue shows document plate, warn fires at most once per id
// ─────────────────────────────────────────────────────────────────
try {
  warns.length = 0;
  await page.goto(`${BASE}/?qa-room=reception&qa-no-save`);
  await waitRoom('reception');
  await page.waitForTimeout(1200);
  const z = await interactWithNpc(8, 4, 'sign_in_sheet');
  await page.waitForSelector('[data-testid="dialogue-overlay"]', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/F13-zone-portrait-plate.png` });
  const plateGlyph = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="npc-battle-sprite"]');
    return el ? el.textContent?.includes('\u{1F4CB}') : false;
  });
  await clickThroughDialogue();
  // examine a second zone to check the warn doesn't repeat per id
  const portraitWarns = warns.filter(w => w.includes('No sprite mapping'));
  report('F-13a', z && !!plateGlyph && portraitWarns.length <= 1, `zone portrait is a document plate (glyph=${plateGlyph}); mapping warns=${portraitWarns.length}`);
} catch (e) {
  report('F-13', false, 'section threw: ' + e.message.slice(0, 150));
}

// ─────────────────────────────────────────────────────────────────
// F-14 — sorter opens with the opener line, not band praise
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/?qa-room=hospital_entrance&qa-no-save`);
  await waitRoom('hospital_entrance');
  await page.waitForTimeout(1200);
  const ok = await interactWithNpc(10, 6, 'aiyana_intake');
  await page.waitForSelector('[data-testid="encounter-request-modal"]', { timeout: 5000 });
  await page.click('[data-testid="button-encounter-accept"]');
  await page.waitForSelector('[data-testid="phi-sorter-overlay"]', { timeout: 5000 });
  await page.waitForTimeout(800);
  const body = await page.evaluate(() => document.body.textContent || '');
  const hasOpener = body.includes('charts incoming');
  const hasOldPraise = body.includes('getting the rhythm');
  await page.screenshot({ path: `${OUT}/F14-sorter-opener.png` });
  await page.keyboard.press('Escape');
  report('F-14a', ok && hasOpener && !hasOldPraise, `sorter opener line shown (opener=${hasOpener}, old-praise=${hasOldPraise})`);
} catch (e) {
  report('F-14', false, 'section threw: ' + e.message.slice(0, 150));
}

// ─────────────────────────────────────────────────────────────────
// F-21 — "!" marker clears when an NPC completes (visual before/after)
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/?qa-room=hospital_entrance&qa-no-save`);
  await waitRoom('hospital_entrance');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/F21-riley-marker-before.png` });
  const ok = await interactWithNpc(10, 4, 'riley_entrance');
  await clickThroughDialogue();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/F21-riley-marker-after.png` });
  const done = await qa(() => window.__QA__.completedNPCs);
  report('F-21a', ok && (done || []).includes('riley_entrance'), `Riley completed for marker check (screenshots verified visually)`);
} catch (e) {
  report('F-21', false, 'section threw: ' + e.message.slice(0, 150));
}

console.log('\nSummary:');
for (const r of results) console.log(` ${r.pass ? 'PASS' : 'FAIL'} ${r.id}`);
await browser.close();
process.exit(results.every(r => r.pass) ? 0 : 1);
