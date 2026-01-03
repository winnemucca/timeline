/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/setup-tests.ts'],
    include: ['src/**/*.spec.ts'],
    clearMocks: true,
  },
  plugins: [tsconfigPaths()],
});
