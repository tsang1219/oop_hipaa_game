import { test, expect } from '@playwright/test';

const ROOM_IDS = ['reception', 'er', 'lab', 'records_room', 'it_office', 'break_room'];
const BREACH_WAVES = [1, 3, 5, 8];
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
    !e.includes('ResizeObserver')
  );
}

// ── Hub World ───────────────────────────────────────────────────

test('Hub World', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForTimeout(SETTLE_MS);

  await page.screenshot({ path: 'screenshots/hub-world.png', fullPage: true });

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box!.width).toBeGreaterThan(100);
  expect(box!.height).toBeGreaterThan(100);

  expect(filterBenignErrors(errors)).toEqual([]);
});

// ── PrivacyQuest — HallwayHub ───────────────────────────────────

test('PrivacyQuest — HallwayHub', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/privacy');
  await page.waitForSelector('[data-testid="button-room-reception"]', { timeout: 15_000 });
  await page.waitForTimeout(SETTLE_MS);

  await page.screenshot({ path: 'screenshots/privacy-hub.png', fullPage: true });
  expect(filterBenignErrors(errors)).toEqual([]);
});

// ── PrivacyQuest — Each Room ────────────────────────────────────

for (const roomId of ROOM_IDS) {
  test(`PrivacyQuest — Room: ${roomId}`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/privacy?qa-room=${roomId}`);
    await page.waitForSelector('canvas', { timeout: 15_000 });

    // Wait for scene ready via QA bridge (or fall back to timeout)
    await page.waitForFunction(
      () => window.__QA__?.sceneReady === 'Exploration',
      { timeout: 20_000 },
    ).catch(() => {
      // Scene may have loaded before polling started — settle with timeout
    });
    await page.waitForTimeout(SETTLE_MS);

    await page.screenshot({ path: `screenshots/privacy-${roomId}.png`, fullPage: true });

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    expect(filterBenignErrors(errors)).toEqual([]);
  });
}

// ── BreachDefense — Start Screen ────────────────────────────────

test('BreachDefense — Start Screen', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/breach');
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForTimeout(SETTLE_MS);

  await page.screenshot({ path: 'screenshots/breach-start.png', fullPage: true });
  expect(filterBenignErrors(errors)).toEqual([]);
});

// ── BreachDefense — Game Active ─────────────────────────────────

test('BreachDefense — Game Active', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/breach?qa-start');
  await page.waitForSelector('canvas', { timeout: 15_000 });

  // Wait for game to auto-start and render (qa-start fires after 500ms + scene load)
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'screenshots/breach-playing.png', fullPage: true });

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  expect(filterBenignErrors(errors)).toEqual([]);
});
