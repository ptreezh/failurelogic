// Standalone config for e2e verification — no video/trace/screenshot so it
// doesn't need ffmpeg. Used to validate challenger UI end-to-end.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'D:/AIDevelop/failureLogic/tests/e2e',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    video: 'off',
    trace: 'off',
    screenshot: 'off',
    headless: true,
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], headless: true } },
  ],
});