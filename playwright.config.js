const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './editions/test/',

  // Allow parallel tests
  fullyParallel: true,

  // Prevent accidentally committed "test.only" from wrecking havoc
  forbidOnly: !!process.env.CI,

  // Do not retry tests on failure
  retries: 0,

  // How many parallel workers. Use 1 to avoid N browsers loading the large
  // (~4 MB) self-contained test wiki simultaneously and hitting timeouts.
  // Increase this if your machine is powerful enough.
  workers: 1,

  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: 'html',

  // Automatically start (and rebuild) the test edition server before running tests.
  // In development, if a server is already running on the port it will be reused
  // (skipping the rebuild). Pass --no-build to the server script to skip the
  // rebuild even on a fresh start, or set SKIP_TW_BUILD=1.
  webServer: {
    command: process.env.SKIP_TW_BUILD
      ? 'node editions/test/start-server.js --no-build'
      : 'node editions/test/start-server.js',
    url: 'http://127.0.0.1:8765/',
    // Reuse an already-running server in development; always fresh in CI
    reuseExistingServer: !process.env.CI,
    // Allow up to 2 minutes: build (~10s) + server startup
    timeout: 2 * 60 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Settings shared with all the tests
  use: {
    // Base URL so tests can use page.goto('/test.html') instead of full URL
    baseURL: 'http://127.0.0.1:8765',

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
      use: {
        ...devices['Desktop Chrome'],
        // Use the full Chromium browser (not headless-shell) which is more
        // widely available. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to
        // override with a custom binary.
        channel: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? undefined : undefined,
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    }
  ],
});

