"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, clearEditor } = require("../helpers.js");

// ─────────────────────────────────────────────────────────────────────────────
// Find & Replace
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Find & Replace", () => {
	test("should open find panel with Ctrl+F", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "hello world hello" });
		await editor.press("Control+f");
		await page.waitForTimeout(200);
		await expect(page.locator(".tc-prosemirror-find-replace-panel")).toBeVisible();
	});

	test("should highlight search matches", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "hello world hello planet hello" });
		await editor.press("Control+f");
		await page.waitForTimeout(200);
		await page.locator(".tc-prosemirror-find-input").fill("hello");
		await page.waitForTimeout(200);
		await expect(editor.locator(".tc-prosemirror-find-match, .tc-prosemirror-find-current")).toHaveCount(3);
	});

	test("should replace single match", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "foo bar foo baz" });
		await editor.press("Control+f");
		await page.waitForTimeout(200);
		await page.locator(".tc-prosemirror-find-input").fill("foo");
		await page.waitForTimeout(200);
		await page.locator(".tc-prosemirror-replace-input").fill("qux");
		await page.locator(".tc-prosemirror-find-replace-row").nth(1).locator("button").first().click();
		await page.waitForTimeout(200);
		await expect(editor).toContainText("qux");
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Autocomplete
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Autocomplete", () => {
	test("should show autocomplete dropdown on [[ trigger", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "" });
		await clearEditor(editor);
		await editor.click();
		await editor.pressSequentially("[[");
		await page.waitForTimeout(300);
		await expect(page.locator(".tc-prosemirror-autocomplete")).toBeVisible();
	});

	test("should close autocomplete on Escape", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "" });
		await clearEditor(editor);
		await editor.click();
		await editor.pressSequentially("[[");
		await page.waitForTimeout(300);
		const dropdown = page.locator(".tc-prosemirror-autocomplete");
		await expect(dropdown).toBeVisible();
		await editor.press("Escape");
		await page.waitForTimeout(200);
		await expect(dropdown).not.toBeVisible();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Link Tooltip
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Link Tooltip", () => {
	test("should show tooltip with unlink button when cursor is inside a link", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "Visit [[MyTarget]] now" });
		await editor.locator("a").first().click();
		await page.waitForTimeout(500);
		const tooltip = page.locator(".tc-prosemirror-link-tooltip");
		await expect(tooltip).toBeVisible({ timeout: 5000 });
		expect(await tooltip.locator(".tc-prosemirror-link-tooltip-btn").count()).toBeGreaterThanOrEqual(2);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Static block rendering
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Static Block Rendering", () => {
	test("should render common block elements from wikitext", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "; Term\n: Definition\n\n<<<\nQuoted text\n<<<\n\n```\nconst x = 1;\n```\n\nAbove\n\n---\n\nBelow\n\n|!Header 1|!Header 2|\n|Cell 1|Cell 2|"
		});
		await expect(editor.locator("dl")).toHaveCount(1);
		await expect(editor.locator("dt")).toContainText("Term");
		await expect(editor.locator("dd")).toContainText("Definition");
		await expect(editor.locator("blockquote")).toContainText("Quoted text");
		await expect(editor.locator("pre code, pre").first()).toContainText("const x = 1;");
		await expect(editor.locator("hr")).toBeVisible();
		const table = editor.locator("table");
		await expect(table).toBeVisible();
		await expect(table).toContainText("Header 1");
		await expect(table).toContainText("Cell 1");
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Table", () => {

	test("should insert table via slash menu", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "",
			configTiddlers: [{
				title: "$:/tests/prosemirror/actions/insert-table",
				"action-id": "insert-table",
				caption: "Insert table",
				category: "block-insert",
				tags: "$:/tags/ProseMirror/EditorAction"
			}]
		});
		await editor.click();
		await editor.press("Slash");
		const menu = page.locator(".tw-slash-menu-root");
		await expect(menu).toBeVisible({ timeout: 5000 });
		await page.keyboard.type("table");
		await expect(menu.locator(".tw-slash-menu-item-label", { hasText: "Insert table" }).first()).toBeVisible({ timeout: 5000 });
		await menu.locator(".tw-slash-menu-item").filter({ hasText: "Insert table" }).first().evaluate((el) => el.click());
		await expect(editor.locator("table").first()).toBeVisible({ timeout: 5000 });
		const selectionInTable = await editor.evaluate((root) => {
			const selection = root.ownerDocument.getSelection();
			if(!selection || !selection.anchorNode) return false;
			const el = selection.anchorNode.nodeType === Node.ELEMENT_NODE
				? selection.anchorNode : selection.anchorNode.parentElement;
			return !!(el && el.closest("td,th"));
		});
		expect(selectionInTable).toBeTruthy();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Pragma Blocks & Procedure Snippet
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Pragma Blocks", () => {
	test("should render \\procedure as pragma block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "\\procedure myProc()\nHello\n\\end\n\nContent after"
		});
		await expect(editor.locator(".pm-nodeview-pragma, .pm-pragma-block").first()).toBeVisible();
		await expect(editor).toContainText("Content after");
	});

	test("should render \\define as pragma block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "\\define myMacro()\nBody\n\\end\n\nAfter"
		});
		await expect(editor.locator(".pm-nodeview-pragma, .pm-pragma-block").first()).toBeVisible();
	});
});
