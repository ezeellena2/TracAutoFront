import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E configuration for TracAuto Alquiler B2C portal.
 *
 * Usage:
 *   npx playwright test              # run all E2E tests
 *   npx playwright test --ui         # run with interactive UI
 *   npx playwright install           # install browsers (first time)
 *
 * Prerequisites:
 *   - Backend API running on http://localhost:8080
 *   - Frontend dev server: npm run dev:alquiler (port 5175)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev:alquiler',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
