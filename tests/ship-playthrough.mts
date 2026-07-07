/**
 * SHIP PLAYTHROUGH — the canonical full-game end-to-end run for release checks.
 * Run with: npx tsx tests/ship-playthrough.mts   (dev server on :8080)
 *
 * Fresh save → every room in unlock order → every NPC/zone/item → all
 * minigames played for real (PHI Sorter ×3, corkboard, breach triage, tower
 * defense launch + return) → save-persistence reload → The Eighteen codex →
 * Chief Compliance Officer → WIN screen.
 *
 * Driver internals (position resolution, overlay pump, minigame players,
 * portrait audit) live in tests/helpers/ship-drive.mts and are shared with
 * ship-demo.mts.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { createDriver } from './helpers/ship-drive.mts';

const BASE = 'http://localhost:8080';
const OUT = 'screenshots/ship';
mkdirSync(OUT, { recursive: true });

const ROOM_ORDER = [
  { id: 'hospital_entrance', exit: ['entrance_to_reception'] },
  { id: 'reception', exit: ['reception_to_hallway_break', 'hallway_recbreak_to_break'] },
  { id: 'break_room', exit: ['break_to_hallway_lab', 'hallway_breaklab_to_lab'] },
  { id: 'lab', exit: ['lab_to_hallway_records', 'hallway_labrecords_to_records'] },
  { id: 'records_room', exit: ['records_to_hallway_it', 'hallway_recordsit_to_it'] },
  { id: 'it_office', exit: ['it_to_hallway_er', 'hallway_iter_to_er'] },
  { id: 'er', exit: [] },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const d = createDriver(page);

await page.goto(`${BASE}/`);
await d.qa(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(`${BASE}/?qa-room=hospital_entrance`);
await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30000 });
await d.waitRoom('hospital_entrance');
await page.waitForTimeout(3200);
await d.clickThroughOverlays();

for (const step of ROOM_ORDER) {
  await d.waitRoom(step.id);
  await d.clearRoom(step.id);
  if (step.id === 'it_office') {
    const td = await d.playTowerDefense();
    d.report('minigame-tower-defense', td, td ? 'console → alert → BreachDefense → victory debrief → back in room' : 'TD flow broke');
  }
  for (const door of step.exit) await d.goDoor(door);
}

// ── The Eighteen codex ────────────────────────────────────────────
await page.keyboard.press('i');
const codexUp = await page.waitForSelector('[data-testid="phi18-codex"]', { timeout: 5000 }).then(() => true).catch(() => false);
const codexCount = codexUp ? await page.locator('[data-testid="phi18-count"]').innerText().catch(() => '?') : '?';
if (codexUp) await page.click('[data-testid="phi18-close"]').catch(() => page.keyboard.press('Escape'));
await page.waitForTimeout(500);
const identifiersFound = (await d.qa(() => JSON.parse(localStorage.getItem('pq:save:v2') || '{}').identifiersFound)) as string[] | undefined;
d.report('minigame-the-eighteen', codexUp && (identifiersFound?.length ?? 0) > 0,
  `codex opens=${codexUp} count="${codexCount.replace(/\n/g, ' ')}" saved=${identifiersFound?.length ?? 0} identifiers`);
await page.screenshot({ path: `${OUT}/ship-codex.png` });

// ── Save/load persistence: hard reload, resume from save ──────────
const beforeReload = (await d.qa(() => ({
  rooms: (window as any).__QA__.completedRooms,
  npcs: (window as any).__QA__.completedNPCs.length,
}))) as any;
await page.reload();
await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30000 });
await page.waitForTimeout(2500);
// qa-room param is still in the URL; what matters is the save surviving the reload.
const afterReload = (await d.qa(() => ({
  rooms: (window as any).__QA__.completedRooms,
  npcs: (window as any).__QA__.completedNPCs.length,
}))) as any;
d.report('save-survives-reload',
  afterReload.npcs === beforeReload.npcs && afterReload.rooms.length === beforeReload.rooms.length,
  `before: ${beforeReload.rooms.length} rooms/${beforeReload.npcs} npcs → after: ${afterReload.rooms.length} rooms/${afterReload.npcs} npcs`);
await d.clickThroughOverlays();

// ── Back to records_room for the Chief Compliance Officer ─────────
// The reload above re-applied ?qa-room=hospital_entrance, so jump straight
// to records via the qa param (door traversal is already covered above).
await page.goto(`${BASE}/?qa-room=records_room`);
await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30000 });
await d.waitRoom('records_room');
await page.waitForTimeout(3200);
await d.clickThroughOverlays();

const npcsBeforeBoss = (await d.qa(() => (window as any).__QA__.completedNPCs)) as string[];
console.log(`  completedNPCs before boss: ${npcsBeforeBoss.length}/25`);
const bossTalked = await d.talk('compliance_officer');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/ship-final-win.png` });
const winTitle = await page.locator('[data-testid="result-title"]').innerText().catch(() => '(none)');
const trophy = await page.locator('[data-testid="trophy-icon"]').isVisible().catch(() => false);
d.report('WIN', bossTalked && trophy && winTitle !== '(none)',
  `boss=${bossTalked} → win screen "${winTitle.replace(/\n/g, ' ')}" trophy=${trophy} (${npcsBeforeBoss.length}+1 NPCs)`);

// Win screen reads as a game, not training: thanks-for-playing + sponsor credit.
const thanks = await page.locator('[data-testid="thanks-for-playing"]').isVisible().catch(() => false);
const credit = await page.locator('[data-testid="sponsor-credit"]').innerText().catch(() => '(none)');
d.report('win-thanks-and-sponsor', thanks && !/TBD|PLACEHOLDER/i.test(credit),
  `thanks-for-playing=${thanks} credit="${credit.replace(/\n/g, ' ')}"`);

d.auditPortraits();
d.auditErrors();

const allPass = d.summarize('SHIP PLAYTHROUGH SUMMARY');
await browser.close();
process.exit(allPass ? 0 : 1);
