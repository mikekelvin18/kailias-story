import { defineConfig, devices } from '@playwright/test';

// Automatic game checks. Robot players open every game, play its levels
// to the finish and check that right answers are marked right and misses
// get kind, honest feedback.
//
//   npm run test:games          – builds nothing; starts the built app (npm run build first)
//   BASE_URL=https://… npm run test:games   – checks a deployed preview instead
const baseURL = process.env.BASE_URL || 'http://localhost:3100';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 3 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'only-on-failure',
    // Vercel previews can sit behind a login; a bypass token gets the robot in
    extraHTTPHeaders: process.env.VERCEL_BYPASS
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_BYPASS, 'x-vercel-set-bypass-cookie': 'true' }
      : undefined,
  },
  projects: [
    { name: 'logic', testMatch: /logic\/.*\.spec\.ts/ },
    { name: 'computer', testMatch: /e2e\/.*\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } } },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npx next start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
