import { test, expect } from '@playwright/test';

const HALLWAY_IDS = [
  'hallway_reception_break',
  'hallway_break_lab',
  'hallway_lab_records',
  'hallway_records_it',
  'hallway_it_er',
];

const SETTLE_MS = 3000;

for (const roomId of HALLWAY_IDS) {
  test(`Hallway: ${roomId}`, async ({ page }) => {
    await page.goto(`/?qa-room=${roomId}&qa-no-save&qa-skip-onboarding`);
    await page.waitForSelector('canvas', { timeout: 15_000 });
    await page.waitForFunction(
      () => window.__QA__?.scenesVisited?.includes('Exploration'),
      { timeout: 20_000 },
    ).catch(() => {});
    await page.waitForFunction(
      (id) => window.__QA__?.currentRoomId === id,
      roomId,
      { timeout: 10_000 },
    ).catch(() => {});
    await page.waitForTimeout(SETTLE_MS);
    await page.screenshot({ path: `screenshots/hallway-${roomId}.png`, fullPage: true });
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
}
