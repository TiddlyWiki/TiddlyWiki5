const { test, expect } = require("@playwright/test");
const { resolve } = require("path");
const { pathToFileURL } = require("url");

test.describe("ProseMirror Editor - Smoke Tests", () => {
	async function loadTestPage(page) {
		// TiddlyWiki test.html sometimes references external resources; on CI/offline these can
		// stall for many seconds due to connection timeouts.
		await page.route("http://**/*", (route) => route.abort());
		await page.route("https://**/*", (route) => route.abort());

		const repoRoot = resolve(__dirname, "../../../../");
		const indexPath = resolve(repoRoot, "editions/test/output", "test.html");
		await page.goto(pathToFileURL(indexPath).href, { waitUntil: "domcontentloaded" });
		await page.waitForSelector(".tc-site-title", { timeout: 10000 });
	}

	test("should load TiddlyWiki and render ProseMirror editors", async ({ page }) => {
		await loadTestPage(page);
		await expect(page.locator(".tc-site-title")).toHaveText("TiddlyWiki5");

		const availableWidgets = await page.evaluate(() => {
			if(typeof $tw === "undefined" || !$tw.modules || !$tw.modules.types || !$tw.modules.types.widget) {
				return { error: "TiddlyWiki not loaded" };
			}
			const widgets = Object.keys($tw.modules.types.widget || {});
			return {
				widgets: widgets,
				hasProsemirrorLoader: widgets.includes("$:/plugins/tiddlywiki/prosemirror/core/widget-loader.js"),
				hasProsemirror: typeof $tw.modules.types.widget["prosemirror"] !== "undefined",
				hasEditProsemirror: typeof $tw.modules.types.widget["edit-prosemirror"] !== "undefined"
			};
		});
		const hasWidget = availableWidgets.hasProsemirrorLoader ||
			availableWidgets.hasProsemirror ||
			availableWidgets.hasEditProsemirror;
		expect(hasWidget).toBeTruthy();

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
			window.location.hash = "#EditTestTiddler";
		});
		const tiddlerFrame = page.locator('.tc-tiddler-frame[data-tiddler-title="EditTestTiddler"]').first();
		await page.waitForSelector('.tc-tiddler-frame[data-tiddler-title="EditTestTiddler"]', { timeout: 10000 });
		await expect(tiddlerFrame).toBeVisible({ timeout: 10000 });
		const editButton = tiddlerFrame.locator('button[title*="Edit this tiddler"]').first();
		await expect(editButton).toBeVisible({ timeout: 5000 });
		await editButton.click();
		await page.waitForSelector(".tc-tiddler-edit-frame", { timeout: 5000 });
		const editorFrame = page.locator(".tc-tiddler-edit-frame").filter({ hasText: "EditTestTiddler" });
		await expect(editorFrame.locator(".ProseMirror")).toBeVisible({ timeout: 5000 });

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
		await expect(page.locator('.tc-tiddler-frame[data-tiddler-title="DirectWidgetTest"] .ProseMirror')).toBeVisible({ timeout: 5000 });
	});
});
