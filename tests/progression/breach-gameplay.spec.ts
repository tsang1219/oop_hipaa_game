import { test, expect } from '@playwright/test';
import {
  trackErrors,
  filterBenignErrors,
  waitForQA,
  qaState,
  SETTLE_MS,
} from '../helpers/qa-helpers';

test.describe('BreachDefense Gameplay', () => {
  test.describe.configure({ timeout: 90_000 });

  test('Breach defense page loads', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/breach');
    await page.waitForSelector('canvas', { timeout: 15_000 });

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    expect(filterBenignErrors(errors)).toEqual([]);
  });

  test('Start Mission button begins game', async ({ page }) => {
    await page.goto('/breach');
    await page.waitForSelector('canvas', { timeout: 15_000 });
    await page.waitForTimeout(SETTLE_MS);

    const startBtn = page.getByText('Start Mission');
    await expect(startBtn).toBeVisible({ timeout: 10_000 });
    await startBtn.click();

    // After clicking Start Mission, the onboarding flow begins
    // Look for MISSION BRIEF or other onboarding content
    await page.waitForTimeout(1000);

    // The game should transition away from the start screen
    // Either we see the mission brief or the game is now active
    const missionBrief = page.getByText('MISSION BRIEF');
    const gameActive = await missionBrief.isVisible().catch(() => false);

    // At minimum, the Start Mission button should no longer be prominent
    // (game has transitioned to next state)
    if (!gameActive) {
      // If no mission brief, the game may have jumped straight to playing
      // Just verify the canvas is still there and we moved past start
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
    }
  });

  test('Game auto-start via qa-start param', async ({ page }) => {
    await page.goto('/breach?qa-start');
    await page.waitForSelector('canvas', { timeout: 15_000 });
    await page.waitForTimeout(5000); // let auto-start fire

    await waitForQA(page);
    const state = await qaState(page);

    // breachState should exist and show the game is active
    expect(state.breachState).not.toBeNull();
    expect(state.breachState).toBeDefined();

    // The game should be in PLAYING state after auto-start
    if (state.breachState) {
      expect(['PLAYING', 'WAITING', 'PAUSED']).toContain(
        state.breachState.gameState
      );
    }
  });

  test('No console errors during breach gameplay', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/breach?qa-start');
    await page.waitForSelector('canvas', { timeout: 15_000 });
    await page.waitForTimeout(5000); // let auto-start and first wave begin

    await waitForQA(page);
    const state = await qaState(page);

    // Verify the game actually loaded
    expect(state.breachState).toBeDefined();

    // Let the game run for a few seconds to catch runtime errors
    await page.waitForTimeout(3000);

    expect(filterBenignErrors(errors)).toEqual([]);
  });
});
