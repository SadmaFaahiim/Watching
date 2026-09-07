import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end smoke suite. Runs against the production build (vite preview) in
 * demo mode, so it exercises the real bundle + mock adapter with no backend.
 * `npm run test:e2e` builds first; CI runs the build as its own step.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4188',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --port 4188 --strictPort',
    url: 'http://localhost:4188',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
