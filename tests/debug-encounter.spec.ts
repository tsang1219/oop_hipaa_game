/**
 * Debug test: IT Office → Breach Defense encounter flow
 * Takes screenshots at each step to diagnose rendering issues.
 */
import { test, expect } from '@playwright/test';

test('IT Office encounter flow diagnostic', async ({ page }) => {
  // Increase timeout for this diagnostic test
  test.setTimeout(120_000);

  // Track console messages
  const errors: string[] = [];
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    const text = msg.text();
    if (text.includes('[BreachDefense]') || text.includes('[Exploration]')) {
      logs.push(text);
      console.log('GAME LOG:', text);
    }
  });
  page.on('pageerror', err => errors.push(err.message));

  // Load the game directly into IT Office using qa-room param
  // Also skip onboarding + save to avoid modals
  await page.goto('http://localhost:8080/?qa-room=it_office&qa-skip-onboarding&qa-no-save');

  // Take early screenshot to see what loaded
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/encounter-00-initial-load.png' });

  // Check page content
  const pageContent = await page.evaluate(() => ({
    hasQA: !!(window as any).__QA__,
    hasCanvas: !!document.querySelector('canvas'),
    bodyText: document.body.innerText.substring(0, 500),
    url: window.location.href,
  }));
  console.log('Page state:', JSON.stringify(pageContent));

  // If there's an intro modal, dismiss it
  const startBtn = page.locator('button:has-text("BEGIN"), button:has-text("Start"), button:has-text("Continue"), button:has-text("Play")');
  if (await startBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Found start button, clicking...');
    await startBtn.first().click();
    await page.waitForTimeout(1000);
  }

  // Wait for QA bridge with longer timeout
  await page.waitForFunction(() => !!(window as any).__QA__, { timeout: 30_000 });
  console.log('QA bridge found');

  // Wait for room
  await page.waitForFunction(
    () => (window as any).__QA__?.currentRoomId === 'it_office',
    { timeout: 30_000 },
  );
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'test-results/encounter-01-it-office.png' });
  console.log('Step 1: IT Office loaded');

  // Get current state
  const state1 = await page.evaluate(() => ({
    roomId: window.__QA__?.currentRoomId,
    playerPos: window.__QA__?.playerPosition,
    sceneReady: window.__QA__?.sceneReady,
    scenesVisited: window.__QA__?.scenesVisited,
  }));
  console.log('State 1:', JSON.stringify(state1));

  // Teleport player near the Security Analyst (at 10,7) - encounter zone is at (9,6)
  await page.evaluate(() => {
    window.__QA__!.commands.teleportTo(9, 8);
  });
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'test-results/encounter-02-near-analyst.png' });
  console.log('Step 2: Teleported near Security Analyst');

  // Move closer to trigger encounter zone (9,6)
  await page.evaluate(() => {
    window.__QA__!.commands.teleportTo(9, 6);
  });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: 'test-results/encounter-03-trigger-zone.png' });
  console.log('Step 3: At encounter trigger zone');

  // Check if narrative card appeared
  const hasNarrativeCard = await page.evaluate(() => {
    // Look for the NarrativeContextCard text
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      if (el.textContent?.includes('SECURITY ALERT')) return true;
      if (el.textContent?.includes('DEFEND THE NETWORK')) return true;
    }
    return false;
  });
  console.log('Narrative card visible:', hasNarrativeCard);

  if (!hasNarrativeCard) {
    // Try interacting with the Security Analyst directly
    console.log('No narrative card - trying NPC interaction...');
    await page.evaluate(() => {
      window.__QA__!.commands.teleportTo(10, 8);
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => window.__QA__!.commands.pressSpace());
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/encounter-03b-after-interact.png' });
  }

  // Click "DEFEND THE NETWORK" if visible
  const defendBtn = page.locator('text=DEFEND THE NETWORK');
  if (await defendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Step 4: Clicking DEFEND THE NETWORK');
    await defendBtn.click();
    await page.waitForTimeout(2000); // Wait for fade + scene launch

    await page.screenshot({ path: 'test-results/encounter-04-after-confirm.png' });

    // Wait longer for scene to fully load
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/encounter-05-breach-scene.png' });

    // Check breach state
    const breachState = await page.evaluate(() => ({
      breachState: window.__QA__?.breachState,
      sceneReady: window.__QA__?.sceneReady,
      scenesVisited: window.__QA__?.scenesVisited,
    }));
    console.log('Breach state:', JSON.stringify(breachState));

    // Check if grid/canvas has content (not just black)
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { found: false };
      const ctx = canvas.getContext('2d');
      if (!ctx) return { found: true, context: false };
      const imageData = ctx.getImageData(320, 240, 1, 1).data;
      return {
        found: true,
        context: true,
        centerPixel: Array.from(imageData),
        width: canvas.width,
        height: canvas.height,
      };
    });
    console.log('Canvas info:', JSON.stringify(canvasInfo));

    // Check what React UI is rendered
    const uiState = await page.evaluate(() => {
      const hasOnboarding = !!document.querySelector('.z-30'); // OnboardingOverlay uses z-30
      const hasTowerPanel = document.body.innerText.includes('DEFENSES');
      const hasWelcome = document.body.innerText.includes('MISSION BRIEF');
      const hasSelectTower = document.body.innerText.includes('Pick a defense');
      const hasBudget = document.body.innerText.includes('BUDGET');
      const hasWave = document.body.innerText.includes('WAVE');
      return { hasOnboarding, hasTowerPanel, hasWelcome, hasSelectTower, hasBudget, hasWave };
    });
    console.log('UI state:', JSON.stringify(uiState));

    // Wait for more potential loading
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/encounter-06-final.png' });

    // Check for Phaser scene manager state — search for game instance
    const sceneState = await page.evaluate(() => {
      // Try to find the Phaser game instance in various ways
      const game = (window as any).__PHASER_GAME__
        || (window as any).game
        || document.querySelector('canvas')?.__phaser__;

      if (!game) {
        // Search through Phaser's global registry
        const phaserGames = (window as any).Phaser?.GAMES;
        if (phaserGames && phaserGames.length > 0) {
          const g = phaserGames[0];
          const allScenes = g.scene.scenes.map((s: any) => ({
            key: s.sys.settings.key,
            status: s.sys.settings.status,
            active: s.sys.settings.active,
            visible: s.sys.settings.visible,
          }));
          return { gameFound: true, via: 'Phaser.GAMES', scenes: allScenes };
        }
        return { gameFound: false, canvasFound: !!document.querySelector('canvas') };
      }

      const allScenes = game.scene.scenes.map((s: any) => ({
        key: s.sys.settings.key,
        status: s.sys.settings.status,
        active: s.sys.settings.active,
        visible: s.sys.settings.visible,
      }));
      return { gameFound: true, via: 'direct', scenes: allScenes };
    });
    console.log('Scene state:', JSON.stringify(sceneState));
  }

  // Step 7: Try clicking a tower button
  console.log('Step 7: Attempting to click a tower...');
  const towerBtn = page.locator('button:has-text("MFA Shield")');
  const towerVisible = await towerBtn.isVisible({ timeout: 2000 }).catch(() => false);
  console.log('MFA Shield button visible:', towerVisible);

  if (towerVisible) {
    await towerBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/encounter-07-tower-selected.png' });

    const isSelected = await towerBtn.evaluate(el => el.className.includes('border-yellow'));
    console.log('Tower selected (has yellow border):', isSelected);

    const stateAfterSelect = await page.evaluate(() => ({
      breachState: window.__QA__?.breachState,
    }));
    console.log('State after tower select:', JSON.stringify(stateAfterSelect));

    // Step 8: Try clicking on the grid to place the tower
    console.log('Step 8: Clicking grid to place tower...');
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/encounter-08-tower-placed.png' });

    const stateAfterPlace = await page.evaluate(() => ({
      breachState: window.__QA__?.breachState,
    }));
    console.log('State after tower place:', JSON.stringify(stateAfterPlace));
  } else {
    const allButtons = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim().substring(0, 50),
        visible: b.offsetParent !== null,
        disabled: b.disabled,
      }))
    );
    console.log('All buttons:', JSON.stringify(allButtons));
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/encounter-09-end-state.png' });

  // Print any errors
  if (errors.length > 0) {
    console.log('Console errors:', errors.filter(e =>
      !e.includes('favicon') && !e.includes('404') && !e.includes('net::ERR')
    ));
  }
});
