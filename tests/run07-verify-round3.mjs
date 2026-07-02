// Run 07 — Round 3 smoke: a malformed-but-valid-JSON save must not crash boot
// (run-02 risk #2). Unit coverage lives in client/src/lib/saveData.test.ts.
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:8080';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));

// Seed three hostile blobs in sequence; each load must reach a working screen.
const hostile = [
  ['array blob', JSON.stringify([1, 2, 3])],
  ['v1-ish blob', JSON.stringify({ version: 1, completedRooms: 'oops' })],
  ['hand-edited blob', JSON.stringify({ version: 2, completedRooms: 42, completedNPCs: 'riley', privacyScore: 'high', resolvedGates: null })],
];

let allPass = true;
for (const [name, blob] of hostile) {
  errors.length = 0;
  await page.goto(`${BASE}/`);
  await page.evaluate((b) => { localStorage.clear(); localStorage.setItem('pq:save:v2', b); }, blob);
  await page.goto(`${BASE}/?qa-room=hospital_entrance`);
  const booted = await page.waitForFunction(
    () => window.__QA__?.currentRoomId === 'hospital_entrance',
    { timeout: 20000 },
  ).then(() => true).catch(() => false);
  const pass = booted && errors.length === 0;
  allPass = allPass && pass;
  console.log(`${pass ? 'PASS' : 'FAIL'} boot with ${name} (booted=${booted}, pageerrors=${errors.length} ${errors[0] ?? ''})`);
}
await page.screenshot({ path: 'screenshots/run07/R3-malformed-save-boot.png' });
await browser.close();
process.exit(allPass ? 0 : 1);
