/**
 * SHIP SAVE/RESUME — real-browser check of the save system through the actual
 * start menu (no qa-room shortcut, so the CONTINUE path is what gets tested).
 * Run with: npx tsx tests/ship-save-resume.mts   (dev server on :8080, or BASE=...)
 *
 * Fresh FULL GAME → hero select → lobby → clear Reception (autosave chip) →
 * hard reload → CONTINUE card names the room + save age → resume lands back in
 * Reception with every NPC still done → NEW GAME needs two presses → a corrupt
 * save is backed up and the menu still loads → NEW GAME keeps audio prefs.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { createDriver } from './helpers/ship-drive.mts';

const BASE = process.env.BASE ?? 'http://localhost:8080';
const OUT = 'screenshots/ship';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const d = createDriver(page);
const save = () => d.qa(() => JSON.parse(localStorage.getItem('pq:save:v2') || 'null')) as Promise<any>;
const menuReady = async () => {
  await page.waitForSelector('[data-testid="start-menu-demo"]', { timeout: 20000 });
  await page.waitForTimeout(1800); // staggered reveal
};

// Autosave chip sightings, sampled from the page so short-lived chips aren't missed.
await page.addInitScript(() => {
  (window as any).__saveChips = [];
  let last: Element | null = null;
  new MutationObserver(() => {
    const el = document.querySelector('[data-testid="save-indicator"]');
    if (el && el !== last) (window as any).__saveChips.push(el.getAttribute('data-status'));
    last = el;
  }).observe(document, { childList: true, subtree: true });
});

// ── Fresh full game ───────────────────────────────────────────────
await page.goto(`${BASE}/`);
await d.qa(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('music_volume', '0.25'); });
await page.goto(`${BASE}/`);
await menuReady();
d.report('fresh-menu-no-continue', !(await page.locator('[data-testid="start-menu-continue"]').count()), 'no CONTINUE without a save');
await page.click('[data-testid="start-menu-full-game"]');
await page.waitForSelector('text=CHOOSE YOUR HERO', { timeout: 15000 });
await page.waitForTimeout(600);
await page.keyboard.press('Enter');
await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30000 });
// A first-time player gets the onboarding card before the room goes live.
await page.waitForTimeout(3200);
await page.screenshot({ path: `${OUT}/save-00-first-boot.png` });
await page.click('text=Start exploring').catch(() => {});
await page.waitForTimeout(1500);
await d.clickThroughOverlays();
await d.waitRoom('hospital_entrance');

await d.clearRoom('hospital_entrance');
await d.goDoor('entrance_to_reception', 'reception');
await d.clearRoom('reception');
await page.waitForTimeout(1500);
const s1 = await save();
d.report('autosave-progress', s1?.completedRooms?.includes('reception') && s1?.currentRoomId === 'reception',
  `saved rooms=${JSON.stringify(s1?.completedRooms)} at=${s1?.currentRoomId} npcs=${s1?.completedNPCs?.length}`);
const chips = (await d.qa(() => (window as any).__saveChips)) as string[];
d.report('autosave-chip', chips.includes('saved') && !chips.includes('failed'), `chip seen ${chips.filter(c => c === 'saved').length}× (failed: ${chips.includes('failed')})`);
await page.screenshot({ path: `${OUT}/save-01-reception-cleared.png` });

// ── Reload → CONTINUE card ────────────────────────────────────────
await page.goto(`${BASE}/`);
await menuReady();
const cont = page.locator('[data-testid="start-menu-continue"]');
const contText = (await cont.innerText().catch(() => '')).replace(/\n/g, ' ');
d.report('continue-card', /RECEPTION/.test(contText) && /2 ROOMS CLEARED/.test(contText) && /SAVED JUST NOW/.test(contText), `"${contText}"`);
await page.screenshot({ path: `${OUT}/save-02-continue-card.png` });

await cont.click();
await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30000 });
await d.waitRoom('reception');
await page.waitForTimeout(2500);
const st = await d.qa(() => {
  const q = (window as any).__QA__;
  return { room: q.currentRoomId, pending: (q.roomNPCs ?? []).filter((n: any) => !n.completed && n.id !== 'compliance_officer').map((n: any) => n.id), npcs: q.completedNPCs.length };
}) as any;
d.report('resume-lands-in-room', st.room === 'reception' && st.pending.length === 0 && st.npcs === s1.completedNPCs.length,
  `room=${st.room} pending=${JSON.stringify(st.pending)} npcs=${st.npcs}/${s1.completedNPCs.length}`);
await page.screenshot({ path: `${OUT}/save-03-resumed.png` });

// ── NEW GAME needs a second press ─────────────────────────────────
await page.goto(`${BASE}/`);
await menuReady();
const ng = page.locator('[data-testid="start-menu-new-game"]');
await ng.click();
await page.waitForTimeout(400);
const armedText = (await ng.innerText()).replace(/\n/g, ' ');
const stillSaved = (await save())?.completedRooms?.includes('reception');
d.report('new-game-arms-first', (await ng.getAttribute('data-armed')) === 'true' && /ERASE SAVE\?/.test(armedText) && stillSaved,
  `"${armedText}" save intact=${stillSaved}`);
await page.screenshot({ path: `${OUT}/save-04-erase-armed.png` });
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(300);
d.report('new-game-disarms', (await ng.getAttribute('data-armed')) === 'false', 'moving the cursor away disarms');

// ── Corrupt save is parked, menu still loads ──────────────────────
await d.qa(() => localStorage.setItem('pq:save:v2', '{"version":2,"completedRooms":["recep'));
await page.goto(`${BASE}/`);
await menuReady();
const backup = await d.qa(() => localStorage.getItem('pq:save:v2:backup'));
d.report('corrupt-save-backed-up', backup === '{"version":2,"completedRooms":["recep'
  && (await page.locator('[data-testid="start-menu-full-game"]').count()) === 1,
  `backup=${JSON.stringify(backup)}; menu offers a fresh FULL GAME`);

// ── Confirmed NEW GAME wipes progress, keeps audio prefs ─────────
await d.qa((s: string) => localStorage.setItem('pq:save:v2', s), JSON.stringify(s1));
await page.goto(`${BASE}/`);
await menuReady();
await page.click('[data-testid="start-menu-new-game"]');
await page.waitForTimeout(300);
await page.click('[data-testid="start-menu-new-game"]');
await page.waitForSelector('text=CHOOSE YOUR HERO', { timeout: 15000 });
const after = await d.qa(() => ({ save: localStorage.getItem('pq:save:v2'), vol: localStorage.getItem('music_volume') })) as any;
const wiped = !after.save || (JSON.parse(after.save).completedRooms ?? []).length === 0;
d.report('new-game-wipes-keeps-prefs', wiped && after.vol === '0.25', `progress wiped=${wiped} music_volume=${after.vol}`);

d.auditErrors();
const ok = d.summarize('SAVE / RESUME');
await browser.close();
process.exit(ok ? 0 : 1);
