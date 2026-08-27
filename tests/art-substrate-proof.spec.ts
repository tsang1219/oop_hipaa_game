/**
 * Run 11 (art-substrate) — proof suite, all 13 rooms. Trusts the screen, not the code.
 *
 *  1. ATLAS  — the room renders from the LimeZu atlas: __QA__.art reports no
 *              missing frames, exactly one atlas image request, zero console errors.
 *  2. DEPTH  — up to three y-positions around a tall prop: the player's depth is below
 *              the prop's when standing behind it, equal beside it, above it in front
 *              (ART-07), with a screenshot of each.
 *  3. LIGHT  — the lighting layer toggles off through the QA bridge and the room's
 *              edges measurably brighten (ART-06).
 *  4. DOORS  — every door is a LimeZu door from the same atlas, standing on its wall
 *              (side doors on the wall line, the back-wall door on the floor line, the
 *              closet exit in the bottom wall); the unfound hidden door is still a seam.
 *              Walking up to an unlocked door cracks it to frame 1 (openness 0.72); SPACE
 *              swings it to frame 4 before the fade and the target room loads. A locked
 *              door stays on frame 0 and the room does not change.
 *
 * Artifacts land in screenshots/art-substrate/. ART_ROOM=<id> limits the run to one room.
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import { createRequire } from 'module';
import { trackErrors, filterBenignErrors } from './helpers/qa-helpers';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle') as { PNG: any };

const OUT = 'screenshots/art-substrate';
fs.mkdirSync(OUT, { recursive: true });

type Rel = 'behind' | 'beside' | 'front';
type DepthCase = { prop: [string, number, number]; at: [number, number]; rel: Rel };
/** Per room: a tall prop and where the player stands relative to it (tile coords). */
const DEPTH_CASES: Record<string, DepthCase[]> = {
  hospital_entrance: [
    { prop: ['info_kiosk', 16, 3], at: [16, 2], rel: 'behind' }, { prop: ['info_kiosk', 16, 3], at: [15, 4], rel: 'beside' }, { prop: ['info_kiosk', 16, 3], at: [17, 5], rel: 'front' },
  ],
  reception: [
    { prop: ['water_dispenser', 17, 12], at: [17, 11], rel: 'behind' }, { prop: ['water_dispenser', 17, 12], at: [16, 12], rel: 'beside' }, { prop: ['water_dispenser', 17, 12], at: [17, 13], rel: 'front' },
    { prop: ['trash_can', 6, 3], at: [6, 2], rel: 'behind' }, { prop: ['trash_can', 6, 3], at: [5, 3], rel: 'beside' }, { prop: ['trash_can', 6, 3], at: [6, 4], rel: 'front' },
  ],
  // plant moved (10,2)→(9,2) in the room-clean pass (foliage clears the re-hung board)
  hallway_reception_break: [{ prop: ['vending_machine', 12, 5], at: [12, 4], rel: 'behind' }, { prop: ['vending_machine', 12, 5], at: [11, 5], rel: 'beside' }, { prop: ['plant', 9, 2], at: [9, 3], rel: 'front' }],
  hallway_break_lab: [{ prop: ['bench', 9, 5], at: [9, 4], rel: 'behind' }, { prop: ['bench', 9, 5], at: [8, 5], rel: 'beside' }, { prop: ['plant', 6, 2], at: [6, 3], rel: 'front' }],
  hallway_lab_records: [{ prop: ['filing_cart', 12, 5], at: [12, 4], rel: 'behind' }, { prop: ['filing_cart', 12, 5], at: [11, 5], rel: 'beside' }, { prop: ['plant', 10, 2], at: [10, 3], rel: 'front' }],
  hallway_records_it: [{ prop: ['server_rack', 15, 5], at: [15, 4], rel: 'behind' }, { prop: ['server_rack', 15, 5], at: [14, 5], rel: 'beside' }, { prop: ['plant', 7, 2], at: [7, 3], rel: 'front' }],
  hallway_it_er: [{ prop: ['wheelchair', 10, 5], at: [10, 4], rel: 'behind' }, { prop: ['wheelchair', 10, 5], at: [9, 5], rel: 'beside' }, { prop: ['plant', 14, 2], at: [14, 3], rel: 'front' }],
  supply_closet: [{ prop: ['plant', 8, 6], at: [8, 5], rel: 'behind' }, { prop: ['plant', 8, 6], at: [7, 6], rel: 'beside' }, { prop: ['archive_box', 7, 2], at: [7, 3], rel: 'front' }],
  lab: [{ prop: ['specimen_fridge', 2, 10], at: [2, 9], rel: 'behind' }, { prop: ['specimen_fridge', 2, 10], at: [4, 11], rel: 'beside' }, { prop: ['specimen_fridge', 2, 10], at: [2, 12], rel: 'front' }],
  records_room: [{ prop: ['document_cart', 6, 11], at: [6, 10], rel: 'behind' }, { prop: ['document_cart', 6, 11], at: [5, 11], rel: 'beside' }, { prop: ['document_cart', 6, 11], at: [6, 12], rel: 'front' }],
  it_office: [{ prop: ['whiteboard_wall', 2, 10], at: [2, 9], rel: 'behind' }, { prop: ['whiteboard_wall', 2, 10], at: [1, 10], rel: 'beside' }, { prop: ['whiteboard_wall', 2, 10], at: [3, 11], rel: 'front' }],
  er: [{ prop: ['crash_cart', 13, 11], at: [13, 10], rel: 'behind' }, { prop: ['crash_cart', 13, 11], at: [15, 11], rel: 'beside' }, { prop: ['crash_cart', 13, 11], at: [13, 12], rel: 'front' }],
  break_room: [{ prop: ['trash_bin', 13, 6], at: [13, 5], rel: 'behind' }, { prop: ['trash_bin', 13, 6], at: [14, 7], rel: 'beside' }, { prop: ['trash_bin', 13, 6], at: [13, 8], rel: 'front' }],
};
const ROOMS = process.env.ART_ROOM ? [process.env.ART_ROOM] : Object.keys(DEPTH_CASES);

test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });

async function boot(page: Page, room: string) {
  await page.goto(`/?qa-room=${room}&qa-no-save&qa_no_encounter=1`);
  await page.waitForFunction(r => window.__QA__?.currentRoomId === r, room, { timeout: 30_000 });
  await page.waitForTimeout(3200); // fade-in + room banner
  // click through any scenario prompt / dialogue that opens on entry (records_room)
  for (let i = 0; i < 12; i++) {
    const sel = await page.evaluate(() => {
      for (const s of ['[data-testid="button-choice-0"]', '[data-testid="choice-button-1"]', '[data-testid="button-next-scene"]', '[data-testid="button-close-modal"]', '[data-testid="container-battle-dialogue"]', '[data-testid="observation-hint-overlay"]']) {
        const el = document.querySelector(s); if (el && el.getClientRects().length > 0) return s;
      }
      return null;
    });
    if (!sel) break;
    await page.locator(sel).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
  }
}

/**
 * The door proof wants both a door you can use and, where the story locks one, a locked
 * door in the same room. Seeding "everything before the previous department" gives
 * exactly that: the way back is open, the way forward is locked (the lobby, the closet
 * and the ER have no forward door — they only prove the swing).
 */
const UNLOCK_ORDER = ['hospital_entrance', 'reception', 'break_room', 'lab', 'records_room', 'it_office', 'er'];
const HALLWAY_FROM: Record<string, string> = {
  hallway_reception_break: 'reception', hallway_break_lab: 'break_room', hallway_lab_records: 'lab',
  hallway_records_it: 'records_room', hallway_it_er: 'it_office',
};
function doorSeed(room: string): string[] {
  if (room === 'hospital_entrance') return ['hospital_entrance'];
  if (room === 'supply_closet') return ['hospital_entrance', 'reception'];
  if (HALLWAY_FROM[room]) return UNLOCK_ORDER.slice(0, UNLOCK_ORDER.indexOf(HALLWAY_FROM[room]));
  return UNLOCK_ORDER.slice(0, Math.max(0, UNLOCK_ORDER.indexOf(room) - 1));
}

/** Like boot(), but with a v2 save seeded first (qa-no-save would wipe it on load). */
async function bootSeeded(page: Page, room: string, completedRooms: string[]) {
  await page.goto(`/?qa-room=${room}&qa-no-save&qa_no_encounter=1`);
  await page.evaluate((completed) => {
    localStorage.removeItem('pq:whimsy:closetfound');
    localStorage.setItem('pq:save:v2', JSON.stringify({ version: 2, completedRooms: completed, collectedStories: [], completedNPCs: [], completedZones: [], collectedItems: [], privacyScore: 100, finalPrivacyScore: 100, resolvedGates: {}, unlockedNpcs: {}, npcPulsedRooms: [], gameStartTime: Date.now() }));
  }, completedRooms);
  await page.goto(`/?qa-room=${room}&qa_no_encounter=1`);
  await page.waitForFunction(r => window.__QA__?.currentRoomId === r, room, { timeout: 30_000 });
  await page.waitForTimeout(3200);
  for (let i = 0; i < 12; i++) {
    const sel = await page.evaluate(() => {
      for (const s of ['[data-testid="button-choice-0"]', '[data-testid="choice-button-1"]', '[data-testid="button-next-scene"]', '[data-testid="button-close-modal"]', '[data-testid="container-battle-dialogue"]', '[data-testid="observation-hint-overlay"]']) {
        const el = document.querySelector(s); if (el && el.getClientRects().length > 0) return s;
      }
      return null;
    });
    if (!sel) break;
    await page.locator(sel).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
  }
}

async function canvasClip(page: Page) {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) throw new Error('no canvas');
  return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
}

async function shoot(page: Page, name: string): Promise<Buffer> {
  return page.screenshot({ path: `${OUT}/${name}.png`, clip: await canvasClip(page) });
}

function meanLuma(buf: Buffer, x0: number, y0: number, w: number, h: number): number {
  const png = PNG.sync.read(buf);
  let sum = 0, n = 0;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const i = (y * png.width + x) * 4;
    sum += 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2]; n++;
  }
  return sum / n;
}

// Run 11 (doors): the one back-wall door in the game, once found — and the way back out.
// This is also the regression pin for the two-row wall: the doorway's floor edge is row 2,
// so proximity, the QA navigator and the spawn-from-door all have to count wall rows.
if (!process.env.ART_ROOM || process.env.ART_ROOM === 'hallway_break_lab') {
  test('hallway_break_lab → supply_closet → back: the found closet door is a big door in the face, the exit a door in the bottom wall', async ({ page }) => {
    const errors = trackErrors(page);
    await bootSeeded(page, 'hallway_break_lab', ['hospital_entrance', 'reception', 'break_room']);
    // found → the seam becomes a door (bootSeeded clears the flag; set it and reload)
    await page.evaluate(() => localStorage.setItem('pq:whimsy:closetfound', '1'));
    await page.goto('/?qa-room=hallway_break_lab&qa_no_encounter=1');
    await page.waitForFunction(() => window.__QA__?.currentRoomId === 'hallway_break_lab', null, { timeout: 30_000 });
    await page.waitForTimeout(3200);
    const door = (await page.evaluate(() => (window.__QA__!.doors ?? []).find(d => d.id === 'hallway_breaklab_to_closet')))!;
    expect(door).toMatchObject({ kind: 'face', frame: 'door.face.0', x: 8 * 32, y: 2 * 32, depth: 2, openness: 1 });
    // row 2 is the first floor row under the two-row face — it must count as "at the door"
    await page.evaluate(() => window.__QA__!.commands.teleportTo(8, 2));
    await page.waitForTimeout(450);
    expect(await page.evaluate(() => window.__QA__!.nearDoor?.id)).toBe('hallway_breaklab_to_closet');
    expect((await page.evaluate(() => (window.__QA__!.doors ?? []).find(d => d.id === 'hallway_breaklab_to_closet')!.frame))).toBe('door.face.1');
    await page.evaluate(() => window.__QA__!.commands.pressSpace());
    await page.waitForFunction(() => /\.4$/.test((window.__QA__!.doors ?? []).find(d => d.id === 'hallway_breaklab_to_closet')?.frame ?? ''), null, { timeout: 1500 });
    await page.waitForFunction(() => window.__QA__?.currentRoomId === 'supply_closet', null, { timeout: 15_000 });
    await page.waitForTimeout(2500);
    // spawned just inside the bottom door, which is the same big door standing in the wall gap
    expect(await page.evaluate(() => window.__QA__!.playerPosition)).toEqual({ tileX: 5, tileY: 6 });
    const exit = (await page.evaluate(() => (window.__QA__!.doors ?? []).find(d => d.id === 'closet_to_hallway')))!;
    expect(exit).toMatchObject({ kind: 'face', x: 5 * 32, y: 8 * 32, depth: 11.5 });
    expect(exit.frame, 'ajar — we are standing at it').toBe('door.face.1');
    await page.evaluate(() => window.__QA__!.commands.pressSpace());
    await page.waitForFunction(() => window.__QA__?.currentRoomId === 'hallway_break_lab', null, { timeout: 15_000 });
    await page.waitForTimeout(2500);
    // back in the hallway, on the floor row under the door — not inside the wall
    expect(await page.evaluate(() => window.__QA__!.playerPosition)).toEqual({ tileX: 8, tileY: 2 });
    expect(filterBenignErrors(errors)).toEqual([]);
  });
}

for (const ROOM of ROOMS) {
  test(`${ROOM}: renders from the atlas — no missing frames, one atlas request, zero console errors`, async ({ page }) => {
    const errors = trackErrors(page);
    await boot(page, ROOM);
    const art = await page.evaluate(() => window.__QA__?.art ?? null);
    expect(art, '__QA__.art should be published by the atlas renderer').not.toBeNull();
    expect(art!.roomId).toBe(ROOM);
    expect(art!.atlas).toBe('interiors');
    expect(art!.missing).toEqual([]);
    expect(art!.wallRows).toBe(2);
    expect(art!.props.length).toBeGreaterThan(3);
    const pngs = await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name).filter(n => /\.png$/.test(n)));
    expect(pngs.filter(n => n.includes('/atlas/interiors.png')).length, 'exactly one atlas image').toBe(1);
    expect(pngs.filter(n => n.includes('/privacyquest/') && !n.includes('/atlas/') && !n.includes('/characters/')), 'no per-prop image requests').toEqual([]);
    expect(filterBenignErrors(errors)).toEqual([]);
    fs.writeFileSync(`${OUT}/${ROOM}-art-snapshot.json`, JSON.stringify({ ...art, imageRequests: pngs.length }, null, 1));
  });

  test(`${ROOM}: y-sorted depth — behind / beside / in front of a tall prop`, async ({ page }) => {
    await boot(page, ROOM);
    const art = (await page.evaluate(() => window.__QA__!.art!))!;
    const propDepth = (type: string, x: number, y: number) => {
      const ps = art.props.filter(q => q.type === type && q.x === x && q.y === y && q.anchor === 'floor');
      if (!ps.length) throw new Error(`prop ${type}@${x},${y} missing from snapshot`);
      return Math.max(...ps.map(p => p.depth)); // multi-part props: the front-most part
    };
    const results: Array<Record<string, unknown>> = [];
    for (const c of DEPTH_CASES[ROOM]) {
      await page.evaluate(([x, y]) => window.__QA__!.commands.teleportTo(x, y), c.at);
      await page.waitForTimeout(450);
      const playerDepth = await page.evaluate(() => (window as unknown as { __QA_SCENE__?: { player?: { depth: number } } }).__QA_SCENE__?.player?.depth ?? -1);
      const pd = propDepth(...c.prop);
      if (c.rel === 'behind') expect(playerDepth, `${c.prop[0]} behind`).toBeLessThan(pd);
      if (c.rel === 'front') expect(playerDepth, `${c.prop[0]} front`).toBeGreaterThan(pd);
      if (c.rel === 'beside') expect(playerDepth, `${c.prop[0]} beside`).toBe(pd);
      await shoot(page, `${ROOM}-depth-${c.prop[0]}-${c.rel}`);
      results.push({ prop: c.prop.join('@'), playerTile: c.at, rel: c.rel, playerDepth, propDepth: pd });
    }
    fs.writeFileSync(`${OUT}/${ROOM}-depth.json`, JSON.stringify(results, null, 1));
  });

  test(`${ROOM}: doors come from the atlas, sit on the wall, crack ajar on approach and swing open on SPACE`, async ({ page }) => {
    const errors = trackErrors(page);
    await bootSeeded(page, ROOM, doorSeed(ROOM));
    const TILE = 32;
    const roomDoors = await page.evaluate(() => (window.__QA__!.roomDoors ?? []).map(d => ({ ...d })));
    const wallRows = (await page.evaluate(() => window.__QA__!.art!.wallRows))!;
    const sides: Record<string, string> = Object.fromEntries(await page.evaluate(() => ((window as unknown as { __QA_SCENE__?: { room?: { doors?: Array<{ id: string; side: string; hidden?: boolean }> } } }).__QA_SCENE__?.room?.doors ?? []).map(d => [d.id, d.side + (d.hidden ? ':hidden' : '')])));
    // hallways spawn you beside a door, which is then (correctly) already ajar — step to the
    // middle of the room and let every leaf settle before reading the resting state
    const size = (await page.evaluate(() => { const r = (window as unknown as { __QA_SCENE__?: { room?: { width: number; height: number } } }).__QA_SCENE__?.room; return r ? [r.width, r.height] : [20, 15]; }))!;
    await page.evaluate(([x, y]) => window.__QA__!.commands.teleportTo(x, y), [Math.floor(size[0] / 2), Math.floor(size[1] / 2)]);
    await page.waitForTimeout(500);
    const snap = (await page.evaluate(() => window.__QA__!.doors ?? []))!;
    expect(snap.length, 'one snapshot entry per door').toBe(roomDoors.length);
    const log: Array<Record<string, unknown>> = [];
    for (const d of roomDoors) {
      const s = snap.find(q => q.id === d.id)!;
      expect(s, `snapshot for ${d.id}`).toBeTruthy();
      const [side, hidden] = sides[d.id].split(':');
      if (hidden) {
        // the closet-found flag is cleared by bootSeeded → a seam, no door art
        expect(s.kind, `${d.id} stays a seam until found`).toBe('seam');
        expect(s.frame).toBeNull();
        log.push({ id: d.id, side, kind: s.kind, state: s.state });
        continue;
      }
      expect(s.frame, `${d.id} renders from the atlas`).toMatch(/^door\.(side\.[lr]|face)\.0$/);
      // anchor: bottom-left of the frame on the wall (see art/doorArt.ts)
      const want = side === 'left' ? { kind: 'side-left', x: d.x * TILE + 3, y: (d.y + 1) * TILE }
        : side === 'right' ? { kind: 'side-right', x: d.x * TILE - 35, y: (d.y + 1) * TILE }
        : side === 'top' ? { kind: 'face', x: d.x * TILE, y: wallRows * TILE }
        : { kind: 'face', x: d.x * TILE, y: (d.y + 1) * TILE };
      expect({ kind: s.kind, x: s.x, y: s.y }, `${d.id} anchor`).toEqual(want);
      // y-sorted with the cast (side/bottom) or inside the face behind everything (top)
      expect(s.depth).toBe(side === 'top' ? 2 : 5 + d.y - 0.5);
      expect(s.openness).toBe(1);
      log.push({ id: d.id, side, kind: s.kind, state: s.state, frame: s.frame, x: s.x, y: s.y, depth: s.depth });
    }
    // approach the first door we can use; a locked one must stay shut
    const byId = (id: string) => page.evaluate(i => (window.__QA__!.doors ?? []).find(q => q.id === i) ?? null, id);
    const adjacent = (d: { x: number; y: number }, side: string): [number, number] =>
      side === 'left' ? [d.x + 1, d.y] : side === 'right' ? [d.x - 1, d.y] : side === 'top' ? [d.x, d.y + wallRows] : [d.x, d.y - 1];
    const usable = roomDoors.find(d => d.state !== 'locked' && !sides[d.id].includes('hidden'));
    const locked = roomDoors.find(d => d.state === 'locked' && !sides[d.id].includes('hidden'));
    if (locked) {
      await page.evaluate(([x, y]) => window.__QA__!.commands.teleportTo(x, y), adjacent(locked, sides[locked.id].split(':')[0]));
      await page.waitForTimeout(450);
      expect((await byId(locked.id))!.frame, `${locked.id} locked: no crack on approach`).toMatch(/\.0$/);
      await page.evaluate(() => window.__QA__!.commands.pressSpace());
      await page.waitForTimeout(1400); // rattle + React's refusal (red flash) — and no transition
      expect(await page.evaluate(() => window.__QA__!.currentRoomId)).toBe(ROOM);
      expect((await byId(locked.id))!.frame, `${locked.id} still shut`).toMatch(/\.0$/);
      log.push({ id: locked.id, check: 'locked: stayed on frame 0, room unchanged' });
    }
    if (usable) {
      const side = sides[usable.id].split(':')[0];
      await page.evaluate(([x, y]) => window.__QA__!.commands.teleportTo(x, y), adjacent(usable, side));
      await page.waitForTimeout(450);
      const ajar = (await byId(usable.id))!;
      expect(ajar.openness, `${usable.id} ajar on approach`).toBe(0.72);
      expect(ajar.frame).toMatch(/\.1$/);
      await page.evaluate(() => window.__QA__!.commands.pressSpace());
      // the full swing (230 ms) lands before the fade (150 ms lead + 300 ms) takes the room
      await page.waitForFunction(id => /\.4$/.test((window.__QA__!.doors ?? []).find(q => q.id === id)?.frame ?? ''), usable.id, { timeout: 1500 });
      await page.waitForFunction(t => window.__QA__?.currentRoomId === t, usable.targetRoomId, { timeout: 15_000 });
      log.push({ id: usable.id, check: `ajar → frame 1, SPACE → frame 4, arrived in ${usable.targetRoomId}` });
    } else {
      console.log(`[doors] ${ROOM}: no usable door with seed ${JSON.stringify(doorSeed(ROOM))}`);
    }
    expect(filterBenignErrors(errors)).toEqual([]);
    fs.writeFileSync(`${OUT}/${ROOM}-doors.json`, JSON.stringify(log, null, 1));
  });

  test(`${ROOM}: lighting layer toggles off and the room edges brighten`, async ({ page }) => {
    await boot(page, ROOM);
    const on = await shoot(page, `${ROOM}-lighting-on`);
    await page.evaluate(() => window.__QA__!.commands.setLighting(false));
    await page.waitForTimeout(350);
    expect((await page.evaluate(() => window.__QA__!.art!.lighting))).toBe(false);
    const off = await shoot(page, `${ROOM}-lighting-off`);
    // sample the floor in the bottom corners (inside the walls, clear of the HUD) — where the
    // vignette bites; the void/trim columns at the very edge are dark either way
    const png = PNG.sync.read(on);
    const W = png.width, H = png.height, w = Math.round(W * 0.06), h = Math.round(H * 0.06);
    const x0 = Math.round(W * 0.08), x1 = Math.round(W * 0.86), y0 = Math.round(H * 0.78);
    const cornersOn = (meanLuma(on, x0, y0, w, h) + meanLuma(on, x1, y0, w, h)) / 2;
    const cornersOff = (meanLuma(off, x0, y0, w, h) + meanLuma(off, x1, y0, w, h)) / 2;
    expect(cornersOff, 'lighting off → floor corners brighter').toBeGreaterThan(cornersOn + 3);
    fs.writeFileSync(`${OUT}/${ROOM}-lighting.json`, JSON.stringify({ cornersOn, cornersOff }, null, 1));
  });
}
