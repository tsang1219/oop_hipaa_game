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
  hallway_reception_break: [{ prop: ['vending_machine', 12, 5], at: [12, 4], rel: 'behind' }, { prop: ['vending_machine', 12, 5], at: [11, 5], rel: 'beside' }, { prop: ['plant', 10, 2], at: [10, 3], rel: 'front' }],
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
