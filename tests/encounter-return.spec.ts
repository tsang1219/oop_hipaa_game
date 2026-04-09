/**
 * End-to-end test: IT Office encounter → victory → debrief → return to hospital.
 * Verifies the page doesn't crash when returning from BreachDefense.
 */
import { test, expect } from '@playwright/test';

test('Return to hospital after encounter victory does not crash', async ({ page }) => {
  test.setTimeout(120_000);

  const pageErrors: string[] = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  // ── Step 1: Load IT Office ───────────────────────────────────
  await page.goto('http://localhost:8080/?qa-room=it_office&qa-skip-onboarding&qa-no-save');
  await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30_000 });
  await page.waitForFunction(
    () => (window as any).__QA__?.currentRoomId === 'it_office',
    { timeout: 30_000 },
  );
  await page.waitForTimeout(1000);

  // ── Step 2: Trigger encounter ────────────────────────────────
  await page.evaluate(() => window.__QA__!.commands.teleportTo(9, 6));
  await page.waitForTimeout(1500);

  // Click DEFEND THE NETWORK
  await page.locator('text=DEFEND THE NETWORK').click({ timeout: 5000 });
  await page.waitForTimeout(2000);

  // Wait for BreachDefense scene
  await page.waitForFunction(
    () => (window as any).__QA__?.sceneReady === 'BreachDefense',
    { timeout: 10_000 },
  );

  // ── Step 3: Force victory via EventBridge ────────────────────
  // Emit ENCOUNTER_COMPLETE directly — this is what BreachDefenseScene
  // emits when the player wins. React will show the debrief screen.
  await page.evaluate(() => {
    window.__QA__!.emit('encounter:complete', {
      encounterId: 'td-it-office',
      outcome: 'victory',
      securityScore: 85,
      scoreContribution: 10,
    });
  });

  await page.waitForTimeout(1000);

  // ── Step 4: Verify debrief is showing ────────────────────────
  const returnBtn = page.locator('text=RETURN TO HOSPITAL');
  await expect(returnBtn).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: 'test-results/return-debrief.png' });

  // ── Step 5: Click RETURN TO HOSPITAL ─────────────────────────
  await returnBtn.click();

  // ── Step 6: Verify page is still responsive ──────────────────
  // Wait 3 seconds, then check we can still run JS in the page
  await page.waitForTimeout(3000);

  const responsive = await page.evaluate(() => {
    return new Promise<boolean>(resolve => {
      // If this setTimeout fires, the page is responsive
      setTimeout(() => resolve(true), 200);
    });
  }).catch(() => false);

  expect(responsive).toBe(true);
  await page.screenshot({ path: 'test-results/return-after-dismiss.png' });

  // ── Step 7: Verify we're back in IT Office ───────────────────
  // ExplorationScene wakes but doesn't re-emit SCENE_READY, so check roomId
  const backInRoom = await page.waitForFunction(
    () => (window as any).__QA__?.currentRoomId === 'it_office',
    { timeout: 10_000 },
  ).then(() => true).catch(() => false);

  expect(backInRoom).toBe(true);
  await page.screenshot({ path: 'test-results/return-back-in-room.png' });

  // ── Step 8: Verify no page errors ────────────────────────────
  const realErrors = pageErrors.filter(e =>
    !e.includes('favicon') && !e.includes('net::ERR') &&
    !e.includes('ResizeObserver')
  );
  expect(realErrors).toEqual([]);
});
