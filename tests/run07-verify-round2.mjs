// Run 07 — Round 2 verification: F-05 (defeat framing + retryable), F-06 (TD
// exit hatch), F-08 (room-cleared banner + fanfare + patient story), F-10
// (cold-boot BGM no longer skipped).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:8080';
const OUT = 'screenshots/run07';
mkdirSync(OUT, { recursive: true });

const results = [];
function report(id, pass, note) {
  results.push({ id, pass, note });
  console.log(`${pass ? 'FAIL' : 'FAIL'}`.replace(/^.*$/, `${pass ? 'PASS' : 'FAIL'} ${id} — ${note}`));
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const warns = [];
page.on('console', (m) => {
  if (m.type() === 'warning' || m.type() === 'warn' || m.type() === 'error') warns.push(m.text().slice(0, 160));
});
page.on('pageerror', (e) => console.log('[pageerror]', (e.stack || e.message).slice(0, 300)));

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

// ─────────────────────────────────────────────────────────────────
// SECTION 1 — F-10: cold boot plays BGM (no "not ready, skipping" warn)
// ─────────────────────────────────────────────────────────────────
try {
  warns.length = 0;
  await page.goto(`${BASE}/?qa-skip-onboarding`);
  await page.waitForFunction(() => window.__QA__?.scenesVisited?.includes('Exploration'), { timeout: 30000 });
  await page.waitForTimeout(3000);
  const bgmSkips = warns.filter(w => w.includes('not ready, skipping BGM') || w.includes('not ready, retrying'));
  report('F-10a', bgmSkips.length === 0, `cold boot BGM warn count=${bgmSkips.length} ${bgmSkips[0] ?? ''}`);
} catch (e) {
  report('F-10a', false, 'section threw: ' + e.message.slice(0, 150));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 2 — F-08: completing hospital_entrance fires banner + fanfare;
// completing reception reveals Elena's Story
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/?qa-room=hospital_entrance&qa-no-save`);
  await waitRoom('hospital_entrance');
  await page.waitForTimeout(1200);
  // hospital_entrance requires only riley_entrance (10,4)
  const r = await interactWithNpc(10, 4, 'riley_entrance');
  // click through dialogue
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
  // The banner should appear within ~2s of completion
  const bannerSeen = await page.waitForFunction(
    () => Array.from(document.querySelectorAll('div')).some(d => d.textContent === 'Room Cleared!'),
    { timeout: 6000 },
  ).then(() => true).catch(() => false);
  await page.screenshot({ path: `${OUT}/F08-room-cleared-banner.png` });
  report('F-08a', r && bannerSeen, `Room Cleared! banner appears on entrance completion (talked=${r}, banner=${bannerSeen})`);
} catch (e) {
  report('F-08a', false, 'section threw: ' + e.message.slice(0, 150));
}

// Reception → patient story (seed riley+zone+item done, then finish nervous_patient last)
try {
  await page.goto(`${BASE}/`);
  await qa(() => {
    localStorage.clear();
    localStorage.setItem('pq:save:v2', JSON.stringify({
      version: 2,
      completedRooms: ['hospital_entrance'],
      collectedStories: [],
      completedNPCs: ['riley_entrance', 'riley'],
      completedZones: ['sign_in_sheet'],
      collectedItems: ['patient_rights_poster'],
      privacyScore: 95, finalPrivacyScore: 95, resolvedGates: {}, unlockedNpcs: {},
      npcPulsedRooms: [], gameStartTime: Date.now(), onboardingSeen: true, sfxMuted: false, musicVolume: 0.6,
      currentRoomId: 'reception', currentAct: 1, act1Complete: false, act2Complete: false,
      actFlags: {}, decisions: {}, encounterResults: {}, unifiedScore: 95,
    }));
  });
  await page.goto(`${BASE}/?qa-room=reception`);
  await waitRoom('reception');
  await page.waitForTimeout(1200);
  const r = await interactWithNpc(5, 8, 'nervous_patient');
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
  // banner → auto-dismiss → PatientStoryReveal (Elena's Story)
  const storySeen = await page.waitForFunction(
    () => document.body.textContent?.includes("Elena's Story"),
    { timeout: 10000 },
  ).then(() => true).catch(() => false);
  await page.screenshot({ path: `${OUT}/F08-patient-story-elena.png` });
  report('F-08b', r && storySeen, `Elena's Story reveals after reception completes (talked=${r}, story=${storySeen})`);
  // dismiss story modal and confirm collectedStories persisted
  await page.keyboard.press('Escape').catch(() => {});
  const anyBtn = page.locator('button', { hasText: /continue|close|got it|back/i }).first();
  if (await anyBtn.count()) await anyBtn.click().catch(() => {});
  await page.waitForTimeout(1500);
  const stories = await qa(() => JSON.parse(localStorage.getItem('pq:save:v2') || '{}').collectedStories);
  report('F-08c', Array.isArray(stories) && stories.includes('reception'), `collectedStories persists: ${JSON.stringify(stories)}`);
} catch (e) {
  report('F-08b/c', false, 'section threw: ' + e.message.slice(0, 150));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 3 — F-06: TD encounter has an exit (X/Esc), no instant re-pop, re-arms
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/?qa-room=it_office&qa-no-save`);
  await waitRoom('it_office');
  await page.waitForTimeout(1200);
  await teleport(9, 6);
  await page.waitForSelector('text=NOT RIGHT NOW', { timeout: 8000 });
  await page.click('text=DEFEND THE NETWORK').catch(async () => {
    // fallback: click the confirm (non-decline) button
    await page.locator('button').filter({ hasNotText: 'NOT RIGHT NOW' }).first().click();
  });
  // Wait for the encounter HUD with the new exit button
  const exitBtn = await page.waitForSelector('[data-testid="button-encounter-exit"]', { timeout: 15000 }).then(() => true).catch(() => false);
  await page.screenshot({ path: `${OUT}/F06-td-exit-button.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  const backInRoom = await qa(() => window.__QA__.currentRoomId) === 'it_office';
  const hudGone = (await page.locator('[data-testid="button-encounter-exit"]').count()) === 0;
  const cardBack = (await page.locator('text=NOT RIGHT NOW').count()) > 0; // must NOT re-pop while standing there
  await page.screenshot({ path: `${OUT}/F06-after-esc-exit.png` });
  report('F-06a', exitBtn && hudGone && backInRoom && !cardBack, `Esc exits TD encounter cleanly (exitBtn=${exitBtn}, hudGone=${hudGone}, backInRoom=${backInRoom}, instantRepop=${cardBack})`);
  // walk away and back — encounter should re-offer
  await teleport(3, 12);
  await page.waitForTimeout(600);
  await teleport(9, 6);
  const reOffered = await page.waitForSelector('text=NOT RIGHT NOW', { timeout: 6000 }).then(() => true).catch(() => false);
  report('F-06b', reOffered, `encounter re-offers after abort + leave + return: ${reOffered}`);
} catch (e) {
  report('F-06', false, 'section threw: ' + e.message.slice(0, 150));
  await page.screenshot({ path: `${OUT}/F06-section-error.png` }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────
// SECTION 4 — F-05: defeat debrief framing (via bridge-injected defeat) + sorter defeat is retryable
// ─────────────────────────────────────────────────────────────────
try {
  // 4a: inject a TD defeat result — React should render the honest defeat debrief
  await page.goto(`${BASE}/?qa-room=it_office&qa-no-save&qa_no_encounter=1`);
  await waitRoom('it_office');
  await page.waitForTimeout(800);
  await qa(() => window.__QA__.emit('encounter:complete', {
    encounterId: 'td-it-office', outcome: 'defeat', securityScore: 0, scoreContribution: 0,
  }));
  await page.waitForTimeout(1000);
  const header = await page.evaluate(() => {
    const h = Array.from(document.querySelectorAll('h2')).find(e => e.textContent?.match(/SECURED|BREACHED|CONTAINED/));
    return h?.textContent ?? '(none)';
  });
  const retryHint = await page.evaluate(() => document.body.textContent?.includes('Walk back to the workstation'));
  await page.screenshot({ path: `${OUT}/F05-defeat-debrief.png` });
  report('F-05a', header === 'SYSTEMS BREACHED' && !!retryHint, `defeat header="${header}", retry hint=${retryHint}`);

  // 4b: dismissing a defeat must NOT seal the encounter — sorter proves the shared path fast
  await page.goto(`${BASE}/?qa-room=hospital_entrance&qa-no-save`);
  await waitRoom('hospital_entrance');
  await page.waitForTimeout(1200);
  let ok = await interactWithNpc(10, 6, 'aiyana_intake');
  await page.waitForSelector('[data-testid="encounter-request-modal"]', { timeout: 5000 });
  await page.click('[data-testid="button-encounter-accept"]');
  await page.waitForSelector('[data-testid="phi-sorter-overlay"]', { timeout: 5000 });
  await page.waitForTimeout(1100);
  // stamp everything KEEP → 3/10 correct → defeat
  for (let i = 0; i < 10; i++) {
    await page.click('[data-testid="sorter-stamp-keep"]').catch(() => {});
    await page.waitForTimeout(1250);
  }
  await page.waitForSelector('[data-testid="sorter-debrief"]', { timeout: 15000 });
  const debriefHeader = await page.locator('[data-testid="sorter-debrief-header"]').innerText().catch(() => '?');
  await page.screenshot({ path: `${OUT}/F05-sorter-defeat-debrief.png` });
  await page.click('[data-testid="button-sorter-debrief-dismiss"]');
  await page.waitForTimeout(1200);
  // Talk to Aiyana again — the request modal must reappear (retryable), NOT the completed bubble
  ok = await interactWithNpc(10, 6, 'aiyana_intake') && ok;
  const modalAgain = await page.waitForSelector('[data-testid="encounter-request-modal"]', { timeout: 5000 }).then(() => true).catch(() => false);
  await page.screenshot({ path: `${OUT}/F05-sorter-retry-offered.png` });
  report('F-05b', ok && modalAgain, `failed sorter is retryable (debrief="${debriefHeader.replace(/\n/g, ' ')}", request modal reappears=${modalAgain})`);
  const npcs = await qa(() => window.__QA__.completedNPCs);
  report('F-05c', !(npcs || []).includes('aiyana_intake'), `defeat does NOT complete the NPC: completedNPCs=${JSON.stringify(npcs)}`);
} catch (e) {
  report('F-05', false, 'section threw: ' + e.message.slice(0, 150));
  await page.screenshot({ path: `${OUT}/F05-section-error.png` }).catch(() => {});
}

console.log('\nSummary:');
for (const r of results) console.log(` ${r.pass ? 'PASS' : 'FAIL'} ${r.id}`);
await browser.close();
process.exit(results.every(r => r.pass) ? 0 : 1);
