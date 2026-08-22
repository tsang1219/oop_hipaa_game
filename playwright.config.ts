import { defineConfig } from '@playwright/test';

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
    baseURL: 'http://localhost:8080',
    viewport: { width: 1280, height: 960 },
    actionTimeout: 30_000,
  },
  webServer: {
    command: 'npm run dev',
    port: 8080,
    reuseExistingServer: true,
    timeout: 30_000,
  },
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'tests/qa-pipeline/test-results.json' }],
  ],
});
