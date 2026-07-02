// Run 07 — Round 1b verification: F-03C (act actually advances on room completion)
// and F-15 (choice gate unlocks the second NPC after the first completes).
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
page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 150)));

const qa = (fn, ...args) => page.evaluate(fn, ...args);
const teleport = async (x, y) => { await qa(([a, b]) => window.__QA__.commands.teleportTo(a, b), [x, y]); await page.waitForTimeout(400); };
const pressSpace = async () => { await qa(() => window.__QA__.commands.pressSpace()); await page.waitForTimeout(400); };
const waitRoom = (id) => page.waitForFunction((r) => window.__QA__?.currentRoomId === r, id, { timeout: 20000 });

const interactWithNpc = async (nx, ny, npcId) => {
  for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [0, 2]]) {
    await teleport(nx + dx, ny + dy);
    const nearby = await qa(() => window.__QA__.nearbyInteractable);
    if (nearby && nearby.id === npcId) { await pressSpace(); return true; }
  }
  return false;
};

// Click through whatever dialogue/modal is up until nothing remains (qa-helpers logic).
async function dismissOverlays() {
  for (let i = 0; i < 30; i++) {
    const state = await page.evaluate(() => ({
      item: !!document.querySelector('[data-testid="educational-item-modal"]'),
      obs: !!document.querySelector('[data-testid="observation-hint-overlay"]'),
      dlg: !!document.querySelector('[data-testid="dialogue-overlay"]'),
    }));
    if (!state.item && !state.obs && !state.dlg) break;
    if (state.item) {
      await page.click('[data-testid="button-close-modal"]').catch(() => {});
      await page.waitForTimeout(400); continue;
    }
    if (state.obs) {
      await page.click('[data-testid="observation-hint-overlay"]').catch(() => {});
      await page.waitForTimeout(400); continue;
    }
    const next = page.locator('[data-testid="button-next-scene"]');
    if (await next.isVisible().catch(() => false)) { await next.click(); await page.waitForTimeout(500); continue; }
    const choice = page.locator('[data-testid="choice-button-1"]');
    if (await choice.isVisible().catch(() => false)) { await choice.click(); await page.waitForTimeout(500); continue; }
    const cont = page.locator('[data-testid="container-battle-dialogue"]');
    if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForTimeout(600); continue; }
    await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => !window.__QA__?.paused, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

// ─────────────────────────────────────────────────────────────────
// SECTION 1 — F-03C: completing break_room (with reception done) advances Act 1 → 2
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/`);
  await qa(() => {
    localStorage.clear();
    localStorage.setItem('pq:save:v2', JSON.stringify({
      version: 2,
      completedRooms: ['hospital_entrance', 'reception'],
      collectedStories: [],
      completedNPCs: ['riley_entrance', 'riley', 'nervous_patient'],
      completedZones: ['sign_in_sheet'],
      collectedItems: ['patient_rights_poster'],
      privacyScore: 90, finalPrivacyScore: 90, resolvedGates: {}, unlockedNpcs: {},
      npcPulsedRooms: [], gameStartTime: Date.now(), onboardingSeen: true, sfxMuted: false, musicVolume: 0.6,
      currentRoomId: 'break_room', currentAct: 1, act1Complete: false, act2Complete: false,
      actFlags: {}, decisions: {}, encounterResults: {}, unifiedScore: 90,
    }));
  });
  await page.goto(`${BASE}/?qa-room=break_room`); // real save mode
  await waitRoom('break_room');
  await page.waitForTimeout(1500);

  // Requirements: gossiping_coworker (7,7), friend_fishing (16,5), overheard_conversation (10,9), verbal_disclosure (17,4)
  // gossiping_coworker sits behind a social gate: first SPACE resolves the gate
  // (toast only), the second opens the real dialogue.
  const dump = async (tag) => {
    const s = await qa(() => ({
      npcs: window.__QA__.completedNPCs, zones: window.__QA__.completedZones,
      items: window.__QA__.collectedItems, rooms: window.__QA__.completedRooms,
    }));
    console.log(`  [${tag}]`, JSON.stringify(s));
  };
  // Social gate: first SPACE resolves the gate (toast only). Retry until the
  // real dialogue opens, then click through it.
  let g = false;
  for (let attempt = 0; attempt < 4 && !g; attempt++) {
    await interactWithNpc(7, 7, 'gossiping_coworker');
    const opened = await page.waitForSelector('[data-testid="dialogue-overlay"]', { timeout: 3000 }).then(() => true).catch(() => false);
    console.log(`  gossip attempt ${attempt + 1}: dialogue=${opened}`);
    await dismissOverlays();
    const done = await qa(() => window.__QA__.completedNPCs);
    g = (done || []).includes('gossiping_coworker');
    await page.waitForTimeout(600);
  }
  await dump('after gossip');
  const f = await interactWithNpc(16, 5, 'friend_fishing');
  await dismissOverlays();
  await dump('after friend');
  const z = await interactWithNpc(10, 9, 'overheard_conversation');
  await dismissOverlays();
  await dump('after zone');
  const it = await interactWithNpc(17, 4, 'verbal_disclosure');
  await dismissOverlays();
  await dump('after item');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/F03C-break-room-completed.png` });

  const saved = await qa(() => JSON.parse(localStorage.getItem('pq:save:v2')));
  const evLog = await qa(() => window.__QA__.eventLog); // full log (capped at 50)
  const actAdvanced = saved.currentAct === 2 && saved.act1Complete === true;
  report('F-03e', actAdvanced,
    `act advances on live completion (reached: g=${g} f=${f} z=${z} i=${it}; save.currentAct=${saved.currentAct}, act1Complete=${saved.act1Complete}, completedRooms=${JSON.stringify(saved.completedRooms)})`);
  // Informational only — the 50-entry event log can scroll act-advance out
  // under SFX traffic; the save fields above are the authoritative proof.
  const sawActEvent = (evLog || []).some(e => (e.event || String(e)).includes('act-advance'));
  console.log(`INFO F-03f — ACT_ADVANCE seen in (capped) bridge log: ${sawActEvent}`);
} catch (e) {
  report('F-03C', false, 'section threw: ' + e.message.slice(0, 200));
  await page.screenshot({ path: `${OUT}/F03C-section-error.png` }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────
// SECTION 2 — F-15: after helping the chosen person, the other unlocks
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/?qa-room=records_room&qa-no-save`);
  await waitRoom('records_room');
  // The choice gate modal appears on room entry
  await page.waitForSelector('[data-testid="choice-prompt-overlay"]', { timeout: 8000 });
  await page.screenshot({ path: `${OUT}/F15-choice-gate.png` });
  await page.click('[data-testid="button-choice-0"]'); // "Help the patient first"
  await page.waitForTimeout(800);

  // Talk to the patient (patient_request at 4,8) and finish the dialogue
  const p = await interactWithNpc(4, 8, 'patient_request');
  await page.waitForSelector('[data-testid="dialogue-overlay"]', { timeout: 5000 }).catch(() => {});
  await dismissOverlays();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/F15-after-patient-dialogue.png` });

  // Now the attorney should be talkable (previously: permanent "isn't ready to talk yet")
  const a = await interactWithNpc(15, 8, 'attorney');
  const attorneyDialogue = await page.waitForSelector('[data-testid="dialogue-overlay"]', { timeout: 5000 }).then(() => true).catch(() => false);
  await page.screenshot({ path: `${OUT}/F15-attorney-now-talkable.png` });
  report('F-15a', p && a && attorneyDialogue, `attorney unlocks after patient completes (patient reached=${p}, attorney reached=${a}, attorney dialogue=${attorneyDialogue})`);
  await dismissOverlays();
} catch (e) {
  report('F-15', false, 'section threw: ' + e.message.slice(0, 200));
  await page.screenshot({ path: `${OUT}/F15-section-error.png` }).catch(() => {});
}

console.log('\nSummary:');
for (const r of results) console.log(` ${r.pass ? 'PASS' : 'FAIL'} ${r.id}`);
await browser.close();
process.exit(results.every(r => r.pass) ? 0 : 1);
