/**
 * Run 12 (living-world) — proof suite. Trusts the screen, not the code.
 *
 *  1. ANIM  — 10 seconds in a populated room with nobody touching the
 *             controls: a frame sequence + a .webm video, and a pixel-diff
 *             count of independently moving regions per frame (the motion
 *             budget), plus the game's own per-NPC blink/fidget/walk counters.
 *  2. AUD   — drive real interactions through window.__QA__ and assert the
 *             mixer's audio log shows a sound for each one (the audio map).
 *  3. FEEL  — typewriter: SPACE mid-line reveals the whole line, never skips it.
 *
 * Artifacts land in screenshots/living-world/.
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { loadRoom, pressSpace, navigateToDoor, waitForRoom, dismissDialogue, waitForDialogue, trackErrors, filterBenignErrors } from './helpers/qa-helpers';
// pngjs ships inside playwright-core's bundled utils — no extra dependency.
const requireCjs = createRequire(import.meta.url);
const { PNG } = requireCjs('playwright-core/lib/utilsBundle') as { PNG: any };

const OUT = 'screenshots/living-world';
fs.mkdirSync(OUT, { recursive: true });

// Headless Chromium suspends AudioContexts until a gesture; the proof needs
// the synthesized voices/beds to actually run, so allow autoplay here.
// (No .webm: Playwright's video recorder needs its bundled ffmpeg, which this
// machine doesn't have. The brief accepts a frame sequence — 40 frames at
// 250ms per room — plus the contact sheet built by the last test.)
test.use({
  launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
});

type Living = NonNullable<Window['__QA__']>['living'];

async function canvasBox(page: Page) {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) throw new Error('no canvas');
  return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
}

/** Count independently moving regions between two PNG buffers (16px cells). */
function motionClusters(a: Buffer, b: Buffer): { changedCells: number; clusters: number; cells: string[] } {
  const A = PNG.sync.read(a), B = PNG.sync.read(b);
  const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height);
  const CELL = 16;
  const cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL);
  const counts = new Uint32Array(cols * rows);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * A.width + x) * 4, j = (y * B.width + x) * 4;
      const d = Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]) + Math.abs(A.data[i + 2] - B.data[j + 2]);
      if (d > 60) counts[Math.floor(y / CELL) * cols + Math.floor(x / CELL)]++;
    }
  }
  const hot = new Set<number>();
  for (let c = 0; c < counts.length; c++) if (counts[c] >= 6) hot.add(c);
  // connected components over hot cells (8-neighbourhood)
  const seen = new Set<number>();
  let clusters = 0;
  for (const start of hot) {
    if (seen.has(start)) continue;
    clusters++;
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const c = stack.pop()!;
      const cx = c % cols, cy = Math.floor(c / cols);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const n = ny * cols + nx;
        if (hot.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); }
      }
    }
  }
  return { changedCells: hot.size, clusters, cells: [...hot].map(c => `${c % cols},${Math.floor(c / cols)}`) };
}

for (const roomId of ['break_room', 'reception', 'er']) {
  test(`ANIM — ${roomId} moves on its own for 10s with no input`, async ({ page }, testInfo) => {
    const errors = trackErrors(page);
    await loadRoom(page, roomId);
    await page.waitForTimeout(1200); // let the room-enter push-in + fade settle
    // Park the mouse off-canvas so hover can't nudge anything.
    await page.mouse.move(5, 5);

    const before = await page.evaluate(() => JSON.parse(JSON.stringify(window.__QA__?.living ?? null))) as Living;
    const box = await canvasBox(page);
    const dir = path.join(OUT, roomId);
    fs.mkdirSync(dir, { recursive: true });
    const frames: Buffer[] = [];
    const t0 = Date.now();
    for (let i = 0; i < 40; i++) {
      const buf = await page.screenshot({ clip: box });
      frames.push(buf);
      fs.writeFileSync(path.join(dir, `frame_${String(i).padStart(2, '0')}.png`), buf);
      const due = t0 + (i + 1) * 250;
      const wait = due - Date.now();
      if (wait > 0) await page.waitForTimeout(wait);
    }
    const after = await page.evaluate(() => JSON.parse(JSON.stringify(window.__QA__?.living ?? null))) as Living;

    const perFrame = [];
    const everHot = new Set<string>();
    for (let i = 1; i < frames.length; i++) {
      const m = motionClusters(frames[i - 1], frames[i]);
      perFrame.push({ frame: i, clusters: m.clusters, changedCells: m.changedCells });
      for (const c of m.cells) everHot.add(c);
    }
    const avgClusters = perFrame.reduce((s, f) => s + f.clusters, 0) / perFrame.length;
    const minClusters = Math.min(...perFrame.map(f => f.clusters));
    const framesWithMotion = perFrame.filter(f => f.clusters > 0).length;

    const npcDelta = (after ?? []).map(n => {
      const b = (before ?? []).find(x => x.id === n.id);
      return { id: n.id, blinks: n.blinks - (b?.blinks ?? 0), fidgets: n.fidgets - (b?.fidgets ?? 0), legs: n.legs - (b?.legs ?? 0), canWander: n.canWander, movedFromHome: n.tile.x !== n.home.x || n.tile.y !== n.home.y };
    });
    const summary = {
      roomId, seconds: 10, frames: frames.length, avgClusters: +avgClusters.toFixed(2), minClusters, framesWithMotion,
      distinctMovingCells: everHot.size, perFrame, npcs: npcDelta,
    };
    fs.writeFileSync(path.join(OUT, `${roomId}-motion.json`), JSON.stringify(summary, null, 2));
    testInfo.attach(`${roomId}-motion`, { body: JSON.stringify(summary, null, 2), contentType: 'application/json' });

    // ANIM-05 motion budget: something is mid-animation in (practically) every frame,
    // and on average at least three separate things are moving.
    expect(framesWithMotion, 'frames with any motion').toBeGreaterThanOrEqual(frames.length - 3);
    expect(avgClusters, 'average independent moving regions per frame').toBeGreaterThanOrEqual(3);
    // ANIM-01: the game's own counters — every NPC blinked at least once in 10s.
    expect(npcDelta.length).toBeGreaterThan(0);
    for (const n of npcDelta) expect(n.blinks, `${n.id} blinked`).toBeGreaterThanOrEqual(1);
    // ANIM-04: at least one fidget happened somewhere in the room.
    expect(npcDelta.reduce((s, n) => s + n.fidgets, 0), 'fidgets in room').toBeGreaterThanOrEqual(1);
    expect(filterBenignErrors(errors)).toEqual([]);
  });
}

test('contact sheet — every 4th frame of each room on one page', async ({ page }) => {
  const rooms = ['break_room', 'reception', 'er'].filter(r => fs.existsSync(path.join(OUT, r, 'frame_00.png')));
  test.skip(rooms.length === 0, 'no frames captured');
  const rowsHtml = rooms.map(r => {
    const m = fs.existsSync(path.join(OUT, `${r}-motion.json`)) ? JSON.parse(fs.readFileSync(path.join(OUT, `${r}-motion.json`), 'utf8')) : null;
    const cells = [];
    for (let i = 0; i < 40; i += 4) {
      const f = path.join(OUT, r, `frame_${String(i).padStart(2, '0')}.png`);
      if (!fs.existsSync(f)) continue;
      const b64 = fs.readFileSync(f).toString('base64');
      cells.push(`<figure><img src="data:image/png;base64,${b64}"><figcaption>t=${(i * 0.25).toFixed(2)}s</figcaption></figure>`);
    }
    const stats = m ? `avg ${m.avgClusters} moving regions/frame · ${m.framesWithMotion}/${m.frames - 1} frames with motion · NPCs: ${m.npcs.map((n: any) => `${n.id} (${n.blinks} blinks, ${n.fidgets} fidgets, ${n.legs} walks)`).join(', ')}` : '';
    return `<section><h2>${r}</h2><p>${stats}</p><div class="row">${cells.join('')}</div></section>`;
  }).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{background:#14141f;color:#e8e8f0;font:12px/1.4 system-ui;margin:16px}
    h1{font-size:18px;margin:0 0 4px} h2{font-size:14px;margin:18px 0 2px;color:#ff6b9d} p{margin:0 0 6px;color:#aab}
    .row{display:flex;gap:6px;flex-wrap:wrap} figure{margin:0} img{width:236px;image-rendering:pixelated;display:block;border:1px solid #333}
    figcaption{font-size:10px;color:#889;text-align:center}
  </style></head><body><h1>Run 12 — living world, 10 seconds, nobody touching the controls</h1>
  <p>Every 4th frame (1s apart) of each room. Numbers are from the game's own per-NPC counters + a pixel-diff cluster count between consecutive 250ms frames.</p>${rowsHtml}</body></html>`;
  const file = path.join(OUT, 'contact-sheet.html');
  fs.writeFileSync(file, html);
  await page.setViewportSize({ width: 1300, height: 900 });
  await page.goto('file://' + path.resolve(file));
  await page.screenshot({ path: path.join(OUT, 'contact-sheet.png'), fullPage: true });
});

test('ANIM-02 — NPCs actually walk: at least one wanderer leaves its tile within 30s', async ({ page }) => {
  await loadRoom(page, 'break_room');
  await page.mouse.move(5, 5);
  const moved = await page.waitForFunction(() => {
    const l = window.__QA__?.living ?? [];
    return l.some(n => n.legs > 0) ? l.filter(n => n.legs > 0).map(n => n.id) : false;
  }, null, { timeout: 30_000 }).then(h => h.jsonValue());
  expect(moved).toBeTruthy();
  const snapshot = await page.evaluate(() => window.__QA__?.living);
  // Progression-critical / desk-bound NPCs never wander; everyone else may.
  const wanderers = (snapshot ?? []).filter(n => n.canWander).map(n => n.id);
  expect(wanderers.length).toBeGreaterThan(0);
  await page.close();
});

test('ANIM-03 — an NPC turns to face you when you walk up', async ({ page }) => {
  await loadRoom(page, 'reception');
  // Riley stands at (10,4). Approach from the left: Riley should face left.
  await page.evaluate(() => window.__QA__!.commands.teleportTo(9, 4));
  await page.waitForTimeout(400);
  const facingLeft = await page.evaluate(() => window.__QA__?.living?.find(n => n.id === 'riley')?.facing);
  expect(facingLeft).toBe('left');
  await page.evaluate(() => window.__QA__!.commands.teleportTo(11, 4));
  await page.waitForTimeout(400);
  const facingRight = await page.evaluate(() => window.__QA__?.living?.find(n => n.id === 'riley')?.facing);
  expect(facingRight).toBe('right');
  await page.close();
});

test('AUD — the audio map: interactions produce sounds through the mixer', async ({ page }) => {
  const errors = trackErrors(page);
  await loadRoom(page, 'reception');
  const keysAfter = async (fn: () => Promise<void>) => {
    const start = await page.evaluate(() => window.__QA__?.audioLog?.length ?? 0);
    await fn();
    return page.evaluate((s) => (window.__QA__?.audioLog ?? []).slice(s).map(e => e.key), start);
  };
  // Room bed is running under the music
  const ambience = await page.evaluate(() => window.__QA__?.ambience);
  expect(ambience?.running, 'ambience bed running').toBe(true);
  expect((ambience?.layers ?? []).length).toBeGreaterThan(0);

  // Walking → material footsteps (reception = tile family)
  const steps = await keysAfter(async () => {
    await page.evaluate(() => window.__QA__!.commands.movePlayerTo(6, 7));
    await page.waitForTimeout(1500);
  });
  expect(steps.some(k => k.startsWith('sfx_step_')), `footsteps in ${steps.join(',')}`).toBe(true);
  const stepKeys = steps.filter(k => k.startsWith('sfx_step_'));
  // round-robin: consecutive steps never repeat the same variant
  for (let i = 1; i < stepKeys.length; i++) expect(stepKeys[i]).not.toBe(stepKeys[i - 1]);

  // Talking to an NPC → interact cue + discovery stinger + voice syllables
  const talk = await keysAfter(async () => {
    await page.evaluate(() => window.__QA__!.commands.teleportTo(10, 5));
    await page.waitForTimeout(400);
    await pressSpace(page);
    await waitForDialogue(page);
    await page.waitForTimeout(1500); // let the typewriter run
  });
  expect(talk).toContain('sfx_interact');
  expect(talk).toContain('sfx_stinger_discovery');
  expect(talk.some(k => k.startsWith('voice:')), `voice blips in ${talk.join(',')}`).toBe(true);
  await dismissDialogue(page);
  await page.waitForFunction(() => !window.__QA__?.paused, { timeout: 5000 }).catch(() => {});

  // Going through a door → the leaf swings with a door sound (the lobby door
  // is the one that's unlocked on a fresh save; the hallway needs reception done)
  const door = await keysAfter(async () => {
    await navigateToDoor(page, 'reception_to_entrance');
    await waitForRoom(page, 'hospital_entrance');
  });
  expect(door.some(k => k.startsWith('sfx_door_open_')), `door open in ${door.join(',')}`).toBe(true);
  expect(door).toContain('sfx_room_enter');

  // AUD-03 — the brief's test walk: reception (tile) → hallway (lino) → break room (carpet)
  // are three different sample families. Rooms load directly so locks don't gate the proof.
  await loadRoom(page, 'hallway_reception_break');
  const hallSteps = await keysAfter(async () => {
    await page.evaluate(() => window.__QA__!.commands.movePlayerTo(10, 3));
    await page.waitForTimeout(1500);
  });
  expect(hallSteps.some(k => k.startsWith('sfx_step_wood_')), `lino steps in ${hallSteps.join(',')}`).toBe(true);
  const hallBed = await page.evaluate(() => window.__QA__?.ambience);
  expect(hallBed?.roomId).toBe('hallway_reception_break');
  await loadRoom(page, 'break_room');
  const carpetSteps = await keysAfter(async () => {
    // break_room spawns at (10,12); walk along the free bottom row
    await page.evaluate(() => window.__QA__!.commands.movePlayerTo(5, 12));
    await page.waitForTimeout(1500);
  });
  expect(carpetSteps.some(k => k.startsWith('sfx_step_carpet_')), `carpet steps in ${carpetSteps.join(',')}`).toBe(true);
  const breakBed = await page.evaluate(() => window.__QA__?.ambience);
  expect(breakBed?.layers).toContain('fridge');

  const map = await page.evaluate(() => window.__QA__?.audioLog ?? []);
  fs.writeFileSync(path.join(OUT, 'audio-log-sample.json'), JSON.stringify(map, null, 2));
  expect(filterBenignErrors(errors)).toEqual([]);
  await page.close();
});

test('FEEL-21 — SPACE mid-typewriter reveals the full line, never skips it', async ({ page }) => {
  await loadRoom(page, 'reception');
  await page.evaluate(() => window.__QA__!.commands.teleportTo(10, 5));
  await page.waitForTimeout(300);
  await pressSpace(page);
  await waitForDialogue(page);
  const container = page.locator('[data-testid="container-battle-dialogue"]');
  await expect(container).toBeVisible();
  // Mid-type: the visible text is shorter than the line
  await page.waitForTimeout(200);
  const partial = (await container.innerText()).length;
  await page.keyboard.press('Space');
  await page.waitForTimeout(60);
  const revealed = await container.innerText();
  expect(revealed.length).toBeGreaterThan(partial);
  // Still the same line, on screen, with the "continue" affordance — not skipped.
  await expect(container).toBeVisible();
  expect(revealed).toContain('continue');
  await page.close();
});
