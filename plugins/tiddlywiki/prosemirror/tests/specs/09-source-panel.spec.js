"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, loadTestPage } = require("../helpers.js");

// ─────────────────────────────────────────────────────────────────────────────
// Source Preview Tab (toolbar/source.tid)
// The "Source" tab is a standard $:/tags/EditPreview entry that renders an
// editable textarea bound to the tiddler's text field.  It is only offered
// when tv-editor-type === "prosemirror".
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Source Preview Tab", () => {
	/** Open the preview panel and switch to the Source tab, returning the textarea locator */
	async function openSourceTab(page, tiddlerTitle) {
		// Toggle the preview panel open via the wiki state tiddler
		await page.evaluate((title) => {
			const PREVIEW_STATE = "$:/state/showeditpreview";
			$tw.wiki.setText(PREVIEW_STATE, null, null, "yes");
		}, tiddlerTitle);
		await page.waitForTimeout(300);

		// The source tab button
		const sourceTabBtn = page.locator(
			'[data-tiddler-title] .tc-tiddler-preview-preview a, [data-tiddler-title] .tc-tab-buttons a'
		).filter({ hasText: /source/i }).first();
		// Try clicking; fall back to evaluating if the tab exists
		const tabCount = await sourceTabBtn.count();
		if(tabCount > 0) await sourceTabBtn.click();

		await page.waitForTimeout(200);
		return page.locator(".tc-tiddler-preview .tc-edit-texteditor, .tc-edit-preview-source textarea").first();
	}

	test("Source preview type should only be offered for prosemirror editors", async ({ page }) => {
		await loadTestPage(page);
		const availability = await page.evaluate(() => {
			function hasSourceOption(editorType) {
				const parser = $tw.wiki.parseText("text/vnd.tiddlywiki",
					`<$set name="tv-editor-type" value="${editorType}"><$transclude tiddler="$:/core/ui/EditTemplate/body/preview/type-dropdown"/></$set>`);
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
});

// ─────────────────────────────────────────────────────────────────────────────
// Preview Types
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Preview Types", () => {
	test("should only include Source for ProseMirror editors", async ({ page }) => {
		await loadTestPage(page);
		const availability = await page.evaluate(() => {
			function hasSourceOption(editorType) {
				const parser = $tw.wiki.parseText("text/vnd.tiddlywiki",
					`<$set name="tv-editor-type" value="${editorType}"><$transclude tiddler="$:/core/ui/EditTemplate/body/preview/type-dropdown"/></$set>`);
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
