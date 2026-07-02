// Run 07 — Round 5: FULL traversal regression. Fresh save → every room in
// UNLOCK_ORDER → all 26 NPCs (dialogues, gates, 3 sorter wins, triage win) →
// act advances → patient stories → Chief Compliance Officer → WIN SCREEN.
// This is the "play again" pass of the find→fix→verify loop.
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
const pageErrors = [];
page.on('pageerror', (e) => { pageErrors.push(e.message.slice(0, 200)); console.log('[pageerror]', e.message.slice(0, 200)); });

const qa = (fn, ...args) => page.evaluate(fn, ...args);
const teleport = async (x, y) => { await qa(([a, b]) => window.__QA__.commands.teleportTo(a, b), [x, y]); await page.waitForTimeout(350); };
const pressSpace = async () => { await qa(() => window.__QA__.commands.pressSpace()); await page.waitForTimeout(400); };
const waitRoom = (id) => page.waitForFunction((r) => window.__QA__?.currentRoomId === r, id, { timeout: 25000 });

async function declineTdIfUp() {
  const decline = page.locator('text=NOT RIGHT NOW');
  if (await decline.count()) {
    await decline.click().catch(() => {});
    await page.waitForTimeout(700);
  }
}

async function dismissStoryOrBanner() {
  // patient story reveal (after room-cleared banner)
  const cont = page.locator('[data-testid="button-continue"]');
  if (await cont.isVisible().catch(() => false)) {
    await cont.click().catch(() => {});
    await page.waitForTimeout(600);
  }
}

const interactWith = async (nx, ny, id) => {
  for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    await declineTdIfUp();
    await dismissStoryOrBanner();
    await teleport(nx + dx, ny + dy);
    await page.waitForTimeout(450);
    const r1 = await qa(() => ({ n: window.__QA__.nearbyInteractable, p: window.__QA__.playerPosition }));
    await page.waitForTimeout(250);
    const r2 = await qa(() => ({ n: window.__QA__.nearbyInteractable, p: window.__QA__.playerPosition }));
    if (JSON.stringify(r1) === JSON.stringify(r2) && r2.n && r2.n.id === id) {
      await declineTdIfUp();
      await pressSpace();
      return true;
    }
  }
  return false;
};

async function clickThroughOverlays() {
  for (let i = 0; i < 40; i++) {
    const state = await page.evaluate(() => ({
      item: !!document.querySelector('[data-testid="educational-item-modal"]'),
      obs: !!document.querySelector('[data-testid="observation-hint-overlay"]'),
      dlg: !!document.querySelector('[data-testid="dialogue-overlay"]'),
      story: !!document.querySelector('[data-testid="patient-story-reveal"]'),
    }));
    if (!state.item && !state.obs && !state.dlg && !state.story) break;
    if (state.story) { await page.click('[data-testid="button-continue"]').catch(() => {}); await page.waitForTimeout(500); continue; }
    if (state.item) { await page.click('[data-testid="button-close-modal"]').catch(() => {}); await page.waitForTimeout(400); continue; }
    if (state.obs) { await page.click('[data-testid="observation-hint-overlay"]').catch(() => {}); await page.waitForTimeout(400); continue; }
    const next = page.locator('[data-testid="button-next-scene"]');
    if (await next.isVisible().catch(() => false)) { await next.click(); await page.waitForTimeout(450); continue; }
    const choice = page.locator('[data-testid="choice-button-1"]');
    if (await choice.isVisible().catch(() => false)) { await choice.click(); await page.waitForTimeout(450); continue; }
    const cont = page.locator('[data-testid="container-battle-dialogue"]');
    if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForTimeout(550); continue; }
    await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => !window.__QA__?.paused, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function talk(x, y, id) {
  let ok = await interactWith(x, y, id);
  await clickThroughOverlays();
  // social gates resolve on first SPACE with a toast — retry until completed
  for (let attempt = 0; attempt < 3; attempt++) {
    const done = await qa(() => window.__QA__.completedNPCs);
    if ((done || []).includes(id)) return ok;
    await page.waitForTimeout(700);
    ok = await interactWith(x, y, id);
    await clickThroughOverlays();
  }
  return ok;
}

async function examine(x, y, id) {
  const ok = await interactWith(x, y, id);
  await clickThroughOverlays();
  return ok;
}

async function playSorter(npcX, npcY, npcId, answers) {
  const reached = await interactWith(npcX, npcY, npcId);
  if (!reached) return false;
  await page.waitForSelector('[data-testid="encounter-request-modal"]', { timeout: 6000 });
  await page.click('[data-testid="button-encounter-accept"]');
  await page.waitForSelector('[data-testid="phi-sorter-overlay"]', { timeout: 6000 });
  await page.waitForTimeout(1100);
  for (let i = 0; i < answers.length; i++) {
    if (i > 0) await page.waitForTimeout(1250);
    await page.click(`[data-testid="sorter-stamp-${answers[i]}"]`).catch(() => {});
  }
  await page.waitForSelector('[data-testid="sorter-debrief"]', { timeout: 20000 });
  const header = await page.locator('[data-testid="sorter-debrief-header"]').innerText().catch(() => '?');
  await page.click('[data-testid="button-sorter-debrief-dismiss"]');
  await page.waitForTimeout(1200);
  console.log(`  sorter ${npcId}: ${header.replace(/\n/g, ' ')}`);
  return true;
}

const NOT_REPORTABLE = ['RIDESHARE', 'WRONG CHART', 'DECEASED'];

async function playTriage(npcX, npcY) {
  const reached = await interactWith(npcX, npcY, 'priya_privacy_officer');
  if (!reached) return false;
  await page.waitForSelector('[data-testid="encounter-request-modal"]', { timeout: 6000 });
  await page.click('[data-testid="button-encounter-accept"]');
  await page.waitForSelector('[data-testid="breach-triage-overlay"]', { timeout: 8000 });
  // Work the queue until the debrief shows (or 90s cap)
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (await page.locator('[data-testid="triage-debrief"]').isVisible().catch(() => false)) break;
    // follow-up panel takes priority — correct option is always #1 in the data
    const fu = page.locator('[data-testid="follow-up-option-1"]');
    if (await fu.isVisible().catch(() => false)) {
      await fu.click().catch(() => {});
      await page.waitForTimeout(450);
      continue;
    }
    // classify any visible card
    let acted = false;
    for (const slot of [1, 2, 3]) {
      const headEl = page.locator(`[data-testid="card-headline-${slot}"]`);
      if (!(await headEl.isVisible().catch(() => false))) continue;
      const head = (await headEl.innerText().catch(() => '')).toUpperCase();
      const notReportable = NOT_REPORTABLE.some(k => head.includes(k));
      const btn = notReportable ? `btn-not-reportable-${slot}` : `btn-reportable-${slot}`;
      const clicked = await page.click(`[data-testid="${btn}"]`, { timeout: 800 }).then(() => true).catch(() => false);
      if (clicked) { acted = true; await page.waitForTimeout(500); break; }
    }
    if (!acted) await page.waitForTimeout(400);
  }
  await page.waitForSelector('[data-testid="triage-debrief"]', { timeout: 15000 });
  const header = await page.locator('[data-testid="triage-debrief-header"]').innerText().catch(() => '?');
  const acc = await page.locator('[data-testid="triage-debrief-accuracy"]').innerText().catch(() => '?');
  console.log(`  triage: ${header.replace(/\n/g, ' ')} ${acc.replace(/\n/g, ' ')}`);
  await page.click('[data-testid="button-triage-debrief-dismiss"]');
  await page.waitForTimeout(1200);
  return true;
}

async function goDoor(doorId, targetRoom) {
  await dismissStoryOrBanner();
  for (let attempt = 0; attempt < 3; attempt++) {
    await qa((id) => window.__QA__.commands.navigateToDoor(id), doorId);
    const ok = await page.waitForFunction((r) => window.__QA__?.currentRoomId === r, targetRoom, { timeout: 10000 }).then(() => true).catch(() => false);
    if (ok) {
      await page.waitForTimeout(3200); // room intro card auto-dismisses ~2.9s
      await dismissStoryOrBanner();
      return;
    }
    const dbg = await qa(() => ({
      room: window.__QA__.currentRoomId,
      paused: window.__QA__.paused,
      doors: window.__QA__.roomDoors,
    }));
    console.log(`  goDoor retry ${attempt + 1} for ${doorId}:`, JSON.stringify(dbg).slice(0, 350));
    await dismissStoryOrBanner();
    await declineTdIfUp();
    await clickThroughOverlays();
    await page.waitForTimeout(1200);
  }
  throw new Error(`goDoor failed: ${doorId} → ${targetRoom}`);
}

const saveField = (f) => qa((k) => JSON.parse(localStorage.getItem('pq:save:v2') || '{}')[k], f);

// ═════════════════════════════════════════════════════════════════
// GO
// ═════════════════════════════════════════════════════════════════
await page.goto(`${BASE}/`);
await qa(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(`${BASE}/?qa-room=hospital_entrance`);
await waitRoom('hospital_entrance');
await page.waitForTimeout(3200);

// ── 1. HOSPITAL LOBBY ─────────────────────────────────────────────
console.log('── hospital_entrance');
const t1 = await talk(10, 4, 'riley_entrance');
const s1 = await playSorter(10, 6, 'aiyana_intake', ['redact','redact','redact','redact','redact','redact','redact','keep','keep','keep']);
const z1 = await examine(5, 2, 'welcome_board');
const i1 = await examine(15, 4, 'hipaa_brochure');
report('R5-lobby', t1 && s1 && z1 && i1, `riley=${t1} sorter=${s1} zone=${z1} item=${i1}`);
await goDoor('entrance_to_reception', 'reception');

// ── 2. RECEPTION ──────────────────────────────────────────────────
console.log('── reception');
const t2a = await talk(10, 3, 'riley');
const t2b = await talk(5, 8, 'nervous_patient');
const t2c = await talk(15, 8, 'chatty_visitor');
const z2a = await examine(8, 4, 'sign_in_sheet');
const z2b = await examine(12, 4, 'privacy_notice');
const i2 = await examine(2, 4, 'patient_rights_poster');
await page.waitForTimeout(2500); // banner + story
await dismissStoryOrBanner();
report('R5-reception', t2a && t2b && t2c && z2a && z2b && i2, `npcs=${t2a},${t2b},${t2c} zones=${z2a},${z2b} item=${i2}`);
await goDoor('reception_to_hallway_break', 'hallway_reception_break');
await goDoor('hallway_recbreak_to_break', 'break_room');

// ── 3. BREAK ROOM ─────────────────────────────────────────────────
console.log('── break_room');
const t3a = await talk(7, 7, 'gossiping_coworker');
const t3b = await talk(16, 5, 'friend_fishing');
const t3c = await talk(4, 12, 'tired_employee');
const t3d = await talk(14, 4, 'hr_director');
const t3e = await talk(14, 10, 'selfie_coworker');
const z3a = await examine(10, 9, 'overheard_conversation');
const z3b = await examine(6, 7, 'unlocked_phone');
const i3 = await examine(17, 4, 'verbal_disclosure');
await page.waitForTimeout(3000);
await dismissStoryOrBanner();
const actAfterBreak = await saveField('currentAct');
report('R5-break', t3a && t3b && t3c && t3d && t3e && z3a && z3b && i3 && actAfterBreak === 2,
  `npcs=${[t3a,t3b,t3c,t3d,t3e]} zones=${z3a},${z3b} item=${i3} ACT=${actAfterBreak} (expect 2)`);
await page.screenshot({ path: `${OUT}/R5-act2-reached.png` });
await goDoor('break_to_hallway_lab', 'hallway_break_lab');
await goDoor('hallway_breaklab_to_lab', 'lab');

// ── 4. LAB ────────────────────────────────────────────────────────
console.log('── lab');
const z4gate = await examine(13, 7, 'results_printout'); // observation gate for lab_tech
const t4a = await talk(10, 7, 'lab_tech');
const t4b = await talk(3, 5, 'researcher');
const t4c = await talk(16, 5, 'courier');
const s4 = await playSorter(9, 7, 'marcus_lab_aide', ['redact','redact','redact','redact','redact','redact','keep','keep','keep','keep']);
const z4a = await examine(7, 7, 'sample_labels');
const i4 = await examine(2, 8, 'phi_identifiers');
await page.waitForTimeout(2500);
await dismissStoryOrBanner();
report('R5-lab', z4gate && t4a && t4b && t4c && s4 && z4a && i4, `gatezone=${z4gate} npcs=${t4a},${t4b},${t4c} sorter=${s4} zone=${z4a} item=${i4}`);
await goDoor('lab_to_hallway_records', 'hallway_lab_records');
await goDoor('hallway_labrecords_to_records', 'records_room');

// ── 5. MEDICAL RECORDS (leave the CCO for last!) ──────────────────
console.log('── records_room');
// choice gate modal on entry
await page.waitForSelector('[data-testid="choice-prompt-overlay"]', { timeout: 8000 }).catch(() => {});
if (await page.locator('[data-testid="button-choice-0"]').isVisible().catch(() => false)) {
  await page.click('[data-testid="button-choice-0"]'); // help the patient first
  await page.waitForTimeout(700);
}
const t5a = await talk(4, 8, 'patient_request');
const t5b = await talk(15, 8, 'attorney');        // unlocked by F-15 after patient completes
const t5c = await talk(10, 10, 'records_clerk');
const s5 = await playSorter(14, 10, 'dr_tovar', ['redact','redact','redact','redact','redact','keep','keep','keep','keep','keep']);
const z5a = await examine(4, 4, 'unlocked_cabinet');
const z5b = await examine(7, 9, 'audit_log');
const z5c = await examine(4, 12, 'shredder');
const i5a = await examine(17, 8, 'minimum_necessary_manual');
const i5b = await examine(10, 4, 'hipaa_penalties');
await page.waitForTimeout(3000);
await dismissStoryOrBanner();
report('R5-records', t5a && t5b && t5c && s5 && z5a && z5b && z5c && i5a && i5b,
  `patient=${t5a} attorney=${t5b} clerk=${t5c} sorter=${s5} zones=${z5a},${z5b},${z5c} items=${i5a},${i5b}`);
await goDoor('records_to_hallway_it', 'hallway_records_it');
await goDoor('hallway_recordsit_to_it', 'it_office');

// ── 6. IT OFFICE (decline the TD; it's not needed for the ending) ─
console.log('── it_office');
const z6gate = await examine(9, 7, 'password_note'); // inside TD radius — helper declines the alert
const t6a = await talk(10, 7, 'security_analyst');
const t6b = await talk(3, 8, 'vendor');
const t6c = await talk(16, 8, 'workaround_employee');
const z6a = await examine(5, 10, 'breach_playbook');
const z6b = await examine(12, 10, 'fax_machine');
const z6c = await examine(14, 8, 'vendor_agreement');
const i6 = await examine(10, 2, 'security_safeguards');
await page.waitForTimeout(3000);
await dismissStoryOrBanner();
const actAfterIt = await saveField('currentAct');
report('R5-it', z6gate && t6a && t6b && t6c && z6a && z6b && z6c && i6 && actAfterIt === 3,
  `gatezone=${z6gate} npcs=${t6a},${t6b},${t6c} zones=${z6a},${z6b},${z6c} item=${i6} ACT=${actAfterIt} (expect 3)`);
await goDoor('it_to_hallway_er', 'hallway_it_er');
await goDoor('hallway_iter_to_er', 'er');

// ── 7. ER (Act 3 — Priya must be here) ────────────────────────────
console.log('── er');
const z7gate = await examine(10, 2, 'whiteboard'); // observation gate for dr_martinez
const t7a = await talk(10, 8, 'dr_martinez');
const t7b = await talk(2, 7, 'officer');
const t7c = await talk(17, 7, 'frantic_family');
const tri = await playTriage(8, 12);
const z7a = await examine(7, 6, 'unlocked_computer');
const i7 = await examine(17, 12, 'emergency_exceptions');
await page.waitForTimeout(3000);
await dismissStoryOrBanner();
report('R5-er', z7gate && t7a && t7b && t7c && tri && z7a && i7,
  `gatezone=${z7gate} npcs=${t7a},${t7b},${t7c} triage=${tri} zone=${z7a} item=${i7}`);
await page.screenshot({ path: `${OUT}/R5-er-complete.png` });

// ── 8. Back to Records — face the Chief Compliance Officer ────────
console.log('── back to records for the CCO');
await goDoor('er_to_hallway_it', 'hallway_it_er');
await goDoor('hallway_iter_to_it', 'it_office');
await declineTdIfUp();
await goDoor('it_to_hallway_records', 'hallway_records_it');
await goDoor('hallway_recordsit_to_records', 'records_room');

const npcsBeforeBoss = await qa(() => window.__QA__.completedNPCs);
console.log(`  completedNPCs before boss: ${npcsBeforeBoss.length}/26`, npcsBeforeBoss);
const stories = await saveField('collectedStories');
console.log('  collectedStories:', stories);

const t8 = await talk(8, 12, 'compliance_officer');
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/R5-final-win.png` });
const winTitle = await page.locator('[data-testid="result-title"]').innerText().catch(() => '(none)');
const trophy = await page.locator('[data-testid="trophy-icon"]').isVisible().catch(() => false);
report('R5-WIN', t8 && trophy && winTitle !== '(none)',
  `boss=${t8} → win screen "${winTitle}" trophy=${trophy} (completed ${npcsBeforeBoss.length}+1 of 26, stories=${JSON.stringify(stories)})`);
report('R5-clean', pageErrors.length === 0, `page errors during full traversal: ${pageErrors.length} ${pageErrors[0] ?? ''}`);

console.log('\nSummary:');
for (const r of results) console.log(` ${r.pass ? 'PASS' : 'FAIL'} ${r.id} — ${r.note}`);
await browser.close();
process.exit(results.every(r => r.pass) ? 0 : 1);
