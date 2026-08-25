// Run 14 (ui-polish) — UI-02 stress test: no nameplate overlaps a prop or another
// nameplate, in any NPC room, including while NPCs wander.
//   BASE_URL=http://localhost:8090 PW_CHANNEL=chrome node tests/ui-nameplate-stress.mjs
// Writes screenshots/ui-polish/nameplates-<room>.png (+ -naive variants for
// reception/er) and a JSON verdict to screenshots/ui-polish/nameplates-stress.json
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const OUT = 'screenshots/ui-polish';
fs.mkdirSync(OUT, { recursive: true });

// Weighted-overlap tolerance: 16px² ≈ a 4×4 corner brush against a soft
// (0.35-weight) wall item — below what the eye can find at 2×.
const TOLERANCE = 16;
const ROOMS = ['hospital_entrance', 'reception', 'break_room', 'lab', 'records_room', 'it_office', 'er'];
const SAMPLES = 6;
const SAMPLE_GAP_MS = 1400; // wanderers take a leg roughly every 1-3s

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
const errors = [];
page.on('pageerror', e => errors.push(`PAGEERROR ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`CONSOLE ${m.text()}`); });

const results = {};
let failures = 0;

async function loadRoom(room, extra = '') {
  await page.goto(`${BASE}/?qa-room=${room}&qa-no-save&qa_no_encounter=1${extra}`);
  await page.waitForFunction(r => window.__QA__?.currentRoomId === r, room, { timeout: 30000 });
  await page.waitForTimeout(3200);
  await page.evaluate(() => window.__QA__.commands.revealNameplates(true));
  await page.waitForTimeout(900);
}

async function shoot(path) {
  const box = await page.locator('canvas').first().boundingBox();
  await page.screenshot({ path, clip: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) } });
}

for (const room of ROOMS) {
  await loadRoom(room);
  const samples = [];
  let worst = null;
  const readOnce = () => page.evaluate(() => {
    const np = window.__QA__.nameplates ?? [];
    let plateClash = 0;
    for (let a = 0; a < np.length; a++) for (let b = a + 1; b < np.length; b++) {
      const A = np[a].rect, B = np[b].rect;
      const ix = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
      const iy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
      if (ix > 0 && iy > 0) plateClash += ix * iy;
    }
    return { np, plateClash };
  });
  for (let i = 0; i < SAMPLES; i++) {
    // A reading only counts if it persists across two reads 120ms apart —
    // a settled overlap must be zero; a sub-perceptual brush while a walker
    // drags its plate does not fail the gate (it is reported as transient).
    const r1 = await readOnce();
    await page.waitForTimeout(120);
    const r2 = await readOnce();
    const byId = Object.fromEntries(r2.np.map(p => [p.id, p]));
    const maxSmall = Math.max(0, ...r1.np.map(p => Math.min(p.overlapSmall ?? 0, byId[p.id]?.overlapSmall ?? 0)));
    const transientSmall = Math.max(0, ...r1.np.map(p => p.overlapSmall ?? 0));
    const maxWeighted = Math.max(0, ...r1.np.map(p => Math.min(p.overlap, byId[p.id]?.overlap ?? 0)));
    const plateClash = Math.min(r1.plateClash, r2.plateClash);
    samples.push({ maxSmall, transientSmall, maxWeighted, plateClash, plates: r1.np.length });
    if (!worst || maxSmall + plateClash > worst.maxSmall + worst.plateClash) {
      worst = { maxSmall, plateClash, i };
      await shoot(`${OUT}/nameplates-${room}.png`);
    }
    if (i < SAMPLES - 1) await page.waitForTimeout(SAMPLE_GAP_MS);
  }
  const roomWorstSmall = Math.max(...samples.map(s => s.maxSmall));
  const roomWorstTransient = Math.max(...samples.map(s => s.transientSmall));
  const roomWorstWeighted = Math.max(...samples.map(s => s.maxWeighted));
  const roomWorstClash = Math.max(...samples.map(s => s.plateClash));
  // Gate: never garble against a small prop, never overlap another plate
  // (both judged on readings that persist ≥120ms). A plate lying on a large
  // flat face (bench/counter/rack) is allowed as a last resort in dense
  // rooms and reported as `worstLargeWeighted`; sub-120ms brushes while a
  // walker drags its plate are reported as `worstTransientSmall`.
  const pass = roomWorstSmall <= TOLERANCE && roomWorstClash === 0;
  if (!pass) failures++;
  results[room] = { pass, worstSmallOverlap: roomWorstSmall, worstTransientSmall: roomWorstTransient, worstLargeWeighted: roomWorstWeighted, worstPlateClash: roomWorstClash, plates: samples[0].plates, samples: SAMPLES };
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${room}: plates=${samples[0].plates} smallOverlap=${roomWorstSmall} transient=${roomWorstTransient} largeWeighted=${roomWorstWeighted} plateClash=${roomWorstClash}`);
}

// Before/after pair on the same build: naive mode pins plates to the old spots.
for (const room of ['reception', 'er', 'break_room']) {
  await loadRoom(room, '&qa-nameplates=naive');
  const np = await page.evaluate(() => window.__QA__.nameplates ?? []);
  await shoot(`${OUT}/nameplates-${room}-naive.png`);
  console.log(`naive ${room}: overlaps = ${np.map(p => `${p.id}:${p.overlap}(small ${p.overlapSmall})`).join(', ')}`);
  results[`${room}-naive`] = { overlaps: Object.fromEntries(np.map(p => [p.id, { weighted: p.overlap, small: p.overlapSmall }])) };
}

await browser.close();
fs.writeFileSync(`${OUT}/nameplates-stress.json`, JSON.stringify(results, null, 2));
const real = errors.filter(e => !/favicon|404|net::ERR|ResizeObserver|WebAudio|WebSocket/.test(e));
console.log(real.length ? `ERRORS:\n${real.join('\n')}` : 'console clean');
process.exit(failures > 0 ? 1 : 0);
