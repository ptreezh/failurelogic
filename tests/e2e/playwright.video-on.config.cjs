/**
 * tests/e2e/playwright.video-on.config.cjs
 *
 * Dedicated Playwright config for the deep-scenarios-coverage.spec.js run.
 * Forces always-on video recording (not retain-on-failure) so that the
 * comprehensive playthrough produces a .webm for every scenario.
 *
 * Diff vs tests/playwright.config.js:
 *   - video: 'on' (always record)
 *   - screenshot: 'on' (capture both on failure AND on demand)
 *   - workers: 1 (serial, avoid video/port contention)
 *   - testMatch: only deep-scenarios-coverage.spec.js
 *
 * Used by:
 *   npm run test:deep:frames
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: /deep-scenarios-coverage\.spec\.js$/,

  // Serial — videos and ports must not contend
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: 0,

  reporter: [
    ['list'],
    ['json', { outputFile: 'deep-coverage-results.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Always-on video (this is the whole point of this config)
    video: 'on',
    videoOptions: {
      // MP4 is more portable; WebM is default. Use size constraint to bound upload
      // (Playwright will downscale to fit).
      size: { width: 1280, height: 720 },
    },

    // Screenshot both on failure AND programmatically (page.screenshot())
    screenshot: 'on',

    trace: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: process.env.HEADLESS !== 'false',
      },
    },
  ],

  timeout: 180000, // 3 min per scenario playthrough (10 turns × ~10s + buffer)

  outputDir: '../test-results-deep',
});
