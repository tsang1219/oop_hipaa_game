// Run 07 — Round 1 verification: F-01, F-02, F-03, F-04, F-07, F-15
// Drives the live dev server on :8080 via the qa-bridge, like tests/loop4-*.mjs.
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
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message.slice(0, 200)));

const qa = (fn, ...args) => page.evaluate(fn, ...args);
const teleport = async (x, y) => { await qa(([a, b]) => window.__QA__.commands.teleportTo(a, b), [x, y]); await page.waitForTimeout(400); };
const pressSpace = async () => { await qa(() => window.__QA__.commands.pressSpace()); await page.waitForTimeout(400); };
const waitRoom = (id) => page.waitForFunction((r) => window.__QA__?.currentRoomId === r, id, { timeout: 20000 });
// Probe tiles around an NPC until nearbyInteractable is that NPC, then press SPACE.
// Some adjacent tiles are blocked by Phase 26 furniture — physics ejects the
// teleported body over a few frames, so require two consecutive stable reads.
const interactWithNpc = async (nx, ny, npcId) => {
  for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]]) {
    await teleport(nx + dx, ny + dy);
    await page.waitForTimeout(500);
    const r1 = await qa(() => ({ n: window.__QA__.nearbyInteractable, p: window.__QA__.playerPosition }));
    await page.waitForTimeout(300);
    const r2 = await qa(() => ({ n: window.__QA__.nearbyInteractable, p: window.__QA__.playerPosition }));
    if (JSON.stringify(r1) === JSON.stringify(r2) && r2.n && r2.n.id === npcId) {
      await pressSpace();
      return true;
    }
  }
  return false;
};

// ─────────────────────────────────────────────────────────────────
// SECTION 1 — F-01 sorter stamps commit + F-04 Aiyana completes + F-07 replay line
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/?qa-room=hospital_entrance&qa-no-save`);
  await waitRoom('hospital_entrance');
  await page.waitForTimeout(1500);
  const reachedAiyana = await interactWithNpc(10, 6, 'aiyana_intake');
  if (!reachedAiyana) throw new Error('could not reach Aiyana via any adjacent tile');
  await page.waitForSelector('[data-testid="encounter-request-modal"]', { timeout: 5000 });
  await page.click('[data-testid="button-encounter-accept"]');
  await page.waitForSelector('[data-testid="phi-sorter-overlay"]', { timeout: 5000 });
  await page.waitForTimeout(1200); // first doc slide-in + activation
  await page.screenshot({ path: `${OUT}/F01-desk-before-first-stamp.png` });

  // Answer key for phi-sorter-set-1 (in item order): 7x phi (REDACT), 3x not_phi (KEEP)
  const answers = ['redact','redact','redact','redact','redact','redact','redact','keep','keep','keep'];

  // Stamp doc 1, then assert the counter moved — the exact F-01 repro.
  await page.click(`[data-testid="sorter-stamp-${answers[0]}"]`);
  await page.waitForTimeout(500);
  const progress1 = await page.locator('text=/1 \\/ 10 sorted/').count();
  report('F-01a', progress1 > 0, `first stamp commits (counter shows 1/10: ${progress1 > 0})`);
  await page.screenshot({ path: `${OUT}/F01-desk-after-first-stamp.png` });

  for (let i = 1; i < answers.length; i++) {
    // wait for next doc active (cascade is 950ms) then stamp
    await page.waitForTimeout(1250);
    await page.click(`[data-testid="sorter-stamp-${answers[i]}"]`).catch(() => {});
  }
  await page.waitForSelector('[data-testid="sorter-debrief"]', { timeout: 15000 });
  const accuracy = await page.locator('[data-testid="sorter-debrief-accuracy"]').innerText().catch(() => '?');
  report('F-01b', true, `full shift playable → debrief (accuracy: ${accuracy.replace(/\n/g, ' ')})`);
  await page.screenshot({ path: `${OUT}/F01-sorter-debrief.png` });
  await page.click('[data-testid="button-sorter-debrief-dismiss"]');
  await page.waitForTimeout(1000);

  // F-04: Aiyana should now be in completedNPCs
  const npcs = await qa(() => window.__QA__.completedNPCs);
  report('F-04a', (npcs || []).includes('aiyana_intake'), `completedNPCs after sorter win: ${JSON.stringify(npcs)}`);

  // F-07: talk to Aiyana again — expect speech bubble, no freeze
  await interactWithNpc(10, 6, 'aiyana_intake');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/F07-aiyana-replay-bubble.png` });
  const pausedAfter = await qa(() => window.__QA__.paused);
  // prove the scene is alive: teleport still works
  const posBefore = await qa(() => window.__QA__.playerPosition);
  await teleport(5, 10);
  const pos = await qa(() => window.__QA__.playerPosition);
  const moved = pos && posBefore && (pos.tileX !== posBefore.tileX || pos.tileY !== posBefore.tileY);
  report('F-07a', pausedAfter === false && !!moved, `no freeze after replay-talk (paused=${pausedAfter}, moved ${JSON.stringify(posBefore)} → ${JSON.stringify(pos)})`);
} catch (e) {
  report('F-01/F-04/F-07', false, 'section threw: ' + e.message.slice(0, 200));
  await page.screenshot({ path: `${OUT}/F01-section-error.png` }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────
// SECTION 2 — F-02 TD decline is respected, re-arms on leave
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/?qa-room=it_office&qa-no-save`);
  await waitRoom('it_office');
  await page.waitForTimeout(1500);
  await teleport(9, 6);
  await page.waitForSelector('text=NOT RIGHT NOW', { timeout: 8000 });
  await page.screenshot({ path: `${OUT}/F02-alert-card.png` });
  await page.click('text=NOT RIGHT NOW');
  await page.waitForTimeout(1500);
  const cardAfterDecline = await page.locator('text=NOT RIGHT NOW').count();
  await page.waitForTimeout(2000);
  const cardAfter3s = await page.locator('text=NOT RIGHT NOW').count();
  report('F-02a', cardAfterDecline === 0 && cardAfter3s === 0, `decline sticks (card count after 1.5s=${cardAfterDecline}, after 3.5s=${cardAfter3s})`);
  await page.screenshot({ path: `${OUT}/F02-after-decline-no-loop.png` });

  // player can actually do things now — move away
  await teleport(3, 12);
  await page.waitForTimeout(800);
  const posAway = await qa(() => window.__QA__.playerPosition) ?? { tileX: '?', tileY: '?' };
  const cardWhileAway = await page.locator('text=NOT RIGHT NOW').count();

  // walk back in → should re-trigger (decline means "not right now", not "never")
  await teleport(9, 6);
  const reTriggered = await page.waitForSelector('text=NOT RIGHT NOW', { timeout: 6000 }).then(() => true).catch(() => false);
  report('F-02b', cardWhileAway === 0 && reTriggered, `re-arms after leaving radius (moved=${JSON.stringify(posAway)}, card-while-away=${cardWhileAway}, re-triggered=${reTriggered})`);
  await page.screenshot({ path: `${OUT}/F02-retrigger-on-return.png` });
} catch (e) {
  report('F-02', false, 'section threw: ' + e.message.slice(0, 200));
  await page.screenshot({ path: `${OUT}/F02-section-error.png` }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────
// SECTION 3 — F-03A extended save fields survive the persistence effect
// ─────────────────────────────────────────────────────────────────
try {
  await page.goto(`${BASE}/`); // any load to have origin for localStorage
  await qa(() => {
    localStorage.clear();
    localStorage.setItem('pq:save:v2', JSON.stringify({
      version: 2,
      completedRooms: ['hospital_entrance','reception','break_room','lab','records_room'],
      collectedStories: [], completedNPCs: ['riley_entrance'], completedZones: [], collectedItems: [],
      privacyScore: 80, finalPrivacyScore: 80, resolvedGates: {}, unlockedNpcs: {},
      npcPulsedRooms: [], gameStartTime: Date.now(), onboardingSeen: true, sfxMuted: false, musicVolume: 0.6,
      currentRoomId: 'records_room', currentAct: 3, act1Complete: true, act2Complete: true,
      actFlags: { vendorWarned: true }, decisions: { helpedPatientFirst: true },
      encounterResults: { 'phi-sort-reception': { completed: true, score: 9, outcome: 'victory' } },
      unifiedScore: 91,
    }));
  });
  await page.goto(`${BASE}/?qa-room=hospital_entrance`); // NO qa-no-save — real save path
  await waitRoom('hospital_entrance');
  await page.waitForTimeout(4000); // let every persistence effect fire
  const saved = await qa(() => JSON.parse(localStorage.getItem('pq:save:v2')));
  const ok = saved.currentAct === 3 && saved.act2Complete === true &&
    saved.encounterResults?.['phi-sort-reception']?.outcome === 'victory' &&
    saved.actFlags?.vendorWarned === true && saved.decisions?.helpedPatientFirst === true &&
    saved.unifiedScore === 91;
  report('F-03a', ok, `extended fields survive writes (currentAct=${saved.currentAct}, act2Complete=${saved.act2Complete}, encounterResults kept=${!!saved.encounterResults?.['phi-sort-reception']}, actFlags kept=${!!saved.actFlags?.vendorWarned}, unifiedScore=${saved.unifiedScore})`);
} catch (e) {
  report('F-03a', false, 'section threw: ' + e.message.slice(0, 200));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 4 — F-03B Act 3 gate: Priya spawns in ER with the game-written save shape
// ─────────────────────────────────────────────────────────────────
try {
  // save from section 3 still has currentAct: 3 — visit the ER
  await page.goto(`${BASE}/?qa-room=er`);
  await waitRoom('er');
  await page.waitForTimeout(1500);
  await teleport(8, 13); // Priya at (8,12)
  const nearby = await qa(() => window.__QA__.nearbyInteractable);
  await page.screenshot({ path: `${OUT}/F03-priya-spawns-act3.png` });
  const isPriya = nearby && JSON.stringify(nearby).toLowerCase().includes('priya');
  report('F-03b', !!isPriya, `Priya present at (8,12) with currentAct:3 (nearby=${JSON.stringify(nearby)})`);
  if (isPriya) {
    await pressSpace();
    const modal = await page.waitForSelector('[data-testid="encounter-request-modal"]', { timeout: 5000 }).then(() => true).catch(() => false);
    await page.screenshot({ path: `${OUT}/F03-priya-triage-request.png` });
    report('F-03c', modal, `Priya opens the Breach Triage request modal: ${modal}`);
    if (modal) await page.click('[data-testid="button-encounter-decline"]');
  }
  // Control: act 1 save must NOT spawn Priya
  await qa(() => {
    const s = JSON.parse(localStorage.getItem('pq:save:v2'));
    s.currentAct = 1; s.act1Complete = false; s.act2Complete = false;
    localStorage.setItem('pq:save:v2', JSON.stringify(s));
  });
  await page.goto(`${BASE}/?qa-room=er`);
  await waitRoom('er');
  await page.waitForTimeout(1500);
  await teleport(8, 13);
  const nearbyAct1 = await qa(() => window.__QA__.nearbyInteractable);
  const priyaAct1 = nearbyAct1 && JSON.stringify(nearbyAct1).toLowerCase().includes('priya');
  report('F-03d', !priyaAct1, `Act-1 control: Priya absent (nearby=${JSON.stringify(nearbyAct1)})`);
} catch (e) {
  report('F-03b/c/d', false, 'section threw: ' + e.message.slice(0, 200));
}

console.log('\nConsole errors seen:', consoleErrors.length ? consoleErrors : 'none');
console.log('\nSummary:');
for (const r of results) console.log(` ${r.pass ? 'PASS' : 'FAIL'} ${r.id}`);
await browser.close();
process.exit(results.every(r => r.pass) ? 0 : 1);
