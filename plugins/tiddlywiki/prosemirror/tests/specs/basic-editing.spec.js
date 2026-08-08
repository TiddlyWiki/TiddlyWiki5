"use strict";

const { test, expect } = require("@playwright/test");
const {
	setupProseMirrorTest, clearEditor, dispatchEditorShortcut, selectAllEditorContent, pastePlainText
} = require("../helpers.js");

// ─────────────────────────────────────────────────────────────────────────────
// Basic Editing
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Basic Editing", () => {
	test("should support bold formatting", async ({ page, browserName }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("Bold text");
		await editor.evaluate((el) => {
			if(!el.__twKeyCaptureInstalled) {
				el.addEventListener("keydown", (e) => { e.twEditor = true; e.stopPropagation(); }, true);
				el.__twKeyCaptureInstalled = true;
			}
		});
		await editor.press("Control+A");
		await page.waitForTimeout(100);
		if(browserName === "firefox") {
			const handled = await dispatchEditorShortcut(editor, "b", "KeyB", { ctrlKey: true });
			expect(handled).toBeTruthy();
		} else {
			await editor.press("Control+b");
		}
		await page.waitForTimeout(200);
		await expect(editor.locator("strong")).toContainText("Bold text");
	});

	test("should support italic formatting", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("Italic text");
		const selectedAll = await selectAllEditorContent(editor);
		expect(selectedAll).toBeTruthy();
		const handled = await dispatchEditorShortcut(editor, "i", "KeyI", { ctrlKey: true });
		expect(handled).toBeTruthy();
		const hasItalicMark = await editor.evaluate((el) => {
			const viewEl = el.closest(".ProseMirror") || el;
			function findAllEngines(widget) {
				const results = [];
				if(widget && widget.engine && widget.engine.view) results.push(widget.engine);
				if(widget && widget.children) {
					for(const child of widget.children) results.push.apply(results, findAllEngines(child));
				}
				return results;
			}
			const engine = findAllEngines($tw.rootWidget).find((e) => e.view && e.view.dom === viewEl);
			if(!engine || !engine.view) return false;
			let italicFound = false;
			engine.view.state.doc.descendants((node) => {
				if(italicFound || !node.marks) return;
				italicFound = node.marks.some((mark) => mark.type && mark.type.name === "em");
			});
			return italicFound;
		});
		expect(hasItalicMark).toBeTruthy();
		await expect(editor).toContainText("Italic text");
	});

	test("should support undo/redo", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("First line");
		await page.keyboard.press("Enter");
		await page.keyboard.type("Second line");
		await expect(editor).toContainText("Second line");
		await page.keyboard.press("Control+z");
		await expect(editor).not.toContainText("Second line");
		await page.keyboard.press("Control+Shift+z");
		await expect(editor).toContainText("Second line");
	});

	test("should render extended inline marks from wikitext", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "This is ~~struck~~, __underlined__, ^^super^^, and ,,sub,, text"
		});
		await expect(editor.locator("strike, s, del").first()).toBeVisible();
		await expect(editor.locator("u").first()).toBeVisible();
		await expect(editor.locator("sup").first()).toBeVisible();
		await expect(editor.locator("sub").first()).toBeVisible();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Headings
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Headings", () => {
	test("should create heading with keyboard shortcut", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("Heading Text");
		await page.keyboard.press("Control+Shift+1");
		await expect(editor.locator("h1")).toContainText("Heading Text");
	});

	test("should support different heading levels", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		/* eslint-disable no-await-in-loop */
		for(let level = 1; level <= 6; level++) {
			if(level > 1) await page.keyboard.press("Enter");
			await page.keyboard.type(`Heading ${level}`);
			await page.keyboard.press(`Control+Shift+${level}`);
			await expect(editor.locator(`h${level}`)).toContainText(`Heading ${level}`);
		}
		/* eslint-enable no-await-in-loop */
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Configuration", () => {
	test("should respect custom keyboard shortcuts", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			configTiddlers: [{ title: "$:/config/prosemirror/shortcuts/bold", text: "Shift-Mod-b" }]
		});
		await clearEditor(editor);
		await page.keyboard.type("Bold Text");
		const selectedAll = await selectAllEditorContent(editor);
		expect(selectedAll).toBeTruthy();
		const handled = await dispatchEditorShortcut(editor, "B", "KeyB", { ctrlKey: true, shiftKey: true });
		expect(handled).toBeTruthy();
		await expect(editor.locator("strong")).toContainText("Bold Text");
	});

	test("should respect widget block enable/disable setting", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			configTiddlers: [{ title: "$:/config/prosemirror/enable-widget-blocks", text: "no" }]
		});
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		await expect(editor.locator(".pm-nodeview-widget")).toHaveCount(0);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Integration", () => {
	test("should save content to tiddler", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, "ProseMirrorTestTiddler", {
			useReadmeTiddler: false,
			initialText: "Start"
		});
		await clearEditor(editor);
		await page.keyboard.type("Test content");
		await page.waitForTimeout(500);
		const tiddlerText = await page.evaluate(() => $tw.wiki.getTiddlerText("ProseMirrorTestTiddler"));
		expect(tiddlerText).toContain("Test content");
	});

	test("should preserve straight quotes in wikitext widget syntax", async ({ page }) => {
		const title = "ProseMirrorQuoteSyntaxTiddler";
		const editor = await setupProseMirrorTest(page, title, {
			useReadmeTiddler: false,
			initialText: ""
		});
		await clearEditor(editor);
		await page.keyboard.type('<<tag "Welcome">>');
		await page.waitForTimeout(500);
		const tiddlerText = await page.evaluate((t) => $tw.wiki.getTiddlerText(t, ""), title);
		expect(tiddlerText).toContain('<<tag "Welcome">>');
		expect(tiddlerText).not.toContain("“");
		expect(tiddlerText).not.toContain("”");
	});

	test("should load existing tiddler content", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, "ProseMirrorTestTiddler", {
			useReadmeTiddler: false,
			initialText: "Existing content"
		});
		await expect(editor).toContainText("Existing content");
	});

	test("should not trigger import dialog on paste", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		const importFrame = page.locator('.tc-tiddler-frame[data-tiddler-title="$:/Import"]');
		await pastePlainText(editor, "Pasted text");
		await expect(importFrame).toHaveCount(0);
		await expect(editor).toContainText("Pasted text");
	});
});
