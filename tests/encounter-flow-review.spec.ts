/**
 * Encounter Flow Design Review — Final Verification
 * Full lifecycle: IT Office → Narrative Card → Breach Defense → Onboarding → Tower Placement
 */
import { test, expect } from '@playwright/test';

const SS = 'screenshots/encounter-flow';

test('Full encounter lifecycle — final verification', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  // ── 1. Load IT Office ──────────────────────────────────────
  await page.goto('/?qa-room=it_office&qa-no-save');
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForFunction(
    () => window.__QA__?.currentRoomId === 'it_office',
    { timeout: 30_000 },
  );
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SS}/final-01-it-office.png`, fullPage: true });

  // Verify room loaded correctly
  const roomState = await page.evaluate(() => ({
    room: window.__QA__?.currentRoomId,
    npcs: window.__QA__?.roomNPCs,
    zones: window.__QA__?.roomZones,
  }));
  expect(roomState.room).toBe('it_office');
  console.log('[FINAL] Room NPCs:', JSON.stringify(roomState.npcs));
  console.log('[FINAL] Room Zones:', JSON.stringify(roomState.zones));

  // ── 2. Walk toward encounter zone ──────────────────────────
  await page.evaluate(() => window.__QA__!.commands.teleportTo(9, 6));

  // Wait for narrative card with the anticipation beat (shake + delay)
  await page.waitForFunction(
    () => document.body.innerText.includes('DEFEND THE NETWORK'),
    { timeout: 8_000 },
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SS}/final-02-narrative-card.png`, fullPage: true });

  // Verify narrative card content
  const cardText = await page.evaluate(() => document.body.innerText);
  expect(cardText).toContain('SECURITY ALERT');
  expect(cardText).toContain('suspicious login attempts');
  expect(cardText).toContain('DEFEND THE NETWORK');
  expect(cardText).toContain('NOT RIGHT NOW');
  console.log('[FINAL] Narrative card rendered correctly');

  // ── 3. Click DEFEND THE NETWORK ────────────────────────────
  await page.locator('button', { hasText: 'DEFEND THE NETWORK' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${SS}/final-03-breach-grid.png`, fullPage: true });

  // Verify grid rendered and budget synced
  const breachState1 = await page.evaluate(() => window.__QA__?.breachState);
  expect(breachState1?.budget).toBe(150);
  expect(breachState1?.securityScore).toBe(100);
  expect(breachState1?.wave).toBe(1);
  console.log('[FINAL] Breach state after launch:', JSON.stringify(breachState1));

  // Verify React HUD shows correct budget
  const budgetText = await page.evaluate(() => {
    const els = document.querySelectorAll('[style*="Press Start"]');
    return Array.from(els).map(el => (el as HTMLElement).innerText).filter(t => t.includes('$150'));
  });
  expect(budgetText.length).toBeGreaterThan(0);
  console.log('[FINAL] Budget displayed correctly in HUD');

  // ── 4. Advance onboarding ──────────────────────────────────
  const canvas = page.locator('canvas');
  // Click through Mission Brief
  await canvas.click({ position: { x: 480, y: 360 } });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SS}/final-04-pick-defense.png`, fullPage: true });

  // ── 5. Select a tower ──────────────────────────────────────
  const mfaBtn = page.locator('button', { hasText: 'MFA Shield' });
  expect(await mfaBtn.isVisible()).toBeTruthy();
  await mfaBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SS}/final-05-tower-selected.png`, fullPage: true });

  // ── 6. Place a tower ───────────────────────────────────────
  // Click on a grid cell (non-path area)
  await canvas.click({ position: { x: 200, y: 200 } });
  await page.waitForTimeout(500);

  const breachState2 = await page.evaluate(() => window.__QA__?.breachState);
  expect(breachState2?.towerCount).toBe(1);
  expect(breachState2?.budget).toBe(70); // 150 - 80 (MFA cost)
  console.log('[FINAL] Tower placed. Budget:', breachState2?.budget, 'Towers:', breachState2?.towerCount);

  await page.screenshot({ path: `${SS}/final-06-tower-placed.png`, fullPage: true });

  // ── 7. Continue onboarding — place Firewall ────────────────
  // Click through "Different Towers" step
  await canvas.click({ position: { x: 480, y: 360 } });
  await page.waitForTimeout(500);

  // Select Firewall
  const fwBtn = page.locator('button', { hasText: 'Firewall Barrier' });
  if (await fwBtn.isVisible().catch(() => false)) {
    await fwBtn.click();
    await page.waitForTimeout(300);
    // Place it
    await canvas.click({ position: { x: 350, y: 250 } });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SS}/final-07-two-towers.png`, fullPage: true });

    const breachState3 = await page.evaluate(() => window.__QA__?.breachState);
    console.log('[FINAL] After 2nd tower:', JSON.stringify(breachState3));
  }

  // ── 8. Advance to prep countdown ───────────────────────────
  // Click through remaining onboarding steps
  for (let i = 0; i < 3; i++) {
    await canvas.click({ position: { x: 480, y: 360 } });
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: `${SS}/final-08-prep-countdown.png`, fullPage: true });

  // Wait for wave to start (prep countdown is 8 seconds)
  await page.waitForTimeout(10000);
  await page.screenshot({ path: `${SS}/final-09-wave-active.png`, fullPage: true });

  const breachState4 = await page.evaluate(() => window.__QA__?.breachState);
  console.log('[FINAL] After wave start:', JSON.stringify(breachState4));

  // ── Verify no errors ───────────────────────────────────────
  const real = errors.filter(e =>
    !e.includes('favicon') && !e.includes('404') && !e.includes('net::ERR') &&
    !e.includes('ResizeObserver') && !e.includes('WebAudio') && !e.includes('Audio key') &&
    !e.includes('music_hub not ready') && !e.includes('WebSocket')
  );
  console.log('[FINAL] Errors:', real.length ? JSON.stringify(real) : 'NONE');
  expect(real.length).toBe(0);
});
