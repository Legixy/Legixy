import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Unit tests for pure frontend logic only.
 *
 * Component rendering is verified by real browser QA against the running app
 * rather than jsdom, so no DOM environment or testing-library is installed.
 * What is tested here is the logic that browser QA cannot prove safe in every
 * environment: date formatting, which must produce the same calendar date on
 * a machine in Riyadh and one in Los Angeles.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
