/**
 * SHIP PLAYTHROUGH — the canonical end-to-end run for release checks.
 * Run with: npx tsx tests/ship-playthrough.mts   (dev server on :8080)
 *
 * Fresh save → every room in unlock order → every NPC/zone/item → all
 * minigames played for real (PHI Sorter ×3, corkboard, breach triage, tower
 * defense launch + return) → save-persistence reload → The Eighteen codex →
 * Chief Compliance Officer → WIN screen.
 *
 * Unlike the run07 traversal, this script has NO hardcoded coordinates: it
 * resolves every entity's position live from window.__QA__ room state, so it
 * survives room re-layouts (the recurring "stale ROOMS constants" failure).
 * Sorter answers are derived from sorterData.ts, not transcribed.
 *
 * Also verifies portrait-follows-speaker: every dialogue frame's name plate
 * is checked against the portrait asset slug via the roomData name→id map.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { createRequire } from 'module';
import { SORTER_DOCUMENT_SETS } from '../client/src/data/sorterData.ts';

const require = createRequire(import.meta.url);
const roomData = require('../client/src/data/roomData.json');

const BASE = 'http://localhost:8080';
const OUT = 'screenshots/ship';
mkdirSync(OUT, { recursive: true });

// ── roomData-derived reference (no coordinates!) ──────────────────
const rooms: any[] = roomData.rooms ?? roomData;
const NAME_TO_ID: Record<string, string> = {};
const ID_TO_SPRITE: Record<string, string> = {};
const SORTER_HOSTS: Record<string, string> = {}; // npcId → documentSetId
let TRIAGE_HOST = '';
for (const room of rooms) {
  for (const npc of room.npcs ?? []) {
    if (npc.name) NAME_TO_ID[String(npc.name).toLowerCase()] = npc.id;
    if (npc.sprite) ID_TO_SPRITE[npc.id] = `npc_${npc.sprite}`;
    const trig = npc.encounterTrigger;
    if (trig) {
      if (trig.encounterType === 'breach-triage') TRIAGE_HOST = npc.id;
      else if (trig.documentSetId || trig.setId || /phi-sort/.test(trig.encounterId ?? '')) {
        SORTER_HOSTS[npc.id] = trig.documentSetId ?? trig.setId ?? trig.encounterId;
      }
    }
  }
}
const sorterAnswersFor = (setRef: string): Array<'keep' | 'redact'> => {
  const sets = Object.values(SORTER_DOCUMENT_SETS);
  const set =
    sets.find((s) => s.id === setRef) ??
    // encounterId form ("phi-sort-lab") → match by trigger location
    sets.find((s) => setRef.includes(s.triggerLocation.replace('medical_records', 'records')));
  if (!set) throw new Error(`no sorter set for ${setRef}`);
  return set.items.map((i) => (i.category === 'phi' ? 'redact' : 'keep'));
};

const ROOM_ORDER = [
  { id: 'hospital_entrance', exit: ['entrance_to_reception'] },
  { id: 'reception', exit: ['reception_to_hallway_break', 'hallway_recbreak_to_break'] },
  { id: 'break_room', exit: ['break_to_hallway_lab', 'hallway_breaklab_to_lab'] },
  { id: 'lab', exit: ['lab_to_hallway_records', 'hallway_labrecords_to_records'] },
  { id: 'records_room', exit: ['records_to_hallway_it', 'hallway_recordsit_to_it'] },
  { id: 'it_office', exit: ['it_to_hallway_er', 'hallway_iter_to_er'] },
  { id: 'er', exit: [] },
];

// ── harness ───────────────────────────────────────────────────────
const results: Array<{ id: string; pass: boolean; note: string }> = [];
function report(id: string, pass: boolean, note: string) {
  results.push({ id, pass, note });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} — ${note}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const pageErrors: string[] = [];
const consoleErrors: string[] = [];
page.on('pageerror', (e) => { pageErrors.push(e.message.slice(0, 200)); console.log('[pageerror]', e.message.slice(0, 200)); });
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
const benign = (e: string) =>
  e.includes('favicon') || e.includes('404') || e.includes('net::ERR') ||
  e.includes('ResizeObserver') || e.includes('WebAudio') || e.includes('WebSocket') ||
  e.includes('Failed to load resource');

const qa = (fn: any, ...args: any[]) => page.evaluate(fn, ...args);
const pressSpace = async () => { await qa(() => (window as any).__QA__.commands.pressSpace()); await page.waitForTimeout(400); };
const waitRoom = (id: string) => page.waitForFunction((r) => (window as any).__QA__?.currentRoomId === r, id, { timeout: 25000 });

/** Live position lookup by entity id — the anti-stale-coordinates core. */
async function findPos(id: string): Promise<{ x: number; y: number } | null> {
  const live = await qa((eid: string) => {
    const q = (window as any).__QA__;
    for (const list of [q.roomNPCs, q.roomZones, q.roomItems]) {
      for (const e of list ?? []) if (e.id === eid) return { x: e.x, y: e.y };
    }
    return null;
  }, id);
  if (live) return live as any;
  // Interactables (e.g. the defense console) aren't in the QA entity lists —
  // resolve them from roomData obstacles by type, same source the game reads.
  const roomId = await qa(() => (window as any).__QA__.currentRoomId);
  const room = rooms.find((r) => r.id === roomId);
  const obstacle = (room?.obstacles ?? []).find((o: any) => o.type === id);
  return obstacle ? { x: obstacle.x, y: obstacle.y } : null;
}

async function roomStatus() {
  return qa(() => {
    const q = (window as any).__QA__;
    return {
      room: q.currentRoomId,
      npcs: (q.roomNPCs ?? []).map((e: any) => ({ id: e.id, done: e.completed })),
      zones: (q.roomZones ?? []).map((e: any) => ({ id: e.id, done: e.completed })),
      items: (q.roomItems ?? []).map((e: any) => ({ id: e.id, done: e.collected })),
    };
  }) as Promise<{ room: string; npcs: any[]; zones: any[]; items: any[] }>;
}

// ── portrait-follows-speaker tracker ──────────────────────────────
const portraitSamples: Array<{ name: string; slug: string }> = [];
async function samplePortrait() {
  const s = await qa(() => {
    const plate = document.querySelector('[data-testid="npc-battle-sprite"]');
    if (!plate) return null;
    const name = (plate as HTMLElement).innerText.trim();
    const img = plate.querySelector('img');
    let url = img?.getAttribute('src') ?? '';
    if (!url) {
      const crop = plate.querySelector('div[style*="background-image"]') as HTMLElement | null;
      url = crop?.style.backgroundImage ?? '';
    }
    const m = url.match(/([a-z0-9_]+)\.png/i);
    return { name, slug: m ? m[1] : '' };
  });
  if (s && (s as any).name) portraitSamples.push(s as any);
}

// ── overlay pump ──────────────────────────────────────────────────
async function clickThroughOverlays(maxLoops = 40) {
  for (let i = 0; i < maxLoops; i++) {
    const state = await qa(() => ({
      item: !!document.querySelector('[data-testid="educational-item-modal"]'),
      obs: !!document.querySelector('[data-testid="observation-hint-overlay"]'),
      dlg: !!document.querySelector('[data-testid="dialogue-overlay"]'),
      story: !!document.querySelector('[data-testid="patient-story-reveal"]'),
      choiceGate: !!document.querySelector('[data-testid="choice-prompt-overlay"]'),
      encounterReq: !!document.querySelector('[data-testid="encounter-request-modal"]'),
      sorterCard: !!document.querySelector('[data-testid="sorter-context-card"]'),
    })) as any;
    if (!state.item && !state.obs && !state.dlg && !state.story && !state.choiceGate && !state.encounterReq && !state.sorterCard) break;
    if (state.encounterReq) { await page.click('[data-testid="button-encounter-decline"]').catch(() => {}); await page.waitForTimeout(500); continue; }
    if (state.sorterCard) {
      // Auto-fired context card outside a deliberate playSorter: confirm then abort.
      await page.click('[data-testid="button-sorter-context-confirm"]').catch(() => {});
      await page.waitForSelector('[data-testid="phi-sorter-overlay"]', { timeout: 2000 }).catch(() => {});
      await page.click('[data-testid="button-sorter-close"]').catch(() => page.keyboard.press('Escape'));
      await page.waitForTimeout(500); continue;
    }
    if (state.story) { await page.click('[data-testid="button-continue"]').catch(() => {}); await page.waitForTimeout(500); continue; }
    if (state.item) { await page.click('[data-testid="button-close-modal"]').catch(() => {}); await page.waitForTimeout(400); continue; }
    if (state.obs) { await page.click('[data-testid="observation-hint-overlay"]').catch(() => {}); await page.waitForTimeout(400); continue; }
    if (state.choiceGate) {
      const b0 = page.locator('[data-testid="button-choice-0"]');
      if (await b0.isVisible().catch(() => false)) { await b0.click(); await page.waitForTimeout(600); continue; }
    }
    if (state.dlg) await samplePortrait();
    const next = page.locator('[data-testid="button-next-scene"]');
    if (await next.isVisible().catch(() => false)) { await next.click(); await page.waitForTimeout(450); continue; }
    const choice = page.locator('[data-testid="choice-button-1"]');
    if (await choice.isVisible().catch(() => false)) { await choice.click(); await page.waitForTimeout(450); continue; }
    const cont = page.locator('[data-testid="container-battle-dialogue"]');
    if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForTimeout(550); continue; }
    await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => !(window as any).__QA__?.paused, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(250);
}

/** Teleport adjacent to the entity (live position) and press SPACE. */
async function interactWith(id: string): Promise<boolean> {
  const pos = await findPos(id);
  if (!pos) { console.log(`  !! ${id} not in room state`); return false; }
  for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    await clickThroughOverlays(6);
    await qa(([a, b]: number[]) => (window as any).__QA__.commands.teleportTo(a, b), [pos.x + dx, pos.y + dy]);
    await page.waitForTimeout(500);
    const near = await qa(() => (window as any).__QA__.nearbyInteractable) as any;
    if (near && near.id === id) { await pressSpace(); return true; }
  }
  return false;
}

async function talk(id: string): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    await interactWith(id);
    await clickThroughOverlays();
    const done = (await qa(() => (window as any).__QA__.completedNPCs)) as string[];
    if ((done ?? []).includes(id)) return true;
    await page.waitForTimeout(600);
  }
  return false;
}

async function examine(id: string): Promise<boolean> {
  const ok = await interactWith(id);
  await clickThroughOverlays();
  return ok;
}

// ── minigames ─────────────────────────────────────────────────────
async function playSorter(npcId: string): Promise<boolean> {
  const answers = sorterAnswersFor(SORTER_HOSTS[npcId]);
  const reached = await interactWith(npcId);
  if (!reached) return false;
  await page.waitForSelector('[data-testid="encounter-request-modal"]', { timeout: 6000 });
  await page.click('[data-testid="button-encounter-accept"]');
  await page.waitForSelector('[data-testid="phi-sorter-overlay"]', { timeout: 6000 });
  await page.waitForTimeout(1100);
  for (let i = 0; i < answers.length; i++) {
    if (i > 0) await page.waitForTimeout(1250);
    await page.click(`[data-testid="sorter-stamp-${answers[i]}"]`).catch(() => {});
  }
  await page.waitForSelector('[data-testid="sorter-debrief"]', { timeout: 25000 });
  const acc = await page.locator('[data-testid="sorter-debrief-accuracy"]').innerText().catch(() => '?');
  await page.click('[data-testid="button-sorter-debrief-dismiss"]');
  await page.waitForTimeout(1200);
  await clickThroughOverlays();
  console.log(`  sorter ${npcId}: accuracy ${acc.replace(/\n/g, ' ')}`);
  return true;
}

async function playCorkboard(): Promise<boolean> {
  const reached = await interactWith('staff_corkboard');
  if (!reached) return false;
  const up = await page.waitForSelector('[data-testid="corkboard-overlay"]', { timeout: 5000 }).then(() => true).catch(() => false);
  if (!up) return false;
  const noteIds = (await qa(() =>
    [...document.querySelectorAll('[data-testid^="corkboard-note-"]')].map((e) => e.getAttribute('data-testid')),
  )) as string[];
  for (const t of noteIds) {
    await page.click(`[data-testid="${t}"]`).catch(() => {});
    await page.waitForTimeout(900);
  }
  const doneBtn = await page.waitForSelector('[data-testid="corkboard-done-close"]', { timeout: 6000 }).catch(() => null);
  if (doneBtn) await doneBtn.click();
  else await page.click('[data-testid="corkboard-close"]').catch(() => {});
  await page.waitForTimeout(800);
  await clickThroughOverlays();
  return !!doneBtn;
}

const NOT_REPORTABLE = ['RIDESHARE', 'WRONG CHART', 'DECEASED'];
async function playTriage(npcId: string): Promise<boolean> {
  const reached = await interactWith(npcId);
  if (!reached) return false;
  await page.waitForSelector('[data-testid="encounter-request-modal"]', { timeout: 6000 });
  await page.click('[data-testid="button-encounter-accept"]');
  await page.waitForSelector('[data-testid="breach-triage-overlay"]', { timeout: 8000 });
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (await page.locator('[data-testid="triage-debrief"]').isVisible().catch(() => false)) break;
    const fu = page.locator('[data-testid="follow-up-option-1"]');
    if (await fu.isVisible().catch(() => false)) { await fu.click().catch(() => {}); await page.waitForTimeout(450); continue; }
    let acted = false;
    for (const slot of [1, 2, 3]) {
      const headEl = page.locator(`[data-testid="card-headline-${slot}"]`);
      if (!(await headEl.isVisible().catch(() => false))) continue;
      const head = (await headEl.innerText().catch(() => '')).toUpperCase();
      const notReportable = NOT_REPORTABLE.some((k) => head.includes(k));
      const btn = notReportable ? `btn-not-reportable-${slot}` : `btn-reportable-${slot}`;
      const clicked = await page.click(`[data-testid="${btn}"]`, { timeout: 800 }).then(() => true).catch(() => false);
      if (clicked) { acted = true; await page.waitForTimeout(500); break; }
    }
    if (!acted) await page.waitForTimeout(400);
  }
  await page.waitForSelector('[data-testid="triage-debrief"]', { timeout: 15000 });
  const acc = await page.locator('[data-testid="triage-debrief-accuracy"]').innerText().catch(() => '?');
  console.log(`  triage: ${acc.replace(/\n/g, ' ')}`);
  await page.click('[data-testid="button-triage-debrief-dismiss"]');
  await page.waitForTimeout(1200);
  await clickThroughOverlays();
  return true;
}

/** Tower defense: launch from the Threat Console, verify the scene, force
 * victory (real 4-wave wins are covered by encounter-flow-review.spec.ts),
 * and confirm control returns to the room. */
async function playTowerDefense(): Promise<boolean> {
  const reached = await interactWith('defense_console');
  if (!reached) return false;
  // The room-cleared patient story can land on top of the SECURITY ALERT card
  // (it_office completes moments before this step) — pump it away first.
  for (let i = 0; i < 10; i++) {
    if (await page.locator('[data-testid="patient-story-reveal"]').isVisible().catch(() => false)) {
      await page.click('[data-testid="button-continue"]').catch(() => {});
      await page.waitForTimeout(600);
      continue;
    }
    if (await page.locator('text=DEFEND THE NETWORK').isVisible().catch(() => false)) break;
    // Card may have been swallowed by the story — re-press SPACE at the console.
    await pressSpace();
    await page.waitForTimeout(600);
  }
  await page.locator('text=DEFEND THE NETWORK').click({ timeout: 6000 });
  await page.waitForFunction(() => (window as any).__QA__?.sceneReady === 'BreachDefense', { timeout: 12000 });
  await page.waitForTimeout(1500);
  await qa(() => (window as any).__QA__.emit('encounter:complete', {
    encounterId: 'td-it-office', outcome: 'victory', securityScore: 85, scoreContribution: 10,
  }));
  const ret = page.locator('text=RETURN TO HOSPITAL');
  const debriefUp = await ret.isVisible({ timeout: 6000 }).catch(() => false);
  if (!debriefUp) return false;
  await ret.click();
  const back = await page.waitForFunction(() => (window as any).__QA__?.currentRoomId === 'it_office', { timeout: 12000 })
    .then(() => true).catch(() => false);
  await page.waitForTimeout(1000);
  await clickThroughOverlays();
  return back;
}

// ── room driver ───────────────────────────────────────────────────
async function goDoor(doorId: string, targetRoom?: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await clickThroughOverlays(8);
    await qa((id: string) => (window as any).__QA__.commands.navigateToDoor(id), doorId);
    const ok = await page.waitForFunction(
      ([d, t]: any) => {
        const q = (window as any).__QA__;
        return t ? q?.currentRoomId === t : !(q?.roomDoors ?? []).some((x: any) => x.id === d);
      },
      [doorId, targetRoom ?? null],
      { timeout: 10000 },
    ).then(() => true).catch(() => false);
    if (ok) { await page.waitForTimeout(3200); await clickThroughOverlays(8); return; }
    const dbg = await qa(() => ({ room: (window as any).__QA__.currentRoomId, doors: (window as any).__QA__.roomDoors }));
    console.log(`  goDoor retry ${attempt + 1} for ${doorId}:`, JSON.stringify(dbg).slice(0, 300));
    await page.waitForTimeout(1200);
  }
  throw new Error(`goDoor failed: ${doorId}`);
}

async function clearRoom(roomId: string) {
  console.log(`── ${roomId}`);
  for (let pass = 0; pass < 4; pass++) {
    const st = await roomStatus();
    const pendingNpcs = st.npcs.filter((n) => !n.done && n.id !== 'compliance_officer');
    const pendingZones = st.zones.filter((z) => !z.done);
    const pendingItems = st.items.filter((i) => !i.done);
    if (!pendingNpcs.length && !pendingZones.length && !pendingItems.length) break;
    // Zones first — several NPCs sit behind observation gates.
    for (const z of pendingZones) {
      if (z.id === 'staff_corkboard') { await playCorkboard(); continue; }
      await examine(z.id);
    }
    for (const n of pendingNpcs) {
      if (SORTER_HOSTS[n.id]) { await playSorter(n.id); continue; }
      if (n.id === TRIAGE_HOST) { await playTriage(n.id); continue; }
      await talk(n.id);
    }
    for (const it of pendingItems) await examine(it.id);
    await page.waitForTimeout(800);
    await clickThroughOverlays(8);
  }
  const st = await roomStatus();
  const left = [
    ...st.npcs.filter((n) => !n.done && n.id !== 'compliance_officer').map((n) => `npc:${n.id}`),
    ...st.zones.filter((z) => !z.done).map((z) => `zone:${z.id}`),
    ...st.items.filter((i) => !i.done).map((i) => `item:${i.id}`),
  ];
  report(`room-${roomId}`, left.length === 0, left.length ? `INCOMPLETE: ${left.join(', ')}` : 'all NPCs/zones/items cleared');
}

// ═══════════════════════════════════════════════════════════════════
// GO
// ═══════════════════════════════════════════════════════════════════
await page.goto(`${BASE}/`);
await qa(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(`${BASE}/?qa-room=hospital_entrance`);
await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30000 });
await waitRoom('hospital_entrance');
await page.waitForTimeout(3200);
await clickThroughOverlays();

for (const step of ROOM_ORDER) {
  await waitRoom(step.id);
  await clearRoom(step.id);
  if (step.id === 'it_office') {
    const td = await playTowerDefense();
    report('minigame-tower-defense', td, td ? 'console → alert → BreachDefense → victory debrief → back in room' : 'TD flow broke');
  }
  for (const door of step.exit) await goDoor(door);
}

// ── The Eighteen codex ────────────────────────────────────────────
await page.keyboard.press('i');
const codexUp = await page.waitForSelector('[data-testid="phi18-codex"]', { timeout: 5000 }).then(() => true).catch(() => false);
const codexCount = codexUp ? await page.locator('[data-testid="phi18-count"]').innerText().catch(() => '?') : '?';
if (codexUp) await page.click('[data-testid="phi18-close"]').catch(() => page.keyboard.press('Escape'));
await page.waitForTimeout(500);
const identifiersFound = (await qa(() => JSON.parse(localStorage.getItem('pq:save:v2') || '{}').identifiersFound)) as string[] | undefined;
report('minigame-the-eighteen', codexUp && (identifiersFound?.length ?? 0) > 0,
  `codex opens=${codexUp} count="${codexCount.replace(/\n/g, ' ')}" saved=${identifiersFound?.length ?? 0} identifiers`);
await page.screenshot({ path: `${OUT}/ship-codex.png` });

// ── Save/load persistence: hard reload, resume from save ──────────
const beforeReload = (await qa(() => ({
  rooms: (window as any).__QA__.completedRooms,
  npcs: (window as any).__QA__.completedNPCs.length,
}))) as any;
await page.reload();
await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30000 });
await page.waitForTimeout(2500);
// qa-room param is still in the URL; what matters is the save surviving the reload.
const afterReload = (await qa(() => ({
  rooms: (window as any).__QA__.completedRooms,
  npcs: (window as any).__QA__.completedNPCs.length,
}))) as any;
report('save-survives-reload',
  afterReload.npcs === beforeReload.npcs && afterReload.rooms.length === beforeReload.rooms.length,
  `before: ${beforeReload.rooms.length} rooms/${beforeReload.npcs} npcs → after: ${afterReload.rooms.length} rooms/${afterReload.npcs} npcs`);
await clickThroughOverlays();

// ── Back to records_room for the Chief Compliance Officer ─────────
// The reload above re-applied ?qa-room=hospital_entrance, so jump straight
// to records via the qa param (door traversal is already covered above).
await page.goto(`${BASE}/?qa-room=records_room`);
await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30000 });
await waitRoom('records_room');
await page.waitForTimeout(3200);
await clickThroughOverlays();

const npcsBeforeBoss = (await qa(() => (window as any).__QA__.completedNPCs)) as string[];
console.log(`  completedNPCs before boss: ${npcsBeforeBoss.length}/25`);
const bossTalked = await talk('compliance_officer');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/ship-final-win.png` });
const winTitle = await page.locator('[data-testid="result-title"]').innerText().catch(() => '(none)');
const trophy = await page.locator('[data-testid="trophy-icon"]').isVisible().catch(() => false);
report('WIN', bossTalked && trophy && winTitle !== '(none)',
  `boss=${bossTalked} → win screen "${winTitle.replace(/\n/g, ' ')}" trophy=${trophy} (${npcsBeforeBoss.length}+1 NPCs)`);

// ── Portrait-follows-speaker audit ────────────────────────────────
const mismatches: string[] = [];
const seen = new Set<string>();
for (const s of portraitSamples) {
  const key = `${s.name}→${s.slug}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const expectedId = NAME_TO_ID[s.name.toLowerCase()];
  if (!expectedId || !s.slug) continue;
  // Valid faces for a speaker: their dedicated bust (<npcId>.png) or — while
  // busts aren't generated — their own walk sheet (npc_<sprite>.png) fallback.
  const valid = [expectedId, ID_TO_SPRITE[expectedId]].filter(Boolean);
  if (!valid.includes(s.slug)) mismatches.push(`"${s.name}" showed ${s.slug} (expected ${valid.join(' or ')})`);
}
report('portraits-match-speaker', mismatches.length === 0,
  mismatches.length ? mismatches.slice(0, 5).join('; ') : `${seen.size} unique speaker/portrait pairs, all consistent`);

// ── Console cleanliness ───────────────────────────────────────────
const realPageErrors = pageErrors.filter((e) => !benign(e));
const realConsoleErrors = consoleErrors.filter((e) => !benign(e));
report('no-page-errors', realPageErrors.length === 0, realPageErrors.slice(0, 3).join(' | ') || 'clean');
report('no-console-errors', realConsoleErrors.length === 0, realConsoleErrors.slice(0, 3).join(' | ') || 'clean');

console.log('\n══ SHIP PLAYTHROUGH SUMMARY ══');
for (const r of results) console.log(` ${r.pass ? 'PASS' : 'FAIL'} ${r.id} — ${r.note}`);
await browser.close();
process.exit(results.every((r) => r.pass) ? 0 : 1);
