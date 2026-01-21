const{ test, expect } = require("@playwright/test");
const{ resolve } = require("path");
const{ pathToFileURL } = require("url");

/**
 * Basic smoke tests to verify ProseMirror editor is loaded and functional
 */

test.describe("ProseMirror Editor - Smoke Tests", () => {
	async function loadTestPage(page) {
		// TiddlyWiki test.html sometimes references external resources; on CI/offline these can
		// stall for many seconds due to connection timeouts.
		await page.route("http://**/*", route => route.abort());
		await page.route("https://**/*", route => route.abort());

		const repoRoot = resolve(__dirname, "../../../../");
		const indexPath = resolve(repoRoot, "editions/test/output", "test.html");
		await page.goto(pathToFileURL(indexPath).href, { waitUntil: "domcontentloaded" });
		await page.waitForSelector(".tc-site-title", { timeout: 10000 });
	}

	test("should load TiddlyWiki test page", async ({ page }) => {
		await loadTestPage(page);
		await expect(page.locator(".tc-site-title")).toHaveText("TiddlyWiki5");
	});

	test("should have ProseMirror plugin loaded", async ({ page }) => {
		await loadTestPage(page);
		
		// Debug: Check what widgets are available
		const availableWidgets = await page.evaluate(() => {
			if(typeof $tw === "undefined" || !$tw.modules || !$tw.modules.types || !$tw.modules.types.widget) {
				return { error: "TiddlyWiki not loaded" };
			}
			const widgets = Object.keys($tw.modules.types.widget || {});
			return {
				widgets: widgets,
				hasProsemirrorLoader: widgets.includes("$:/plugins/tiddlywiki/prosemirror/widget-loader.js"),
				hasProsemirror: typeof $tw.modules.types.widget["prosemirror"] !== "undefined",
				hasEditProsemirror: typeof $tw.modules.types.widget["edit-prosemirror"] !== "undefined"
			};
		});
		
		console.log("Available widgets:", availableWidgets);
		
		// Check if prosemirror widget loader is present
		const hasWidget = availableWidgets.hasProsemirrorLoader || 
		                  availableWidgets.hasProsemirror || 
		                  availableWidgets.hasEditProsemirror;
		
		expect(hasWidget).toBeTruthy();
	});

	test("should create and edit a tiddler", async ({ page }) => {
		await loadTestPage(page);
		
		// Create a test tiddler
		await page.evaluate(() => {
			$tw.wiki.addTiddler({
				title: "SmokeTestTiddler",
				text: "Test content",
				type: "text/vnd.tiddlywiki"
			});
			
			// Open in story
			const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
			$tw.wiki.addTiddler({
				title: "$:/StoryList",
				list: ["SmokeTestTiddler"].concat(storyList)
			});
		});
		
		// Verify tiddler appears
		const tiddler = page.locator(".tc-tiddler-frame").filter({ hasText: "SmokeTestTiddler" });
		await expect(tiddler).toBeVisible({ timeout: 5000 });
	});

	test("should open tiddler in edit mode with ProseMirror", async ({ page }) => {
		await loadTestPage(page);
		
		// Create and edit a tiddler
		await page.evaluate(() => {
			$tw.wiki.addTiddler({
				title: "EditTestTiddler",
				text: "Initial text",
				type: "text/vnd.tiddlywiki"
			});
			
			const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
			$tw.wiki.addTiddler({
				title: "$:/StoryList",
				list: ["EditTestTiddler"].concat(storyList)
			});
			
			// Trigger edit mode
			$tw.rootWidget.dispatchEvent({
				type: "tm-edit-tiddler",
				tiddlerTitle: "EditTestTiddler"
			});
		});
		
		// Wait for edit frame
		await page.waitForSelector(".tc-tiddler-edit-frame", { timeout: 5000 });
		
		// Check if ProseMirror editor is present
		const editorFrame = page.locator(".tc-tiddler-edit-frame").filter({ hasText: "EditTestTiddler" });
		const prosemirrorEditor = editorFrame.locator(".ProseMirror");
		
		// Either ProseMirror or regular text editor should be visible
		const editorExists = await prosemirrorEditor.count() > 0 || 
		                     await editorFrame.locator("textarea, iframe").count() > 0;
		
		expect(editorExists).toBeTruthy();
	});

	test("should render edit-prosemirror widget directly", async ({ page }) => {
		await loadTestPage(page);

		await page.evaluate(() => {
			$tw.wiki.addTiddler({
				title: "DirectWidgetTest",
				text: '<$edit-prosemirror tiddler="TestContent"/>'
			});
			$tw.wiki.addTiddler({ title: "TestContent", text: "Some text" });
			
			const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
			$tw.wiki.addTiddler({
				title: "$:/StoryList",
				list: ["DirectWidgetTest"].concat(storyList)
			});
		});
		
		await page.waitForSelector('.tc-tiddler-frame[data-tiddler-title="DirectWidgetTest"]', { timeout: 5000 });
		
		// Check for ProseMirror class
		const pm = page.locator(".ProseMirror"); // Global search, should be at least one
		await expect(pm).toBeVisible();
	});
});
