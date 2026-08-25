import { defineConfig } from '@playwright/test';

// Run 14: PW_PORT points the suite at a dev server other than :8080 — needed
// when two checkouts run side by side (e.g. a worktree's server on :8090).
const PORT = parseInt(process.env.PW_PORT || '8080', 10);

export default defineConfig({
  testDir: './tests',
  // Run 07 (test-harness fix): only collect Playwright specs. The default
  // pattern also matched tests/*.test.mts — node assert scripts with no
  // test() calls, which Playwright mis-collected.
  testMatch: '**/*.spec.ts',
  outputDir: './test-results',
  timeout: 60_000,
  retries: 1,
  workers: 1,
  use: {
    // Run 12: PW_CHANNEL=chrome runs the suite in the installed Google Chrome
    // when the bundled Chromium isn't downloaded (undefined = Playwright default).
    channel: process.env.PW_CHANNEL || undefined,
    baseURL: `http://localhost:${PORT}`,
    // Run 11: the game box is an integer multiple of 640×480; 1400×1100 yields a 2× (1280×960) canvas.
    viewport: { width: 1400, height: 1100 },
    actionTimeout: 30_000,
  },
  webServer: {
    command: process.env.PW_PORT ? `PORT=${PORT} npm run dev` : 'npm run dev',
    port: PORT,
    reuseExistingServer: true,
    timeout: 30_000,
  },
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'tests/qa-pipeline/test-results.json' }],
  ],
});
