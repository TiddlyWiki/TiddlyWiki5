/*\
title: editions/test/playwright.spec.js
type: application/javascript

Playwright E2E tests for TiddlyWiki5.

The test server (editions/test/start-server.js) is started automatically by
playwright.config.js via the webServer option. Tests use the baseURL
http://127.0.0.1:8765 so page.goto('/test.html') loads the test wiki.
\*/

const { test, expect } = require("@playwright/test");

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Open the TW test page and wait for TW to be ready.
 */
async function loadTestWiki(page) {
	// The test wiki is a self-contained ~4 MB HTML file; allow plenty of time.
	await page.goto("/test.html", { waitUntil: "domcontentloaded", timeout: 60000 });
	await expect(
		page.locator(".tc-site-title"),
		"Correct page title to verify the test page was loaded"
	).toHaveText("TiddlyWiki5", { timeout: 60000 });
}

/**
 * Open a tiddler by typing its title in the search box and clicking the
 * first matching result in the search drop-down.
 */
async function openTiddler(page, title) {
	await page.fill('input[type="search"]', title);
	await page.click(`div.tc-search-drop-down a:has-text("${title}")`);
}

// ─── tests ────────────────────────────────────────────────────────────────────

test("Jasmine unit tests pass", async ({ page }) => {
	const timeout = 60 * 1000;
	test.setTimeout(timeout);

	await loadTestWiki(page);

	// Wait for jasmine results bar to appear
	await expect(
		page.locator(".jasmine-overall-result"),
		"Jasmine test results bar presented"
	).toBeVisible({ timeout });

	// Assert the tests have passed
	await Promise.all([
		expect(
			page.locator(".jasmine-overall-result.jasmine-failed"),
			"Jasmine tests not failed"
		).not.toBeVisible(),
		expect(
			page.locator(".jasmine-overall-result.jasmine-passed"),
			"Jasmine tests passed"
		).toBeVisible()
	]);
});

test("Anchor links navigate and highlight correctly", async ({ page }) => {
	const timeout = 30 * 1000;
	test.setTimeout(60 * 1000);

	await loadTestWiki(page);
	await openTiddler(page, "Anchor/Links");

	// ── Test 1: link → paragraph anchor ──────────────────────────────────────
	const firstLink = page.locator('a[href="#Anchor%2FMarks%5E%5EBlockLevelLinksID1"]');
	await expect(firstLink, "Paragraph anchor link is visible").toBeVisible({ timeout });
	await expect(firstLink, "Paragraph anchor link text").toHaveText("Block Level Links in WikiText");
	await firstLink.click();

	const markedPara = page.locator('p[data-tw-anchor="BlockLevelLinksID1"]');
	await expect(markedPara, "Marked paragraph is visible").toBeVisible({ timeout });
	await expect(markedPara, "Paragraph receives focus highlight").toHaveClass(/tc-focus-highlight/);
	await expect(markedPara).toHaveAttribute("data-tw-anchor", "BlockLevelLinksID1");
	// id = tiddlerTitle^^anchor
	const paraId = await markedPara.evaluate((e) => e.id);
	expect(paraId, "Paragraph id uses ^^ separator").toBe("Anchor/Marks^^BlockLevelLinksID1");

	// ── Test 2: link → heading anchor ────────────────────────────────────────
	await openTiddler(page, "Anchor/Links");

	const secondLink = page.locator('a[href="#Anchor%2FMarks%5E%5EAddingIDforTitle"]');
	await expect(secondLink, "Heading anchor link is visible").toBeVisible({ timeout });
	await expect(secondLink, "Heading anchor link text").toHaveText("Title Level 2");
	await secondLink.click({ force: true });

	const markedHeading = page.locator('h2[data-tw-anchor="AddingIDforTitle"]');
	await expect(markedHeading, "Marked heading is visible").toBeVisible({ timeout });
	await expect(
		page.locator(".tc-focus-highlight").first(),
		"Some element receives highlight after heading navigation"
	).toBeVisible({ timeout: 10 * 1000 });
	const headingId = await markedHeading.evaluate((e) => e.id);
	expect(headingId, "Heading id uses ^^ separator").toBe("Anchor/Marks^^AddingIDforTitle");

	// ── Test 3: link → code anchor ─────────────────────────────────────
	await openTiddler(page, "Anchor/Links");

	const thirdLink = page.locator('a[href="#Anchor%2FMarks%5E%5EcodeAnchor"]');
	await expect(thirdLink, "Code anchor link is visible").toBeVisible({ timeout });
	await expect(thirdLink, "Code anchor link text").toHaveText("Code Anchor", { timeout: 10 * 1000 });
	await thirdLink.click();

	const markedCode = page.locator('pre[data-tw-anchor="codeAnchor"]');
	await expect(markedCode, "Marked code block is visible").toBeVisible({ timeout });
	await expect(markedCode).toHaveAttribute("data-tw-anchor", "codeAnchor");
	const codeId = await markedCode.evaluate((e) => e.id);
	expect(codeId, "Code anchor id uses ^^ separator").toBe("Anchor/Marks^^codeAnchor");
	await expect(
		page.locator(".tc-focus-highlight").first(),
		"Some element receives highlight after code block navigation"
	).toBeVisible({ timeout });
});

test("Single block transclusion renders only the marked block", async ({ page }) => {
	const timeout = 30 * 1000;
	test.setTimeout(60 * 1000);

	await loadTestWiki(page);
	await openTiddler(page, "Anchor/Transclusion");

	const tiddlerBody = page.locator('[data-tiddler-title="Anchor/Transclusion"] .tc-tiddler-body');
	await expect(tiddlerBody, "Transclusion tiddler body is visible").toBeVisible({ timeout });

	// Single block transclusion: {{Anchor/Marks^BlockLevelLinksID1}}
	// Renders only the "A block level mark in WikiText." paragraph
	const singleBlock = tiddlerBody.locator('p[data-tw-anchor="BlockLevelLinksID1"]').first();
	await expect(singleBlock, "Single transcluded block is present").toBeVisible({ timeout });
	await expect(singleBlock).toHaveAttribute("data-tw-anchor", "BlockLevelLinksID1");
	const singleAnchor = await singleBlock.evaluate((e) => e.id);
	expect(singleAnchor, "Single anchor id contains source tiddler title").toBe("Anchor/Marks^^BlockLevelLinksID1");

	// The first paragraph of Anchor/Marks ("First normal paragraph.") must NOT appear —
	// only the specific anchored block was requested
	const firstPara = tiddlerBody.locator('p:has-text("First normal paragraph")');
	await expect(firstPara, "Non-targeted paragraphs are not transcluded").not.toBeVisible();
});

test("Range transclusion renders all blocks between two anchors", async ({ page }) => {
	const timeout = 30 * 1000;
	test.setTimeout(60 * 1000);

	await loadTestWiki(page);
	await openTiddler(page, "Anchor/Transclusion");

	const tiddlerBody = page.locator('[data-tiddler-title="Anchor/Transclusion"] .tc-tiddler-body');
	await expect(tiddlerBody, "Transclusion tiddler body is visible").toBeVisible({ timeout });

	// Range transclusion: {{Anchor/Marks^BlockLevelLinksID1^AddingIDforTitle}}
	// Should render: paragraph (BlockLevelLinksID1) + heading (AddingIDforTitle)

	// The heading at the range end must be present
	const rangeHeading = tiddlerBody.locator('h2[data-tw-anchor="AddingIDforTitle"]');
	await expect(rangeHeading, "Heading at range end is present").toBeVisible({ timeout });
	const rangeHeadingId = await rangeHeading.evaluate((e) => e.id);
	expect(rangeHeadingId, "Range heading id correct").toBe("Anchor/Marks^^AddingIDforTitle");

	// The paragraph at the range start appears twice: once from single block, once from range
	const rangeParagraphs = tiddlerBody.locator('p[data-tw-anchor="BlockLevelLinksID1"]');
	const count = await rangeParagraphs.count();
	expect(count, "Range start paragraph present in both single and range transclusions").toBeGreaterThanOrEqual(2);

	// Paragraphs after the range end ("A final paragraph without ID") must NOT appear
	const afterRange = tiddlerBody.locator('p:has-text("A final paragraph")');
	await expect(afterRange, "Paragraphs after range end are not included").not.toBeVisible();

	// The code block (after AddingIDforTitle, outside the range) must also be absent
	const outOfRangeCode = tiddlerBody.locator('pre[data-tw-anchor="codeAnchor"]');
	await expect(outOfRangeCode, "Code block after range end is not included").not.toBeVisible();
});

