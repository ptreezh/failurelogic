/**
 * Playwright Configuration for Cognitive Trap Platform
 * TDD-driven E2E testing setup
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],

  // Global settings
  use: {
    // Base URL for tests - can be overridden via environment
    baseURL: process.env.BASE_URL || 'http://localhost:8000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Record video on failure
    video: 'retain-on-failure',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Global timeout for each action
    actionTimeout: 10000, // 10 seconds

    // Global timeout for navigation
    navigationTimeout: 30000, // 30 seconds

    // Ignore HTTPS errors for testing
    ignoreHTTPSErrors: true,

    // Disable caching for tests to ensure fresh JavaScript loads
    contextOptions: {
      // Bypass browser cache
      ignoreHTTPSErrors: true,
    },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'msedge',
      use: { 
        ...devices['Desktop Edge'],
        headless: false,  // Explicitly disable headless mode per constitution
      },
    },

    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        headless: false,  // Explicitly disable headless mode per constitution
      },
    },
  ],

  // Development server configuration
  webServer: [
    {
      // Run backend from repo root (Playwright runs this command from the tests/ folder)
      command: 'python ..\\api-server\\start.py 8000',
      port: 8000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000, // 2 minutes to start
    },
    {
      // Serve repo root so the static frontend is available if tests target it
      command: 'npx serve -l 3000 ..',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 30000, // 30 seconds to start
    }
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./global-setup.js'),
  globalTeardown: require.resolve('./global-teardown.js'),

  // Test timeout
  timeout: 60000, // 60 seconds per test

  // Output directory
  outputDir: 'test-results',

  // Test expectations
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000
  },

  // Metadata for tests
  metadata: {
    'Test Environment': process.env.NODE_ENV || 'test',
    'Browser': 'Playwright',
    'Test Type': 'E2E'
  }
});