const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  // Look for test files in multiple locations
  testMatch: [
    'editions/test/**/*.spec.js',
    'plugins/**/tests/**/*.spec.js'
  ],

  timeout: 60000,

  // Allow parallel tests
  fullyParallel: true,

  // Prevent accidentally committed "test.only" from wrecking havoc
  forbidOnly: !!process.env.CI,

  // Do not retry tests on failure
  retries: 0,

  // How many parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],

  // Settings shared with all the tests
  use: {
    // Default to headless for stable automated runs; use --headed to override.
    headless: true,
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    // Limit individual actions (like click/type) so they don't hang indefinitely
    actionTimeout: 15000, 
  },

  expect: {
    // Give expect() assertions more time to find elements like '.jasmine-overall-result'
    timeout: 20000, 
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    {
      name: 'edge',
      use: { ...devices['Desktop Chrome'], channel: 'msedge' },
    }
  ],
});

