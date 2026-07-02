import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Run 07 (test-harness fix): only collect real vitest files. A bare
    // `vitest run` used to pick up the 14 Playwright .spec.ts files (all
    // fail under vitest) and the two node-script .test.mts files.
    include: ['client/src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
});
