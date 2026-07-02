// Run 07 — Round 1c: F-04 headline — the ending is reachable.
// Seed a save with the other 25 NPCs complete, talk to the Chief Compliance
// Officer once, expect the win screen.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:8080';
const OUT = 'screenshots/run07';
mkdirSync(OUT, { recursive: true });

const ALL_NPCS = ["riley_entrance","aiyana_intake","riley","nervous_patient","chatty_visitor","dr_martinez","officer","frantic_family","priya_privacy_officer","lab_tech","marcus_lab_aide","researcher","courier","records_clerk","patient_request","attorney","dr_tovar","security_analyst","vendor","workaround_employee","gossiping_coworker","friend_fishing","tired_employee","hr_director","selfie_coworker"]; // 25 — everyone but compliance_officer

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
page.on('pageerror', (e) => console.log('[pageerror]', (e.stack || e.message).slice(0, 400)));
page.on('console', (m) => { if (m.text().includes('WIN CHECK')) console.log('>>', m.text()); });

const qa = (fn, ...args) => page.evaluate(fn, ...args);
const teleport = async (x, y) => { await qa(([a, b]) => window.__QA__.commands.teleportTo(a, b), [x, y]); await page.waitForTimeout(400); };
const pressSpace = async () => { await qa(() => window.__QA__.commands.pressSpace()); await page.waitForTimeout(400); };

await page.goto(`${BASE}/`);
await qa((npcs) => {
  localStorage.clear();
  localStorage.setItem('pq:save:v2', JSON.stringify({
    version: 2,
    completedRooms: ['hospital_entrance','reception','break_room','lab','records_room','it_office','er'],
    collectedStories: [],
    completedNPCs: npcs,
    completedZones: ['sign_in_sheet','privacy_notice','overheard_conversation','unlocked_phone','sample_labels','results_printout','unlocked_cabinet','audit_log','shredder','password_note','breach_playbook','fax_machine','vendor_agreement','whiteboard','unlocked_computer','welcome_board'],
    collectedItems: ['hipaa_brochure','patient_rights_poster','verbal_disclosure','phi_identifiers','minimum_necessary_manual','hipaa_penalties','security_safeguards','emergency_exceptions'],
    privacyScore: 88, finalPrivacyScore: 88,
    resolvedGates: { records_room: ['patient_choice'], break_room: ['social_gossip'], lab: [], er: [] },
    unlockedNpcs: { records_room: ['patient_request','attorney'], break_room: ['gossiping_coworker'] },
    npcPulsedRooms: [], gameStartTime: Date.now(), onboardingSeen: true, sfxMuted: false, musicVolume: 0.6,
    currentRoomId: 'records_room', currentAct: 3, act1Complete: true, act2Complete: true,
    actFlags: {}, decisions: { helpedPatientFirst: true },
    encounterResults: {
      'phi-sort-reception': { completed: true, score: 9, outcome: 'victory' },
      'phi-sort-lab': { completed: true, score: 9, outcome: 'victory' },
      'phi-sort-records': { completed: true, score: 9, outcome: 'victory' },
      'breach-triage-er': { completed: true, score: 15, outcome: 'victory' },
      'td-it-office': { completed: true, score: 80, outcome: 'victory' },
    },
    unifiedScore: 130,
  }));
}, ALL_NPCS);

await page.goto(`${BASE}/?qa-room=records_room`);
await page.waitForFunction(() => window.__QA__?.currentRoomId === 'records_room', { timeout: 20000 });
await page.waitForTimeout(1500);

// CCO at (8,12) — probe adjacent tiles. Physics can eject a teleport out of a
// blocked tile over a few frames, so settle 700ms and require TWO consecutive
// stable reads of position + nearby before pressing SPACE.
let reached = false;
for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]]) {
  await teleport(8 + dx, 12 + dy);
  await page.waitForTimeout(700);
  const read1 = await qa(() => ({ nearby: window.__QA__.nearbyInteractable, pos: window.__QA__.playerPosition }));
  await page.waitForTimeout(300);
  const read2 = await qa(() => ({ nearby: window.__QA__.nearbyInteractable, pos: window.__QA__.playerPosition }));
  const stable = JSON.stringify(read1) === JSON.stringify(read2);
  console.log(`probe (${8 + dx},${12 + dy}): pos=${JSON.stringify(read2.pos)} nearby=${JSON.stringify(read2.nearby)} stable=${stable}`);
  if (stable && read2.nearby && read2.nearby.id === 'compliance_officer') { await pressSpace(); reached = true; break; }
}
console.log('reached CCO:', reached);
await page.waitForSelector('[data-testid="dialogue-overlay"]', { timeout: 5000 }).catch(() => {});

// click through the boss dialogue
for (let i = 0; i < 30; i++) {
  const dlg = await page.locator('[data-testid="dialogue-overlay"]').isVisible().catch(() => false);
  if (!dlg) { console.log(`iter ${i}: dialogue gone`); break; }
  const visible = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid="dialogue-overlay"] button, [data-testid="dialogue-overlay"] [data-testid]'))
      .filter(e => (e instanceof HTMLElement) && e.offsetParent !== null)
      .map(e => e.getAttribute('data-testid') || e.tagName)
      .slice(0, 8),
  );
  console.log(`iter ${i}:`, JSON.stringify(visible));
  const next = page.locator('[data-testid="button-next-scene"]');
  if (await next.isVisible().catch(() => false)) { await next.click(); await page.waitForTimeout(500); continue; }
  const choice = page.locator('[data-testid="choice-button-1"]');
  if (await choice.isVisible().catch(() => false)) { await choice.click(); await page.waitForTimeout(500); continue; }
  const cont = page.locator('[data-testid="container-battle-dialogue"]');
  if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForTimeout(600); continue; }
  await page.waitForTimeout(300);
}
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/F04-win-screen.png` });
const winVisible = await page.locator('[data-testid="result-title"]').isVisible().catch(() => false);
const winText = winVisible ? await page.locator('[data-testid="result-title"]').innerText() : '(none)';
const trophy = await page.locator('[data-testid="trophy-icon"]').isVisible().catch(() => false);
const pass = reached && winVisible && trophy;
console.log(`${pass ? 'PASS' : 'FAIL'} F-04b — win screen after final boss with all 26 scenarios (title="${winText}", trophy=${trophy})`);
await browser.close();
process.exit(pass ? 0 : 1);
