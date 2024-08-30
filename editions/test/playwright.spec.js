const { test, expect } = require('@playwright/test');
const {resolve} = require('path');

const indexPath = resolve(__dirname, 'output', 'test.html');
const crossPlatformIndexPath = indexPath.replace(/^\/+/, '');


test('get started link', async ({ page }) => {
    // The tests can take a while to run
    const timeout = 1000 * 30;
    test.setTimeout(timeout);

    // Load the generated test TW html
    await page.goto(`file:///${crossPlatformIndexPath}`);

    // Sanity check
    await expect(page.locator('.tc-site-title'), "Expected correct page title to verify the test page was loaded").toHaveText('TiddlyWiki5');

    // Wait for jasmine results bar to appear
    await expect(page.locator('.jasmine-overall-result'), "Expected jasmine test results bar to be present").toBeVisible({timeout});

    // Assert the tests have passed
    await expect(page.locator('.jasmine-overall-result.jasmine-failed'), "Expected jasmine tests to not have failed").not.toBeVisible();
    await expect(page.locator('.jasmine-overall-result.jasmine-passed'), "Expected jasmine tests to have passed").toBeVisible();
});
