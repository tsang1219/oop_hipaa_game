/**
 * Debug test: Full encounter flow including return to IT Office.
 * Tests: play encounter → victory/defeat → debrief → return to hospital
 */
import { test } from '@playwright/test';

test('Encounter return-to-hospital flow', async ({ page }) => {
  test.setTimeout(180_000);

  const errors: string[] = [];
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    const text = msg.text();
    if (text.includes('[Breach') || text.includes('[Exploration') || text.includes('ENCOUNTER')) {
      logs.push(text);
    }
  });
  page.on('pageerror', err => {
    errors.push('PAGE ERROR: ' + err.message);
    console.log('PAGE ERROR:', err.message);
  });

  await page.goto('http://localhost:8080/?qa-room=it_office&qa-skip-onboarding&qa-no-save');
  await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30_000 });
  await page.waitForFunction(
    () => (window as any).__QA__?.currentRoomId === 'it_office',
    { timeout: 30_000 },
  );
  await page.waitForTimeout(1000);
  console.log('Step 1: IT Office loaded');

  // Trigger encounter
  await page.evaluate(() => window.__QA__!.commands.teleportTo(9, 6));
  await page.waitForTimeout(1500);

  // Click DEFEND THE NETWORK
  const defendBtn = page.locator('text=DEFEND THE NETWORK');
  await defendBtn.click({ timeout: 5000 });
  await page.waitForTimeout(2000);
  console.log('Step 2: Encounter launched');

  // Wait for BreachDefense scene
  await page.waitForFunction(
    () => (window as any).__QA__?.sceneReady === 'BreachDefense',
    { timeout: 10_000 },
  );
  console.log('Step 3: BreachDefense scene ready');

  // Force a quick victory by setting securityScore high and using EventBridge
  // to emit ENCOUNTER_COMPLETE directly — simulates winning the game
  await page.evaluate(() => {
    const eventBridge = (window as any).__QA__?.eventBridge;
    if (!eventBridge) {
      // Fallback: access Phaser game directly
      const games = (window as any).Phaser?.GAMES;
      if (games && games[0]) {
        const bd = games[0].scene.getScene('BreachDefense');
        if (bd) {
          // Force victory state
          (bd as any).gameState = 'VICTORY';
          (bd as any).securityScore = 85;
        }
      }
    }
  });

  // Emit encounter complete event through QA bridge event log
  await page.evaluate(() => {
    // Try to find and use the EventBridge
    const phaserGames = (window as any).Phaser?.GAMES;
    if (phaserGames?.[0]) {
      const bd = phaserGames[0].scene.getScene('BreachDefense') as any;
      if (bd?.encounterId) {
        bd.gameState = 'VICTORY';
        // Trigger the encounter victory method
        bd.onEncounterVictory?.();
      }
    }
  });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/return-01-after-victory.png' });

  // Check if debrief is showing
  const hasDebrief = await page.evaluate(() =>
    document.body.innerText.includes('RETURN TO HOSPITAL') ||
    document.body.innerText.includes('NETWORK SECURED') ||
    document.body.innerText.includes('BREACH CONTAINED')
  );
  console.log('Step 4: Debrief visible:', hasDebrief);

  if (!hasDebrief) {
    // If debrief not visible, the ENCOUNTER_COMPLETE event may not have fired.
    // Let's check what state we're in
    const state = await page.evaluate(() => ({
      breachState: (window as any).__QA__?.breachState,
      bodyText: document.body.innerText.substring(0, 200),
    }));
    console.log('State:', JSON.stringify(state));
    await page.screenshot({ path: 'test-results/return-02-no-debrief.png' });

    // Try again - emit the event directly
    console.log('Attempting direct EventBridge emit...');
    await page.evaluate(() => {
      // Find EventBridge via module scope — it's a singleton
      const detail = {
        encounterId: 'td-it-office',
        outcome: 'victory',
        securityScore: 85,
        scoreContribution: 10,
      };
      // Dispatch a custom event that UnifiedGamePage might catch
      window.dispatchEvent(new CustomEvent('encounter-complete-test', { detail }));
    });
    await page.waitForTimeout(1000);
  }

  // Try to click RETURN TO HOSPITAL
  const returnBtn = page.locator('text=RETURN TO HOSPITAL');
  const returnVisible = await returnBtn.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('Step 5: Return button visible:', returnVisible);

  if (returnVisible) {
    await page.screenshot({ path: 'test-results/return-03-before-click.png' });
    console.log('Step 6: Clicking RETURN TO HOSPITAL...');

    // Set up a race: either the page responds within 10s or it's hung
    const clickPromise = returnBtn.click();
    const timeoutPromise = page.waitForTimeout(10000);

    await Promise.race([clickPromise, timeoutPromise]);

    // Check if page is responsive
    await page.waitForTimeout(2000);
    const isResponsive = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(true), 100);
      });
    }).catch(() => false);

    console.log('Step 7: Page responsive after return:', isResponsive);
    await page.screenshot({ path: 'test-results/return-04-after-return.png' });

    if (isResponsive) {
      // Check if we're back in the IT Office
      const backState = await page.evaluate(() => ({
        roomId: (window as any).__QA__?.currentRoomId,
        sceneReady: (window as any).__QA__?.sceneReady,
        paused: (window as any).__QA__?.paused,
      }));
      console.log('Step 8: Back state:', JSON.stringify(backState));
    }
  }

  // Report errors
  const realErrors = errors.filter(e =>
    !e.includes('favicon') && !e.includes('404') && !e.includes('net::ERR') &&
    !e.includes('ResizeObserver') && !e.includes('WebSocket')
  );
  if (realErrors.length > 0) {
    console.log('Errors:', realErrors);
  }
});
