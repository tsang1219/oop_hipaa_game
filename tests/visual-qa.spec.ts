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

// ── BreachDefense — Onboarding Flow ─────────────────────────────

test('BreachDefense — Onboarding Flow', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/breach');
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForTimeout(SETTLE_MS);

  // Step 1: Click "Start Mission"
  const startBtn = page.getByText('Start Mission');
  await expect(startBtn).toBeVisible();
  await startBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/breach-onboard-1-welcome.png', fullPage: true });

  // Step 2: Welcome card should be visible — click to advance
  const welcomeCard = page.getByText('MISSION BRIEF');
  await expect(welcomeCard).toBeVisible({ timeout: 3000 });
  await page.click('body'); // click to skip typewriter / advance
  await page.waitForTimeout(500);
  await page.click('body'); // advance past welcome
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/breach-onboard-2-select-tower.png', fullPage: true });

  // Step 3: "Pick a defense" hint should appear — tower panel should be visible
  const pickHint = page.getByText('Pick a defense below');
  await expect(pickHint).toBeVisible({ timeout: 3000 });

  // Step 4: Click a tower button (MFA Shield — first unlocked, cheapest)
  const mfaBtn = page.getByText('MFA Shield');
  await expect(mfaBtn).toBeVisible({ timeout: 3000 });
  await mfaBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/breach-onboard-3-place-tower.png', fullPage: true });

  // Step 5: "Click a glowing cell" label should appear
  const placeHint = page.getByText('Click a glowing cell');
  await expect(placeHint).toBeVisible({ timeout: 3000 });

  // Step 6: Click on the canvas to place a tower (cell 1,2 — one of the highlighted cells)
  const canvas = page.locator('canvas');
  const canvasBox = await canvas.boundingBox();
  if (canvasBox) {
    // Cell (1,2) at 64px cells, scaled 1.5x = (1*64+32)*1.5, (2*64+32)*1.5 = 144, 192
    // Account for canvas position within its container
    const scaleX = canvasBox.width / 640;
    const scaleY = canvasBox.height / 480;
    const clickX = canvasBox.x + (1 * 64 + 32) * scaleX;
    const clickY = canvasBox.y + (2 * 64 + 32) * scaleY;
    await page.mouse.click(clickX, clickY);
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/breach-onboard-4-tower-placed.png', fullPage: true });

  // Step 7: "TOWER PLACED!" celebration should appear
  const placedMsg = page.getByText('TOWER PLACED!');
  await expect(placedMsg).toBeVisible({ timeout: 3000 });

  // Wait for auto-advance to prep countdown
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'screenshots/breach-onboard-5-prep.png', fullPage: true });

  // Step 8: Prep countdown or wave should be starting
  // Just verify no JS errors and game is still running
  const canvasStillVisible = page.locator('canvas');
  await expect(canvasStillVisible).toBeVisible();

  expect(filterBenignErrors(errors)).toEqual([]);
});
