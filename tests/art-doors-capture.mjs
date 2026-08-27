// Run 11 (art-substrate, item 1: doors) — door close-ups, closed / ajar / opening, every door type.
//   node tests/art-doors-capture.mjs <suffix>            e.g. before | after
// Writes screenshots/art-substrate/doors-<suffix>-<room>-<door>-<phase>.png (4× crops, 5×4 tiles around the
// door) plus one grid screenshots/art-substrate/doors-grid-<suffix>.png. Door states come from a fresh
// save (qa-no-save), so reception shows 'available' (exit) + 'next'/'locked' (hallway); the hallway's hidden
// closet door is shot twice — as the unfound seam and, with the found flag set, as a door.
import { chromium } from '@playwright/test';
import fs from 'fs';

const suffix = process.argv[2] || 'before';
const OUT = 'screenshots/art-substrate';
fs.mkdirSync(OUT, { recursive: true });
const TILE = 32;
// [room, doorId, standTile (adjacent, inside the room), closetFound?, seedProgress?]
// seedProgress = completed rooms written into a v2 save before loading (the page then
// computes real door states from it: completed / next / locked), otherwise a fresh save.
const CASES = [
  ['reception', 'reception_to_entrance', [1, 7], false],          // left wall, available
  ['reception', 'reception_to_hallway_break', [18, 7], false],    // right wall, locked (fresh save)
  ['it_office', 'it_to_hallway_er', [18, 7], false],              // right wall, locked, dark room
  ['hallway_break_lab', 'hallway_breaklab_to_break', [1, 3], true, ['reception', 'break_room']], // left wall, completed
  ['hallway_break_lab', 'hallway_breaklab_to_lab', [18, 3], true, ['reception', 'break_room']],  // right wall, next
  ['hallway_break_lab', 'hallway_breaklab_to_closet', [8, 2], false], // back wall, hidden seam (unfound)
  ['hallway_break_lab', 'hallway_breaklab_to_closet', [8, 2], true],  // back wall, found
  ['supply_closet', 'closet_to_hallway', [5, 6], true, ['reception', 'break_room']], // bottom wall, next
];
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const [vw, vh] = (process.env.VIEWPORT || '1400x1100').split('x').map(Number);
const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(`PAGEERROR ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`CONSOLE ${m.text()}`); });
const shots = [];

for (const [room, doorId, stand, found, seed] of CASES) {
  await page.goto('http://localhost:8080/?qa-room=' + room + '&qa-no-save&qa_no_encounter=1');
  await page.evaluate(([f, seed]) => {
    try {
      f ? localStorage.setItem('pq:whimsy:closetfound', '1') : localStorage.removeItem('pq:whimsy:closetfound');
      if (seed) localStorage.setItem('pq:save:v2', JSON.stringify({ version: 2, completedRooms: seed, collectedStories: [], completedNPCs: [], completedZones: [], collectedItems: [], privacyScore: 100, finalPrivacyScore: 100, resolvedGates: {}, unlockedNpcs: {}, npcPulsedRooms: [], gameStartTime: Date.now() }));
    } catch {}
  }, [found, seed ?? null]);
  // a seeded save must survive the load: qa-no-save wipes it on boot
  await page.goto('http://localhost:8080/?qa-room=' + room + (seed ? '' : '&qa-no-save') + '&qa_no_encounter=1');
  try { await page.waitForFunction(r => window.__QA__?.currentRoomId === r, room, { timeout: 30000 }); }
  catch (e) { console.log(`!! ${room}: never loaded`); continue; }
  await page.waitForTimeout(3200);
  await page.mouse.move(5, 5);
  const door = await page.evaluate((id) => (window.__QA__?.roomDoors ?? []).find(d => d.id === id), doorId);
  if (!door) { console.log(`!! ${room}/${doorId}: not in roomDoors`); continue; }
  const box = await page.locator('canvas').first().boundingBox();
  const sx = box.width / 640, sy = box.height / 480;
  // small rooms (hallways, the closet) are camera-centred in the 640×480 canvas: world → canvas = world − scroll
  const cam = await page.evaluate(() => { const c = window.__QA_SCENE__?.cameras?.main; return c ? { x: c.scrollX, y: c.scrollY } : { x: 0, y: 0 }; });
  // 5×4-tile window around the door, biased upward (door art rises above its tile)
  const gx = Math.max(0, Math.min(640 - 5 * TILE, door.x * TILE - 2 * TILE - cam.x));
  const gy = Math.max(0, Math.min(480 - 4 * TILE, door.y * TILE - 2 * TILE - cam.y));
  const clip = { x: box.x + gx * sx, y: box.y + gy * sy, width: 5 * TILE * sx, height: 4 * TILE * sy };
  const tag = `${room}-${doorId}${found && doorId.includes('closet') ? '-found' : ''}`;
  const shoot = async (phase) => {
    const p = `${OUT}/doors-${suffix}-${tag}-${phase}.png`;
    await page.screenshot({ path: p, clip });
    shots.push({ tag: `${tag} [${door.state}]`, phase, p });
  };
  await shoot('closed');
  await page.evaluate(([x, y]) => window.__QA__.commands.teleportTo(x, y), stand);
  await page.waitForTimeout(450);
  await shoot('ajar');
  if (door.state !== 'locked') {
    await page.evaluate(() => window.__QA__.commands.pressSpace());
    await page.waitForTimeout(150);
    await shoot('opening');
  } else {
    await page.evaluate(() => window.__QA__.commands.pressSpace());
    await page.waitForTimeout(120);
    await shoot('rattle');
  }
  console.log(`captured ${tag} (${door.state})`);
}

// grid: one row per case, columns closed | ajar | opening
const rowsByTag = new Map();
for (const s of shots) { if (!rowsByTag.has(s.tag)) rowsByTag.set(s.tag, []); rowsByTag.get(s.tag).push(s); }
const rows = [...rowsByTag.entries()].map(([tag, list]) => ({ tag, cells: list.map(s => ({ phase: s.phase, uri: 'data:image/png;base64,' + fs.readFileSync(s.p).toString('base64') })) }));
const gridPage = await ctx.newPage();
await gridPage.setContent('<canvas id="c"></canvas>');
const data = await gridPage.evaluate(async ([rows, suffix]) => {
  const CW = 320, CH = 256, ML = 8, MT = 30, GAP = 6, LABEL = 18;
  const c = document.getElementById('c');
  c.width = ML + 3 * (CW + GAP); c.height = MT + rows.length * (CH + LABEL + GAP);
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#111118'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#ffd166'; g.font = 'bold 15px monospace'; g.textAlign = 'left';
  g.fillText(`DOORS — ${suffix.toUpperCase()}   (closed | ajar on approach | 150 ms after SPACE)`, ML, 20);
  for (let r = 0; r < rows.length; r++) {
    const y = MT + r * (CH + LABEL + GAP);
    g.fillStyle = '#e8e8f0'; g.font = 'bold 12px monospace'; g.fillText(rows[r].tag, ML, y + 13);
    for (let i = 0; i < rows[r].cells.length; i++) {
      const img = new Image(); img.src = rows[r].cells[i].uri; await img.decode();
      g.drawImage(img, ML + i * (CW + GAP), y + LABEL, CW, CH);
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(ML + i * (CW + GAP), y + LABEL, 70, 14);
      g.fillStyle = '#ffd166'; g.font = '11px monospace'; g.fillText(rows[r].cells[i].phase, ML + i * (CW + GAP) + 3, y + LABEL + 11);
    }
  }
  return c.toDataURL('image/png');
}, [rows, suffix]);
fs.writeFileSync(`${OUT}/doors-grid-${suffix}.png`, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
const real = errors.filter(e => !/favicon|404|net::ERR|ResizeObserver|WebAudio|WebSocket/.test(e));
console.log(`grid -> ${OUT}/doors-grid-${suffix}.png`);
console.log(real.length ? `ERRORS:\n${real.join('\n')}` : 'console clean');
