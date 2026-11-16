import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Keys and URLs come from the environment; the server listens on 3000 by default.
const TWENTY_API_URL = process.env.TWENTY_API_URL ?? 'http://localhost:3000';
const TWENTY_API_KEY = process.env.TWENTY_API_KEY ?? '';

// test.env only reaches workers, globalSetup reads process.env.
process.env.TWENTY_API_URL = TWENTY_API_URL;

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ['tsconfig.spec.json'],
      ignoreConfigErrors: true,
    }),
  ],
  test: {
    testTimeout: 120_000,
    hookTimeout: 300_000,
    fileParallelism: false,
    include: ['src/**/*.integration-test.ts'],
    globalSetup: ['src/__tests__/global-setup.ts'],
    env: { TWENTY_API_URL, TWENTY_API_KEY, TZ: 'UTC' },
  },
});
