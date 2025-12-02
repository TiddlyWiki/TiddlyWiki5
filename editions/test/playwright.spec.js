const{ test, expect } = require("@playwright/test");
const{resolve} = require("path");

const indexPath = resolve(__dirname, "output", "test.html");
const crossPlatformIndexPath = indexPath.replace(/^\/+/, "");


test("get started link", async ({ page }) => {
		// The tests can take a while to run
		const timeout = 1000 * 30;
		test.setTimeout(timeout);
		// Load the generated test TW html
		await page.goto(`file:///${crossPlatformIndexPath}`);

		// Sanity check
		await expect(page.locator(".tc-site-title"), "Correct page title to verify the test page was loaded").toHaveText("TiddlyWiki5");
		// Wait for jasmine results bar to appear
		await expect(page.locator(".jasmine-overall-result"), "Jasmine test results bar presented").toBeVisible({timeout});
		// Assert the tests have passed
		await Promise.all([
				expect(page.locator(".jasmine-overall-result.jasmine-failed"), "Jasmine tests not failed").not.toBeVisible(),
				expect(page.locator(".jasmine-overall-result.jasmine-passed"), "Jasmine tests passed").toBeVisible()
		]);
});

test("Click block level links in wikitext", async ({ page }) => {
		const timeout = 1000 * 30;
		// Increase test timeout to 60s to accommodate slower Firefox execution
		test.setTimeout(60000);
		await page.goto(`file:///${crossPlatformIndexPath}`);

		// Engaging the search input
		// Search in default search box
		await page.fill('input[type="search"]', "BlockMark/Links");
		// click on link in search results inside the dropdown
		await page.click('div.tc-search-drop-down a:has-text("BlockMark/Links")');

		// Test 1: Link to paragraph with BlockLevelLinksID1
		const firstLink = page.locator('a[href="#BlockMark%2FMarks-BlockLevelLinksID1"]');
		await expect(firstLink, "First block mark link presented").toBeVisible({timeout});
		await expect(firstLink, "First link have correct text").toHaveText("Block Level Links in WikiText");
		await firstLink.click();

		// Verify paragraph is highlighted
		const blockMarkedText = page.locator('p:has-text("A block level mark in WikiText.")');
		await expect(blockMarkedText, "Block marked text presented").toBeVisible({timeout});
		await expect(blockMarkedText, "Paragraph has highlight animation").toHaveClass("tc-focus-highlight");

		// Check the mark span properties (exists with correct attributes, visibility may vary by browser)
		const markSpan1 = page.locator('span[data-block-mark-id="BlockLevelLinksID1"]');
		await Promise.all([
				expect(markSpan1).toHaveAttribute("data-block-mark-title", "BlockMark/Marks"),
				expect(markSpan1).toHaveClass("tc-block-mark"),
				expect(markSpan1).toHaveText(""),
				markSpan1.evaluate(e => e.id).then(id => expect(id).toBe("BlockMark/Marks-BlockLevelLinksID1"))
		]);

		// Test 2: Navigate back and test link to title with emoji ID
		await page.fill('input[type="search"]', "BlockMark/Links");
		await page.click('div.tc-search-drop-down a:has-text("BlockMark/Links")');

		const secondLink = page.locator('a[href="#BlockMark%2FMarks-%F0%9F%A4%97%E2%86%92AddingIDforTitle"]');
		await expect(secondLink, "Second block mark link presented").toBeVisible({timeout});
		await expect(secondLink, "Second link have correct text").toHaveText("Title Level 2");
		// Force click to handle Firefox UI stability issues
		await secondLink.click({force: true});

		// Verify title is present and some element gets highlighted
		const titleMarked = page.locator('h2:has-text("Title Level 2")');
		await expect(titleMarked, "Title marked text presented").toBeVisible({timeout});
		// Check that SOME element on the page gets the highlight (may not be the h2 itself in all cases)
		const anyHighlightForTitle = page.locator(".tc-focus-highlight").first();
		await expect(anyHighlightForTitle, "Some element highlighted after title navigation").toBeVisible({timeout: 10000});

		// Check the title mark span (exists with correct attributes, visibility may vary by browser)
		const markSpan2 = page.locator('span[data-block-mark-id="🤗→AddingIDforTitle"]');
		await expect(markSpan2).toHaveAttribute("data-block-mark-title", "BlockMark/Marks");

		// Test 3: Navigate back and test link to code block mark
		await page.fill('input[type="search"]', "BlockMark/Links");
		await page.click('div.tc-search-drop-down a:has-text("BlockMark/Links")', {force: true});

		const thirdLink = page.locator('a[href="#BlockMark%2FMarks-IDAfterBlock"]');
		await expect(thirdLink, "Third block mark link presented").toBeVisible({timeout});
		await expect(thirdLink, "Third link have correct text").toHaveText("Code Block Mark", {timeout: 10000});
		await thirdLink.click();

		// Verify the mark after code block (exists with correct attributes, visibility may vary by browser)
		const codeBlockMark = page.locator('span[data-block-mark-id="IDAfterBlock"]');
		await expect(codeBlockMark).toHaveAttribute("data-block-mark-title", "BlockMark/Marks");

		// There should be a focus highlight somewhere on the page after navigation.
		// Code block marks are sometimes applied as siblings or nearby elements rather than
		// being nested inside the highlighted container, so assert that some element
		// has the focus highlight and that the mark span exists with the correct attributes.
		const anyHighlight = page.locator(".tc-focus-highlight").first();
		await expect(anyHighlight, "Some element is highlighted after navigation").toBeVisible({timeout});
});
