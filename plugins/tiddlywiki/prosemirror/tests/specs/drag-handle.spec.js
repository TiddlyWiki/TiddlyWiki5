"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest } = require("../helpers.js");

// ─────────────────────────────────────────────────────────────────────────────
// Drag Handle (consolidated: basic + extended)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Drag Handle", () => {
	test("should show and hide drag handle on hover", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "First paragraph\n\nSecond paragraph"
		});
		const firstP = editor.locator("p").first();
		await firstP.hover();
		await page.waitForTimeout(200);
		const dragHandle = page.locator(".tc-prosemirror-drag-handle");
		await expect(dragHandle).toBeVisible();
		await expect(dragHandle).toHaveAttribute("draggable", "true");

		// Hide on mouse leave
		await page.mouse.move(0, 0);
		await page.waitForTimeout(300);
		await expect(dragHandle).not.toBeVisible();
	});

	test("drag handle should remain reachable while moving from block to handle", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "First paragraph\n\nSecond paragraph"
		});
		const firstP = editor.locator("p").first();
		await firstP.hover();
		await page.waitForTimeout(250);
		const dragHandle = page.locator(".tc-prosemirror-drag-handle");
		await expect(dragHandle).toBeVisible();
		const blockBox = await firstP.boundingBox();
		const handleBox = await dragHandle.boundingBox();
		expect(blockBox).toBeTruthy();
		expect(handleBox).toBeTruthy();
		await page.mouse.move(blockBox.x + 8, blockBox.y + blockBox.height / 2);
		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2, { steps: 8 });
		await page.waitForTimeout(150);
		await expect(dragHandle).toBeVisible();
	});

	test("should show drag handle for typed block nodeviews", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "$$$text/x-markdown\n# Heading\n$$$"
		});
		const typedBlock = editor.locator(".pm-nodeview-typedblock").first();
		await expect(typedBlock).toBeVisible({ timeout: 5000 });
		await typedBlock.hover();
		await page.waitForTimeout(250);
		await expect(page.locator(".tc-prosemirror-drag-handle")).toBeVisible();
	});

	test("drag handle should open block menu on click", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "Test paragraph" });
		const firstP = editor.locator("p").first();
		await firstP.hover();
		await page.waitForTimeout(300);
		const dragHandle = page.locator(".tc-prosemirror-drag-handle");
		await expect(dragHandle).toBeVisible();
		await dragHandle.click();
		await page.waitForTimeout(200);
		await expect(page.locator(".tc-prosemirror-block-menu")).toBeVisible();
	});

	test("block menu should include typed-block commands", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "Test paragraph" });
		await editor.locator("p").first().hover();
		await page.waitForTimeout(300);
		await page.locator(".tc-prosemirror-drag-handle").click();
		const blockMenu = page.locator(".tc-prosemirror-block-menu");
		await expect(blockMenu).toBeVisible();
		await blockMenu.locator(".tc-prosemirror-block-menu-search").fill("markdown");
		await expect(blockMenu.locator(".tc-prosemirror-block-menu-item", { hasText: "$$$ Markdown" })).toBeVisible();
	});

	test("block menu should insert a paragraph below the current block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			useReadmeTiddler: false,
			initialText: "First paragraph"
		});
		const firstParagraph = editor.locator("p").first();
		await firstParagraph.hover();
		await page.waitForTimeout(300);
		await page.locator(".tc-prosemirror-drag-handle").click();
		const blockMenu = page.locator(".tc-prosemirror-block-menu");
		await expect(blockMenu).toBeVisible();
		await expect(blockMenu).toContainText("Insert block below");
		await blockMenu.locator(".tc-prosemirror-block-menu-item", { hasText: "Insert block below" }).click();
		await page.keyboard.type("After first paragraph");
		await expect(editor.locator("p").nth(1)).toContainText("After first paragraph");
	});

	test("block menu should insert a paragraph above the current block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			useReadmeTiddler: false,
			initialText: "First paragraph\n\nSecond paragraph"
		});
		const secondParagraph = editor.locator("p").nth(1);
		await secondParagraph.hover();
		await page.waitForTimeout(300);
		await page.locator(".tc-prosemirror-drag-handle").click();
		const blockMenu = page.locator(".tc-prosemirror-block-menu");
		await expect(blockMenu).toBeVisible();
		await expect(blockMenu).toContainText("Insert block above");
		await blockMenu.locator(".tc-prosemirror-block-menu-item", { hasText: "Insert block above" }).click();
		await page.keyboard.type("Between first and second");
		const paragraphs = await editor.locator("p").allTextContents();
		expect(paragraphs[0]).toContain("First paragraph");
		expect(paragraphs[1]).toContain("Between first and second");
		expect(paragraphs[2]).toContain("Second paragraph");
	});
});
