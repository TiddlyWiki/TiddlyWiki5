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
    // Take a screenshot when the test fails
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    }
  ],
});

