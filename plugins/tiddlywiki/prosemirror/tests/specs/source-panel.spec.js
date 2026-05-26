"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, loadTestPage, installCustomSyntaxTestModules } = require("../helpers.js");

// ─────────────────────────────────────────────────────────────────────────────
// Source Preview Tab (toolbar/source.tid)
// The "Source" tab is a standard $:/tags/EditPreview entry that renders an
// editable textarea bound to the tiddler's text field.  It is only offered
// when tv-editor-type === "prosemirror".
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Source Preview Tab", () => {
	async function assertCustomSyntaxSurvivesPreview(page, options) {
		const { tiddlerTitle, sourceText, expectedLabel } = options;
		const waitForLabelOccurrences = (minimum) => page.waitForFunction(({ label, expectedCount }) => {
			const bodyText = (document.body && document.body.textContent) || "";
			if(!label) {
				return false;
			}
			return bodyText.split(label).length - 1 >= expectedCount;
		}, { label: expectedLabel, expectedCount: minimum }, { timeout: 10000 });
		await loadTestPage(page);
		await installCustomSyntaxTestModules(page);
		await page.evaluate(({ title, text }) => {
			$tw.wiki.addTiddler({ title: title, text: text, type: "text/vnd.tiddlywiki" });
			const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
			if(storyList.indexOf(title) === -1) {
				storyList.unshift(title);
				$tw.wiki.addTiddler({ title: "$:/StoryList", list: storyList });
			}
		}, { title: tiddlerTitle, text: sourceText });

		await waitForLabelOccurrences(1);
		await page.getByRole("button", { name: /edit this tiddler/i }).first().click();

		await waitForLabelOccurrences(1);

		const previewButton = page.getByRole("button", { name: /preview pane/i }).first();
		await expect(previewButton).toBeVisible({ timeout: 10000 });
		await previewButton.click();

		await expect(page.locator(".tc-tiddler-preview-preview").first()).toBeVisible({ timeout: 10000 });
		await waitForLabelOccurrences(2);
	}

	test("Source preview type should only be offered for prosemirror editors", async ({ page }) => {
		await loadTestPage(page);
		const availability = await page.evaluate(() => {
			function hasSourceOption(editorType) {
				const parser = $tw.wiki.parseText("text/vnd.tiddlywiki",
					`<$set name="tv-editor-type" value="${editorType}"><$transclude tiddler="$:/core/ui/EditorToolbar/preview-type-dropdown"/></$set>`);
				const widget = $tw.wiki.makeWidget(parser, { parentWidget: $tw.rootWidget, document });
				const container = document.createElement("div");
				widget.render(container, null);
				return Array.from(container.querySelectorAll("a")).some(
					(el) => el.textContent.replace(/\s+/g, " ").trim().match(/source/i));
			}
			return { prosemirror: hasSourceOption("prosemirror"), text: hasSourceOption("text") };
		});
		expect(availability.prosemirror).toBeTruthy();
		expect(availability.text).toBeFalsy();
	});

	test("Source tab textarea should be editable (no disabled attribute)", async ({ page }) => {
		await loadTestPage(page);
		const available = await page.evaluate(() => {
			const tiddler = $tw.wiki.getTiddler("$:/plugins/tiddlywiki/prosemirror/EditTemplate/body/preview/source");
			if(!tiddler) return null;
			return tiddler.fields.text || "";
		});
		expect(available).not.toBeNull();
		expect(available).not.toContain('disabled="yes"');
	});

	test("Preview toggle should preserve legacy custom syntax without node start/end", async ({ page }) => {
		await assertCustomSyntaxSurvivesPreview(page, {
			tiddlerTitle: "LegacyCustomSyntaxPreviewTest",
			sourceText: "[@ ] Legacy task one\n[@x] Legacy task two",
			expectedLabel: "Legacy custom syntax preserved"
		});
	});

	test("Preview toggle should preserve custom syntax with node start/end", async ({ page }) => {
		await assertCustomSyntaxSurvivesPreview(page, {
			tiddlerTitle: "ModernCustomSyntaxPreviewTest",
			sourceText: "[% ] Modern task one\n[%x] Modern task two",
			expectedLabel: "Modern custom syntax preserved"
		});
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Markdown Tiddlers
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Markdown Tiddlers", () => {
	test("should render markdown tiddlers through the markdown parser", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			contentType: "text/markdown",
			initialText: "# Heading\n\n**bold**",
			useReadmeTiddler: false
		});
		await expect(editor.locator("h1")).toContainText("Heading");
		await expect(editor.locator("strong")).toContainText("bold");
	});
});
