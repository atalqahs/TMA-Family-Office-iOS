import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Permanent test configuration (Phase 9A). Deliberately separate from
 * vite.config.ts (which is production-build-only) so test-only concerns
 * (jsdom, coverage, fake-indexeddb setup) never leak into the shipped app
 * bundle or its config.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    // Deterministic, isolated runs (Section P): no implicit shared globals,
    // every file gets its own module registry.
    isolate: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/**/index.ts',
      ],
    },
  },
});
