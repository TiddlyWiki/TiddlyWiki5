const { test, expect } = require("@playwright/test");
const { resolve } = require("path");
const { pathToFileURL } = require("url");

const indexPath = resolve(__dirname, "output", "test.html");
const indexUrl = pathToFileURL(indexPath).href;


test("full browser Jasmine suite", { tag: "@full-jasmine" }, async ({ page }) => {
	// This one browser test runs the entire Jasmine suite. Leave a separate
	// budget for page startup and teardown on shared CI runners.
	const timeout = 1000 * 90;
	test.setTimeout(timeout + 1000 * 30);

	// Avoid long offline stalls if the generated test page references external assets.
	await page.route(/^https?:/, (route) => route.abort());

	// Load the generated test TW html
	await page.goto(indexUrl, { waitUntil: "domcontentloaded" });

	// Sanity check
	await expect(page.locator(".tc-site-title"), "Expected correct page title to verify the test page was loaded").toHaveText("TiddlyWiki5");

	// Wait for jasmine results bar to appear
	await expect(page.locator(".jasmine-overall-result"), "Expected jasmine test results bar to be present").toBeVisible({timeout});

	// Assert the tests have passed
	await expect(page.locator(".jasmine-overall-result.jasmine-failed"), "Expected jasmine tests to not have failed").not.toBeVisible();
	await expect(page.locator(".jasmine-overall-result.jasmine-passed"), "Expected jasmine tests to have passed").toBeVisible();
});
