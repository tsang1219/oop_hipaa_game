/**
 * Run 11 (art-substrate) — proof suite. Trusts the screen, not the code.
 *
 *  1. ATLAS  — the room renders from the LimeZu atlas: __QA__.art reports no
 *              missing frames, exactly one atlas image request, zero console errors.
 *  2. DEPTH  — three y-positions around two tall props: the player's depth is below
 *              the prop's when standing behind it and above it when in front (ART-07),
 *              with a screenshot of each.
 *  3. LIGHT  — the lighting layer toggles off through the QA bridge and the corners
 *              measurably brighten (ART-06).
 *
 * Artifacts land in screenshots/art-substrate/.
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import { createRequire } from 'module';
import { trackErrors, filterBenignErrors } from './helpers/qa-helpers';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle') as { PNG: any };

const OUT = 'screenshots/art-substrate';
fs.mkdirSync(OUT, { recursive: true });
const ROOM = process.env.ART_ROOM || 'reception';

test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });

async function boot(page: Page, room: string) {
  await page.goto(`/?qa-room=${room}&qa-no-save&qa_no_encounter=1`);
  await page.waitForFunction(r => window.__QA__?.currentRoomId === r, room, { timeout: 30_000 });
  await page.waitForTimeout(3200); // fade-in + room banner
}

async function canvasClip(page: Page) {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) throw new Error('no canvas');
  return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
}

async function shoot(page: Page, name: string): Promise<Buffer> {
  const clip = await canvasClip(page);
  return page.screenshot({ path: `${OUT}/${name}.png`, clip });
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

test(`${ROOM}: renders from the atlas — no missing frames, one atlas request, zero console errors`, async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page, ROOM);
  const art = await page.evaluate(() => window.__QA__?.art ?? null);
  expect(art, '__QA__.art should be published by the atlas renderer').not.toBeNull();
  expect(art!.atlas).toBe('interiors');
  expect(art!.missing).toEqual([]);
  expect(art!.props.length).toBeGreaterThan(10);
  const pngs = await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name).filter(n => /\.png$/.test(n)));
  expect(pngs.filter(n => n.includes('/atlas/interiors.png')).length, 'exactly one atlas image').toBe(1);
  // everything under privacyquest/ other than the atlas and the character sheets would be a per-prop image
  expect(pngs.filter(n => n.includes('/privacyquest/') && !n.includes('/atlas/') && !n.includes('/characters/')), 'no per-prop image requests').toEqual([]);
  expect(filterBenignErrors(errors)).toEqual([]);
  fs.writeFileSync(`${OUT}/${ROOM}-art-snapshot.json`, JSON.stringify({ ...art, imageRequests: pngs.length }, null, 1));
});

test(`${ROOM}: y-sorted depth — behind / beside / in front of tall props`, async ({ page }) => {
  await boot(page, ROOM);
  const art = (await page.evaluate(() => window.__QA__!.art!))!;
  const propDepth = (type: string, x: number, y: number) => {
    const p = art.props.find(q => q.type === type && q.x === x && q.y === y);
    if (!p) throw new Error(`prop ${type}@${x},${y} missing from snapshot`);
    return p.depth;
  };
  // [prop, tileX, tileY] → where the player stands; 'behind' = above the prop (smaller depth)
  const cases: Array<{ prop: [string, number, number]; at: [number, number]; rel: 'behind' | 'beside' | 'front' }> = ROOM === 'reception' ? [
    { prop: ['water_dispenser', 17, 12], at: [17, 11], rel: 'behind' },
    { prop: ['water_dispenser', 17, 12], at: [16, 12], rel: 'beside' },
    { prop: ['water_dispenser', 17, 12], at: [17, 13], rel: 'front' },
    { prop: ['trash_can', 6, 3], at: [6, 2], rel: 'behind' },
    { prop: ['trash_can', 6, 3], at: [5, 3], rel: 'beside' },
    { prop: ['trash_can', 6, 3], at: [6, 4], rel: 'front' },
  ] : [];
  const results: Array<Record<string, unknown>> = [];
  for (const c of cases) {
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

test(`${ROOM}: lighting layer toggles off and the corners brighten`, async ({ page }) => {
  await boot(page, ROOM);
  const on = await shoot(page, `${ROOM}-lighting-on`);
  await page.evaluate(() => window.__QA__!.commands.setLighting(false));
  await page.waitForTimeout(350);
  expect((await page.evaluate(() => window.__QA__!.art!.lighting))).toBe(false);
  const off = await shoot(page, `${ROOM}-lighting-off`);
  const png = PNG.sync.read(on);
  const s = 60;
  const cornersOn = (meanLuma(on, 4, 130, s, s) + meanLuma(on, png.width - s - 4, 130, s, s)) / 2;
  const cornersOff = (meanLuma(off, 4, 130, s, s) + meanLuma(off, png.width - s - 4, 130, s, s)) / 2;
  expect(cornersOff, 'vignette off → room edges brighter').toBeGreaterThan(cornersOn + 3);
  fs.writeFileSync(`${OUT}/${ROOM}-lighting.json`, JSON.stringify({ cornersOn, cornersOff }, null, 1));
});
