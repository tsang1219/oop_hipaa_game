import { test, expect } from '@playwright/test';

const ROOM_IDS = ['reception', 'er', 'lab', 'records_room', 'it_office', 'break_room'];
const SETTLE_MS = 3000;

/** Collect console errors during a test, filtering out benign ones */
function trackErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  return errors;
}

function filterBenignErrors(errors: string[]) {
  return errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('404') &&
    !e.includes('net::ERR') &&
    !e.includes('ResizeObserver') &&
    !e.includes('WebAudio') &&
    !e.includes('Audio key') &&
    !e.includes('music_hub not ready')
  );
}

// ── Hub World (Hospital Entrance) ────────────────────────────────

test('Hub World', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/?qa-skip-onboarding');
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForFunction(
    () => window.__QA__?.scenesVisited?.includes('Exploration'),
    { timeout: 20_000 },
  ).catch(() => {});
  await page.waitForTimeout(SETTLE_MS);

  await page.screenshot({ path: 'screenshots/hub-world.png', fullPage: true });

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box!.width).toBeGreaterThan(100);
  expect(box!.height).toBeGreaterThan(100);

  expect(filterBenignErrors(errors)).toEqual([]);
});

// ── PrivacyQuest — Each Room ────────────────────────────────────

for (const roomId of ROOM_IDS) {
  test(`PrivacyQuest — Room: ${roomId}`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/?qa-room=${roomId}&qa-no-save`);
    await page.waitForSelector('canvas', { timeout: 15_000 });

    // Wait for scene ready via QA bridge
    await page.waitForFunction(
      () => window.__QA__?.scenesVisited?.includes('Exploration'),
      { timeout: 20_000 },
    ).catch(() => {});

    // Wait for target room to load (qa-room has 2s delay)
    await page.waitForFunction(
      (id) => window.__QA__?.currentRoomId === id,
      roomId,
      { timeout: 10_000 },
    ).catch(() => {});
    await page.waitForTimeout(SETTLE_MS);

    await page.screenshot({ path: `screenshots/privacy-${roomId}.png`, fullPage: true });

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    expect(filterBenignErrors(errors)).toEqual([]);
  });
}

// ── BreachDefense — Start Screen ────────────────────────────────
// NOTE: BreachDefense runs as encounter within ExplorationScene in v2.
// The standalone /breach route no longer exists. These tests are skipped
// until BreachDefense is testable via the encounter system or a restored route.

test.skip('BreachDefense — Start Screen', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/breach');
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForTimeout(SETTLE_MS);

  await page.screenshot({ path: 'screenshots/breach-start.png', fullPage: true });
  expect(filterBenignErrors(errors)).toEqual([]);
});

test.skip('BreachDefense — Game Active', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/breach?qa-start');
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'screenshots/breach-playing.png', fullPage: true });

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  expect(filterBenignErrors(errors)).toEqual([]);
});

test.skip('BreachDefense — Onboarding Flow', async ({ page }) => {
  // Skipped: /breach route does not exist in v2
});
