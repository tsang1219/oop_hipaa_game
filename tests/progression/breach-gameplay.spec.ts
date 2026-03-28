import { test, expect } from '@playwright/test';
import {
  trackErrors,
  filterBenignErrors,
  waitForQA,
  qaState,
  SETTLE_MS,
} from '../helpers/qa-helpers';

// NOTE: BreachDefense runs as an encounter within ExplorationScene in v2.
// The standalone /breach route no longer exists (App.tsx only has /).
// These tests are skipped until BreachDefense is testable via the encounter
// system in the IT Office or a restored standalone route.

test.describe('BreachDefense Gameplay', () => {
  test.describe.configure({ timeout: 90_000 });

  test.skip('Breach defense page loads', async ({ page }) => {
    // /breach route does not exist in v2
  });

  test.skip('Start Mission button begins game', async ({ page }) => {
    // /breach route does not exist in v2
  });

  test.skip('Game auto-start via qa-start param', async ({ page }) => {
    // /breach route does not exist in v2
  });

  test.skip('No console errors during breach gameplay', async ({ page }) => {
    // /breach route does not exist in v2
  });
});
