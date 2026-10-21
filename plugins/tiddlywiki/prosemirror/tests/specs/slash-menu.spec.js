"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, clearEditor } = require("../helpers.js");

// ─────────────────────────────────────────────────────────────────────────────
// Slash Menu
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Slash Menu", () => {
	test("slashes in code blocks remain literal input", async ({ page }) => {
		const editor = await setupProseMirrorTest(page,"CodeSlashLiteral",{
			initialText: "```sh\n\n```", useReadmeTiddler: false
		});
		await editor.locator("pre code").click();
		await page.keyboard.type("/usr/bin");
		await expect(editor.locator("pre code")).toHaveText("/usr/bin");
		await expect(page.locator(".tc-editor-command-menu:visible")).toHaveCount(0);
		await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("CodeSlashLiteral"))).toBe("```sh\n/usr/bin\n```");
	});

	test("should open, filter, and execute slash menu", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await editor.click();
		await editor.press("Slash");
		const menu = page.locator(".tc-editor-command-menu:visible");
		await expect(menu).toBeVisible({ timeout: 5000 });
		await expect(menu.locator(".tc-editor-command-menu-content")).toBeVisible();
		await page.keyboard.type("code");
		await expect(menu.locator(".tc-editor-command-menu-search")).toHaveValue("code");
		await expect(menu.locator(".tc-editor-command-menu-item-label", { hasText: "Turn into codeblock" }).first()).toBeVisible();
		await page.keyboard.press("Enter");
		await expect(menu).toBeHidden({ timeout: 5000 });
		await expect(editor.locator("pre")).toHaveCount(1);
	});

	test("should hide empty category groups after filtering", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			configTiddlers: [{
				title: "$:/tests/prosemirror/snippets/unique-group-filter",
				caption: "Only Slash Menu Group Match",
				tags: ["$:/tags/TextEditor/Snippet"],
				text: "Only Slash Menu Group Match",
				type: "text/vnd.tiddlywiki"
			}]
		});
		await clearEditor(editor);
		await editor.click();
		await editor.press("Slash");
		const menu = page.locator(".tc-editor-command-menu:visible");
		await expect(menu).toBeVisible({ timeout: 5000 });
		await page.keyboard.type("Only Slash Menu Group Match");
		await page.waitForTimeout(200);
		const groupTitles = await menu.locator(".tc-editor-command-menu-group").allTextContents();
		expect(groupTitles).toEqual(["Snippets"]);
		await expect(menu.locator(".tc-editor-command-menu-item")).toHaveCount(1);
	});

	test("should not execute selected item on Enter during IME composition", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await editor.click();
		await editor.press("Slash");
		const menu = page.locator(".tc-editor-command-menu:visible");
		await expect(menu).toBeVisible({ timeout: 5000 });
		await page.keyboard.type("code");
		await expect(menu.locator(".tc-editor-command-menu-item-label", { hasText: "Turn into codeblock" }).first()).toBeVisible();
		await menu.locator("input").evaluate((root) => {
			const event = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true });
			Object.defineProperty(event, "isComposing", { configurable: true, get: () => true });
			Object.defineProperty(event, "keyCode", { configurable: true, get: () => 229 });
			root.dispatchEvent(event);
		});
		await page.waitForTimeout(200);
		await expect(editor.locator("pre")).toHaveCount(0);
	});

	test("should enter edit mode after inserting widget snippet", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			configTiddlers: [{
				title: "$:/tests/prosemirror/snippets/now",
				caption: "Now widget",
				tags: ["$:/tags/TextEditor/Snippet"],
				text: "<<now>>",
				type: "text/vnd.tiddlywiki"
			}]
		});
		await clearEditor(editor);
		await editor.click();
		await editor.press("Slash");
		await page.keyboard.type("Now widget");
		await page.keyboard.press("Enter");
		const widgetBlock = page.locator(".pm-nodeview-widget").first();
		await expect(widgetBlock).toBeVisible({ timeout: 5000 });
		await widgetBlock.hover();
		await page.waitForTimeout(300);
		const editBtn = widgetBlock.locator(".pm-nodeview-btn-edit").first();
		await expect(editBtn).toBeVisible({ timeout: 2000 });
		await editBtn.click();
		await page.waitForTimeout(300);
		const textarea = widgetBlock.locator("textarea.pm-nodeview-editor");
		await expect(textarea).toBeVisible({ timeout: 5000 });
		await expect(textarea).toHaveValue("<<now>>");
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Slash Menu — Categories
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Slash Menu Categories", () => {
	test("should show category group headers in slash menu", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await editor.click();
		await editor.press("Slash");
		const menu = page.locator(".tc-editor-command-menu:visible");
		await expect(menu).toBeVisible({ timeout: 5000 });
		const groups = menu.locator(".tc-editor-command-menu-group");
		expect(await groups.count()).toBeGreaterThanOrEqual(2);
		await expect(menu.locator(".tc-editor-command-menu-group", { hasText: "Typed blocks" })).toBeVisible();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Slash Menu — Heading
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Slash Menu Heading", () => {
	test("should open slash menu after whitespace in a heading line", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "! My Heading\n\nParagraph" });
		const heading = editor.locator("h1").first();
		await expect(heading).toBeVisible();
		await heading.click();
		await page.keyboard.press("End");
		await page.keyboard.press("Space");
		await page.keyboard.press("Slash");
		await page.waitForTimeout(300);
		await expect(page.locator(".tc-editor-command-menu:visible")).toBeVisible();
	});
});
