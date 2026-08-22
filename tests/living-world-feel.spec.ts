/**
 * Run 12 — FEEL/ANIM visual evidence: frames captured at the exact moments
 * that are supposed to feel physical. Not assertions of taste — these exist
 * so a human can judge the squash, the door leaf and the blink from stills.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loadRoom, waitForRoom } from './helpers/qa-helpers';

const OUT = 'screenshots/living-world/feel';
fs.mkdirSync(OUT, { recursive: true });

test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });

async function canvasClip(page: import('@playwright/test').Page, cx: number, cy: number, w: number, h: number) {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) throw new Error('no canvas');
  // the canvas is 640x480 scaled to fit; map game px → screen px
  const sx = box.width / 640, sy = box.height / 480;
  return { x: box.x + (cx - w / 2) * sx, y: box.y + (cy - h / 2) * sy, width: w * sx, height: h * sy };
}

test('FEEL-20 — NPC squash frame + door leaf ajar/open frames', async ({ page }) => {
  await loadRoom(page, 'reception');
  await page.mouse.move(5, 5);
  // Riley at tile (10,4) → px (336,144). Stand below and watch the squash.
  await page.evaluate(() => window.__QA__!.commands.teleportTo(10, 5));
  await page.waitForTimeout(500);
  const rileyClip = await canvasClip(page, 336, 150, 96, 96);
  await page.screenshot({ path: path.join(OUT, 'npc-before-space.png'), clip: rileyClip });
  await page.evaluate(() => window.__QA__!.commands.pressSpace());
  await page.waitForTimeout(70); // inside the hit-stop + squash window
  await page.screenshot({ path: path.join(OUT, 'npc-squash-70ms.png'), clip: rileyClip });
  await page.waitForTimeout(180);
  await page.screenshot({ path: path.join(OUT, 'npc-squash-250ms.png'), clip: rileyClip });
  const living = await page.evaluate(() => window.__QA__?.living?.find(n => n.id === 'riley'));
  expect(living?.state).toBe('talking');
  expect(living?.facing).toBe('down');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Door: reception_to_entrance at (0,7) → px (16,240) — unlocked on a fresh save. Approach → ajar.
  await page.goto('/?qa-room=reception&qa-no-save&qa_no_encounter=1');
  await waitForRoom(page, 'reception');
  await page.waitForTimeout(800);
  const doorClip = await canvasClip(page, 40, 236, 96, 96);
  await page.screenshot({ path: path.join(OUT, 'door-closed.png'), clip: doorClip });
  await page.evaluate(() => window.__QA__!.commands.teleportTo(1, 7));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'door-ajar.png'), clip: doorClip });
  await page.evaluate(() => window.__QA__!.commands.pressSpace());
  await page.waitForTimeout(140);
  await page.screenshot({ path: path.join(OUT, 'door-open-140ms.png'), clip: doorClip });
  await waitForRoom(page, 'hospital_entrance');
});

test('ANIM-01 — catch a blink on camera', async ({ page }) => {
  await loadRoom(page, 'reception');
  await page.mouse.move(5, 5);
  // Nervous patient at (5,9) → px (176,304). Poll the living snapshot for a blink.
  const clip = await canvasClip(page, 176, 300, 64, 64);
  await page.screenshot({ path: path.join(OUT, 'blink-open.png'), clip });
  // Wait for the blink counter to tick, then shoot within the 110ms window.
  const before = await page.evaluate(() => window.__QA__?.living?.find(n => n.id === 'nervous_patient')?.blinks ?? 0);
  await page.waitForFunction((b) => (window.__QA__?.living?.find(n => n.id === 'nervous_patient')?.blinks ?? 0) > b, before, { timeout: 10_000 });
  // The snapshot is broadcast every 200ms, so we may be late — take a burst.
  for (let i = 0; i < 3; i++) {
    await page.screenshot({ path: path.join(OUT, `blink-burst-${i}.png`), clip });
  }
});

test('ANIM-01 — the generated closed-eye frames, magnified, next to the originals', async ({ page }) => {
  await loadRoom(page, 'reception');
  // Draw frame 0 (down), 3 (left), 6 (right) of every sheet + its blink twin at 6x on a DOM canvas.
  const ok = await page.evaluate(() => {
    const sc = (window as any).__QA_SCENE__;
    if (!sc) return false;
    const tm = sc.textures;
    const sheets = ['player_sheet', 'npc_receptionist_sheet', 'npc_nurse_sheet', 'npc_doctor_sheet', 'npc_it_tech_sheet', 'npc_officer_sheet', 'npc_boss_sheet', 'npc_staff_sheet', 'npc_patient_sheet', 'npc_visitor_sheet', 'npc_lawyer_sheet'];
    const SC = 5, FR = 32;
    const cols = 6; // open/blink × 3 facings
    const canvas = document.createElement('canvas');
    canvas.id = '__blinkproof';
    canvas.width = cols * FR * SC + 140;
    canvas.height = sheets.length * (FR * SC + 6) + 30;
    canvas.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#1b1b28;image-rendering:pixelated';
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1b1b28'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ccc'; ctx.font = '12px system-ui';
    ctx.fillText('open → blink (down)   open → blink (left)   open → blink (right)', 140, 18);
    sheets.forEach((key, row) => {
      const y = 26 + row * (FR * SC + 6);
      ctx.fillStyle = '#ff6b9d'; ctx.fillText(key.replace('_sheet', ''), 4, y + 14);
      const src = tm.exists(key) ? tm.get(key).getSourceImage() : null;
      const blink = tm.exists(key + '_blink') ? tm.get(key + '_blink').getSourceImage() : null;
      [0, 3, 6].forEach((f, fi) => {
        const fx = (f % 3) * FR, fy = Math.floor(f / 3) * FR;
        const x0 = 140 + fi * 2 * FR * SC;
        if (src) ctx.drawImage(src, fx, fy, FR, FR, x0, y, FR * SC, FR * SC);
        if (blink) ctx.drawImage(blink, fx, fy, FR, FR, x0 + FR * SC, y, FR * SC, FR * SC);
      });
    });
    document.body.appendChild(canvas);
    return true;
  });
  expect(ok).toBe(true);
  const el = page.locator('#__blinkproof');
  await el.screenshot({ path: path.join(OUT, 'blink-frames-magnified.png') });
});
