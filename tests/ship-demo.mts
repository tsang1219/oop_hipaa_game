/**
 * SHIP DEMO — end-to-end run of the sponsor demo path.
 * Run with: npx tsx tests/ship-demo.mts   (dev server on :8080)
 *
 * Start menu → DEMO → character select → clear the four demo rooms
 * (reception, er, break_room, records_room) → exit Medical Records →
 * CertificateOverlay: fanfare → end-NPC handoff lines → certificate card
 * with sponsor name + redemption code (must not read as a placeholder).
 *
 * Also asserts the start-menu "PRESENTED BY" sponsor credit.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { createDriver, rooms } from './helpers/ship-drive.mts';

const BASE = 'http://localhost:8080';
const OUT = 'screenshots/ship';
mkdirSync(OUT, { recursive: true });

const DEMO_ROOMS = ['reception', 'er', 'break_room', 'records_room'];
// Rooms the demo may traverse: demo rooms + entrance + hallways (+ pass-through if allowed)
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const d = createDriver(page);

// ── Start menu ────────────────────────────────────────────────────
await page.goto(`${BASE}/`);
await d.qa(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(`${BASE}/`);
await page.waitForSelector('[data-testid="start-menu-demo"]', { timeout: 20000 });
await page.waitForTimeout(1800); // staggered reveal

const presentedBy = await page.locator('[data-testid="sponsor-presented-by"]').innerText().catch(() => '(none)');
d.report('start-menu-sponsor', /PRESENTED BY/.test(presentedBy) && !/TBD|PLACEHOLDER/i.test(presentedBy),
  `footer credit: "${presentedBy.replace(/\n/g, ' ')}"`);
await page.screenshot({ path: `${OUT}/demo-01-start-menu.png` });

await page.click('[data-testid="start-menu-demo"]');
// Character select — wait for it to mount, then confirm default hero with Enter.
await page.waitForSelector('text=CHOOSE YOUR HERO', { timeout: 15000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/demo-01b-character-select.png` });
await page.keyboard.press('Enter');
await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: `${OUT}/demo-01c-after-enter.png` });
console.log('after enter:', JSON.stringify(await d.qa(() => ({
  room: (window as any).__QA__?.currentRoomId,
  scene: (window as any).__QA__?.sceneReady,
  body: document.body.innerText.slice(0, 200),
}))));
await page.waitForFunction(() => (window as any).__QA__?.currentRoomId !== null, { timeout: 30000 });
await page.waitForTimeout(3200);
await d.clickThroughOverlays();

const spawnRoom = (await d.qa(() => (window as any).__QA__.currentRoomId)) as string;
console.log(`demo spawn room: ${spawnRoom}`);

// ── Clear demo rooms, walking wherever the demo routes us ─────────
// Strategy: clear the current room if it's a demo room, then exit through a
// door and observe where we land. Track cleared demo rooms until all four are
// done and we're leaving records_room (which should fire the capstone).
const cleared = new Set<string>();
let hops = 0;
while (cleared.size < DEMO_ROOMS.length && hops < 30) {
  const roomId = (await d.qa(() => (window as any).__QA__.currentRoomId)) as string;
  if (DEMO_ROOMS.includes(roomId) && !cleared.has(roomId)) {
    await d.clearRoom(roomId);
    cleared.add(roomId);
  }
  if (cleared.size === DEMO_ROOMS.length) break;

  // Curated demo routing: ANY door out of a demo room leads to the next demo
  // room on the tour — take the first unlocked door and let the game route.
  const doors = (await d.qa(() => (window as any).__QA__.roomDoors)) as Array<{ id: string; targetRoomId: string; state: string }>;
  const unlocked = doors.filter((x) => x.state !== 'locked');
  if (!unlocked.length) {
    d.report('demo-routing', false, `dead end in ${roomId}: all doors locked (${doors.map((x) => `${x.id}:${x.state}`).join(', ')})`);
    break;
  }
  const door = unlocked[unlocked.length - 1]; // rightmost door reads as "onward"
  console.log(`  hop ${hops}: ${roomId} → ${door.id} (nominal ${door.targetRoomId})`);
  try {
    await d.goDoor(door.id);
  } catch {
    d.report('demo-routing', false, `door ${door.id} from ${roomId} did not transition`);
    break;
  }
  hops++;
}
if (cleared.size === DEMO_ROOMS.length) {
  d.report('demo-routing', true, `all four demo rooms cleared in ${hops} hops`);
}

// ── Capstone: exit records_room → certificate ─────────────────────
const inRecords = (await d.qa(() => (window as any).__QA__.currentRoomId)) === 'records_room';
if (!inRecords) {
  console.log('  not in records_room after clearing — walking back');
  // The capstone fires on exiting records_room; navigate back if needed.
  // (cleared set guarantees records already complete.)
}
const exitDoors = (await d.qa(() => (window as any).__QA__.roomDoors)) as Array<{ id: string; state: string }>;
const exitDoor = exitDoors.find((x) => x.state !== 'locked');
if (exitDoor) await d.qa((id: string) => (window as any).__QA__.commands.navigateToDoor(id), exitDoor.id);

const certUp = await page.waitForSelector('[data-testid="certificate-overlay"]', { timeout: 15000 }).then(() => true).catch(() => false);
d.report('demo-capstone-fires', certUp, certUp ? 'certificate overlay appeared on records exit' : 'no certificate overlay');

if (certUp) {
  // Advance: npc line 1 → line 2 → cert card
  await page.waitForSelector('[data-testid="cert-line-1"]', { timeout: 8000 }).catch(() => {});
  const line1 = await page.locator('[data-testid="cert-line-1"]').innerText().catch(() => '(none)');
  await page.click('[data-testid="certificate-overlay"]');
  await page.waitForTimeout(500);
  const line2 = await page.locator('[data-testid="cert-line-2"]').innerText().catch(() => '(none)');
  await page.click('[data-testid="certificate-overlay"]');
  await page.waitForSelector('[data-testid="cert-card"]', { timeout: 5000 }).catch(() => {});
  const sponsorName = await page.locator('[data-testid="cert-sponsor-name"]').innerText().catch(() => '(none)');
  const code = await page.locator('[data-testid="cert-code"]').innerText().catch(() => '(none)');
  await page.screenshot({ path: `${OUT}/demo-02-certificate.png` });
  d.report('demo-certificate-content',
    !/TBD|PLACEHOLDER/i.test(sponsorName + code) && sponsorName !== '(none)' && code !== '(none)',
    `name="${sponsorName}" code="${code}" line1="${line1.slice(0, 40)}…" line2="${line2.slice(0, 40)}…"`);

  // Return to menu closes out cleanly.
  await page.click('[data-testid="cert-return"]').catch(() => {});
  await page.waitForTimeout(2500);
  const backAtMenu = await page.locator('[data-testid="start-menu-demo"]').isVisible().catch(() => false);
  d.report('demo-cert-return', backAtMenu, backAtMenu ? 'returned to start menu' : 'did not return to start menu');
}

d.auditErrors();
const allPass = d.summarize('SHIP DEMO SUMMARY');
await browser.close();
process.exit(allPass ? 0 : 1);
