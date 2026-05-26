"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest } = require("../helpers.js");

// ─────────────────────────────────────────────────────────────────────────────
// Hard Line Breaks Block
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Hard Line Breaks Block", () => {
	test("should render hard line breaks block with content", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: '"""\nThis is some text\nThat is set like\nIt is a Poem\n"""'
		});
		const block = editor.locator(".pm-nodeview-hardbreaks");
		await expect(block).toBeVisible({ timeout: 5000 });
		await expect(block).toContainText("This is some text");
		await expect(block).toContainText("It is a Poem");
	});

	test("should show label on hover and dashed border", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: '"""\nLine one\nLine two\n"""' });
		const block = editor.locator(".pm-nodeview-hardbreaks");
		await expect(block).toBeVisible({ timeout: 5000 });
		const borderBefore = await block.evaluate((el) => window.getComputedStyle(el).borderColor);
		await block.hover();
		await page.waitForTimeout(200);
		const opacity = await block.locator(".pm-nodeview-header").evaluate((el) => window.getComputedStyle(el).opacity);
		expect(parseFloat(opacity)).toBeGreaterThan(0);
		const borderAfter = await block.evaluate((el) => window.getComputedStyle(el).borderColor);
		expect(borderBefore).not.toBe(borderAfter);
	});

	test("should round-trip hard line breaks through wikitext save", async ({ page }) => {
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		const editor = await setupProseMirrorTest(page, null, { initialText: '"""\nPoem A\nPoem B\n"""' });
		const block = editor.locator(".pm-nodeview-hardbreaks");
		await expect(block).toBeVisible({ timeout: 5000 });
		await page.waitForTimeout(800);
		const savedText = await page.evaluate((t) => $tw.wiki.getTiddlerText(t, ""), exampleTitle);
		expect(savedText).toContain('"""');
		expect(savedText).toContain("Poem A");
		expect(savedText).toContain("Poem B");
	});
});
