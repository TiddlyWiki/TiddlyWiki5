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

	test("drag handle should stay near nested list markers without overlapping them", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			useReadmeTiddler: false,
			initialText: "* Parent\n** Child\n* Sibling"
		});
		const parentList = editor.locator(".prosemirror-flat-list").first();
		const childList = editor.locator(".prosemirror-flat-list").nth(1);
		const handle = page.locator(".tc-prosemirror-drag-handle");
		const hoverList = async (list) => {
			await list.scrollIntoViewIfNeeded();
			const listBox = await list.boundingBox();
			expect(listBox).toBeTruthy();
			await page.mouse.move(listBox.x + 4, listBox.y + listBox.height / 2);
			await expect(handle).toBeVisible();
			const handleBox = await handle.boundingBox();
			expect(handleBox).toBeTruthy();
			return { listBox: listBox, handleBox: handleBox };
		};

		const parent = await hoverList(parentList);
		await expect(handle).toBeVisible();
		const editorBox = await editor.boundingBox();
		expect(editorBox).toBeTruthy();
		expect(parent.handleBox.x).toBeGreaterThanOrEqual(editorBox.x - parent.handleBox.width - 28);
		expect(parent.handleBox.x + parent.handleBox.width).toBeLessThanOrEqual(parent.listBox.x + 2);
		expect(parent.handleBox.x + parent.handleBox.width).toBeGreaterThanOrEqual(parent.listBox.x - 30);

		const child = await hoverList(childList);
		expect(child.handleBox.x).toBeGreaterThanOrEqual(editorBox.x - child.handleBox.width - 28);
		expect(child.handleBox.x).toBeGreaterThanOrEqual(parent.handleBox.x - 2);
		expect(child.handleBox.x + child.handleBox.width).toBeLessThanOrEqual(child.listBox.x + 2);
		expect(child.handleBox.x + child.handleBox.width).toBeGreaterThanOrEqual(child.listBox.x - 30);
	});

	test("drag handle should stay near the editor and not overlap list marker", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			useReadmeTiddler: false,
			initialText: "* Item 1\n* Item 2"
		});
		const list = editor.locator(".prosemirror-flat-list").first();
		await list.hover();
		await page.waitForTimeout(250);
		const handle = page.locator(".tc-prosemirror-drag-handle");
		await expect(handle).toBeVisible();
		const handleBox = await handle.boundingBox();
		const listBox = await list.boundingBox();
		const editorBox = await editor.boundingBox();
		expect(handleBox).toBeTruthy();
		expect(listBox).toBeTruthy();
		// The handle must sit to the left of the list item's content box,
		// clear of the ::marker/number.
		expect(handleBox.x + handleBox.width).toBeLessThanOrEqual(listBox.x + 2);
		// But not too far left (must stay in the marker gutter, not outside the editor).
		expect(handleBox.x + handleBox.width).toBeGreaterThanOrEqual(listBox.x - 30);
		// And it must not escape far to the left of the editor.
		expect(handleBox.x).toBeGreaterThanOrEqual(editorBox.x - 40);
	});

	test("drop logic should unwrap a list item dropped outside a list", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			useReadmeTiddler: false,
			initialText: "* Item 1\n\nAfter list"
		});
		await editor.evaluate((el) => {
			function findAllEngines(widget) {
				const results = [];
				if(widget && widget.engine && widget.engine.view) results.push(widget.engine);
				if(widget && widget.children) {
					for(const child of widget.children) results.push.apply(results, findAllEngines(child));
				}
				return results;
			}
			const viewEl = el.closest(".ProseMirror") || el;
			const engine = findAllEngines($tw.rootWidget).find((e) => e.view && e.view.dom === viewEl);
			if(!engine || !engine.view) throw new Error("ProseMirror engine not found");
			const view = engine.view;
			const dropLogic = $tw.modules.execute(
				"$:/plugins/tiddlywiki/prosemirror/features/drag-handle/drop-logic.js"
			);
			const listPos = 0;
			const listNode = view.state.doc.nodeAt(listPos);
			const paraPos = listNode.nodeSize;
			// Drop the list item after the trailing paragraph (doc-level context).
			const target = { insertPos: paraPos + view.state.doc.nodeAt(paraPos).nodeSize, dropContext: "doc", unwrapList: true };
			const tr = dropLogic.buildMoveTransaction(view, { pos: listPos, node: listNode }, target);
			if(!tr) throw new Error("drop transaction was not built");
			view.dispatch(tr);
		});
		await page.waitForTimeout(250);
		// The list should be gone and its text should appear as a normal paragraph.
		await expect(editor.locator(".prosemirror-flat-list")).toHaveCount(0);
		const paragraphs = await editor.locator("p").allTextContents();
		expect(paragraphs.join(" ")).toContain("Item 1");
		expect(paragraphs.join(" ")).toContain("After list");
	});
});
