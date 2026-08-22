/**
 * Run 12 — FEEL-27 evidence: frame timing through a full BreachDefense wave,
 * with all the new audio/animation systems live. Drives the IT-office threat
 * console exactly like tests/encounter-flow-review.spec.ts does, then samples
 * requestAnimationFrame deltas until wave 1 is cleared (or 60s).
 * Writes screenshots/living-world/td-frame-timing.json.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loadRoom } from './helpers/qa-helpers';

const OUT = 'screenshots/living-world';
fs.mkdirSync(OUT, { recursive: true });

test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });

test('FEEL-27 — frame timing through a full TD wave', async ({ page }) => {
  test.setTimeout(180_000);
  await loadRoom(page, 'it_office');
  await page.evaluate(() => window.__QA__!.commands.teleportTo(11, 12));
  await page.waitForFunction(() => window.__QA__?.nearbyInteractable?.id === 'defense_console', null, { timeout: 5_000 });
  await page.evaluate(() => window.__QA__!.commands.pressSpace());
  await page.waitForFunction(() => document.body.innerText.includes('DEFEND THE NETWORK'), null, { timeout: 8_000 });
  await page.locator('button', { hasText: 'DEFEND THE NETWORK' }).click();
  await page.waitForTimeout(3000);

  const canvas = page.locator('canvas');
  await canvas.click({ position: { x: 480, y: 360 } });
  await page.waitForTimeout(800);
  const mfaBtn = page.locator('button', { hasText: 'MFA Shield' });
  await mfaBtn.click();
  await page.waitForTimeout(300);
  await canvas.click({ position: { x: 200, y: 200 } });
  await page.waitForTimeout(400);
  await canvas.click({ position: { x: 480, y: 360 } });
  await page.waitForTimeout(400);
  const fwBtn = page.locator('button', { hasText: 'Firewall Barrier' });
  if (await fwBtn.isVisible().catch(() => false)) {
    await fwBtn.click();
    await page.waitForTimeout(300);
    await canvas.click({ position: { x: 350, y: 250 } });
    await page.waitForTimeout(400);
  }
  for (let i = 0; i < 3; i++) {
    await canvas.click({ position: { x: 480, y: 360 } });
    await page.waitForTimeout(600);
  }

  // Start sampling while the prep countdown runs, so the wave start is inside the window.
  await page.evaluate(() => {
    const s = { deltas: [] as number[], last: performance.now(), running: true };
    (window as any).__frames = s;
    const tick = (t: number) => { s.deltas.push(t - s.last); s.last = t; if (s.running) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  // Wait for the wave to activate, then for it to be cleared (wave counter advances) — max 75s.
  await page.waitForFunction(() => (window.__QA__?.breachState?.wave ?? 0) >= 1 && document.body.innerText.includes('WAVE'), null, { timeout: 20_000 }).catch(() => {});
  const t0 = Date.now();
  let state = await page.evaluate(() => window.__QA__?.breachState);
  const startWave = state?.wave ?? 1;
  while (Date.now() - t0 < 75_000) {
    await page.waitForTimeout(1000);
    state = await page.evaluate(() => window.__QA__?.breachState);
    if ((state?.wave ?? 0) > startWave || state?.gameState === 'VICTORY' || state?.gameState === 'GAMEOVER') break;
  }
  const stats = await page.evaluate(() => {
    const s = (window as any).__frames as { deltas: number[]; running: boolean };
    s.running = false;
    const d = s.deltas.slice(5).sort((a, b) => a - b);
    const q = (p: number) => d[Math.min(d.length - 1, Math.floor(p * d.length))];
    return {
      frames: d.length, p50: +q(0.5).toFixed(2), p90: +q(0.9).toFixed(2), p95: +q(0.95).toFixed(2), p99: +q(0.99).toFixed(2),
      max: +d[d.length - 1].toFixed(2), over16_7: d.filter(x => x > 16.7).length, over33: d.filter(x => x > 33.4).length,
      mean: +(d.reduce((a, b) => a + b, 0) / d.length).toFixed(2),
    };
  });
  const summary = { ...stats, startWave, endState: state, sampledMs: Date.now() - t0, displayRefreshNote: 'deltas are rAF intervals on this machine; 16.7ms = 60Hz frame' };
  fs.writeFileSync(path.join(OUT, 'td-frame-timing.json'), JSON.stringify(summary, null, 2));
  console.log('[PERF]', JSON.stringify(summary));
  await page.screenshot({ path: path.join(OUT, 'td-wave.png') });
  expect(stats.frames).toBeGreaterThan(100);
  // Frame budget: p95 at or under a 60Hz frame (with a little headroom for rAF jitter).
  expect(stats.p95).toBeLessThanOrEqual(18);
});
