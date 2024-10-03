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
    await expect(page.locator('.tc-site-title'), "Correct page title to verify the test page was loaded").toHaveText('TiddlyWiki5');
    // Wait for jasmine results bar to appear
    await expect(page.locator('.jasmine-overall-result'), "Jasmine test results bar presented").toBeVisible({timeout});
    // Assert the tests have passed
    await Promise.all([
        expect(page.locator('.jasmine-overall-result.jasmine-failed'), "Jasmine tests not failed").not.toBeVisible(),
        expect(page.locator('.jasmine-overall-result.jasmine-passed'), "Jasmine tests passed").toBeVisible()
    ]);
});

test('Search tiddler with link and navigate to block mark', async ({ page }) => {
    const timeout = 1000 * 30;
    test.setTimeout(timeout);
    await page.goto(`file:///${crossPlatformIndexPath}`);

    // Engaging the search input
    // Search in default search box
    await page.fill('input[type="search"]', 'BlockMark/Links');
    // click on link in search results inside the dropdown
    await page.click('div.tc-search-drop-down a:has-text("BlockMark/Links")');
    // wait for link to appear and check its href
    const searchResultLink = page.locator('a:has-text("Block Level Links in WikiText")');
    await expect(searchResultLink, "Search result link presented").toBeVisible({timeout});
    await expect(searchResultLink, "Search result link have correct href").toHaveAttribute('href', '#BlockMark%2FMarks-BlockLevelLinksID1');
    // click on this link
    await page.click('a:has-text("Block Level Links in WikiText")');

    // The tiddler should be opened and operational, allow clicking link to navigate to block mark
    // wait for tiddler to appear and the block focused, and check its properties
    const blockMarkedText = page.locator('p:has-text("A block level mark in WikiText.")');
    await expect(blockMarkedText, "Block marked text presented").toBeVisible({timeout});
    await expect(blockMarkedText, "A highlight animation").toHaveClass('tc-focus-highlight');
    // Check the mark span properties
    const markSpan = page.locator('span[data-block-mark-id="BlockLevelLinksID1"]')
    await expect(markSpan, "Mark span presented but not visible").not.toBeVisible({timeout}),
    await Promise.all([
        expect(markSpan).toHaveAttribute('data-block-mark-title', 'BlockMark/Marks'),
        expect(markSpan).toHaveClass('tc-block-mark'),
        expect(markSpan).toHaveText(''),
        expect(markSpan).toHaveClass('tc-block-mark'),
        markSpan.evaluate(e => e.id).then(id => expect(id).toBe('BlockMark/Marks-BlockLevelLinksID1'))
    ])
});
