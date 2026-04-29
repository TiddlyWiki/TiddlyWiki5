"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, clearEditor } = require("../helpers.js");

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

	test("should insert hard_break on Enter inside block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: '"""\nLine A\n"""' });
		const block = editor.locator(".pm-nodeview-hardbreaks");
		await expect(block).toBeVisible({ timeout: 5000 });
		await editor.click();
		await page.keyboard.press("Control+Home");
		await page.keyboard.press("ArrowRight");
		await page.keyboard.press("ArrowRight");
		await page.keyboard.press("Enter");
		await page.keyboard.type("Line B");
		await page.waitForTimeout(300);
		const blockCount = await editor.locator(".pm-nodeview-hardbreaks").count();
		if(blockCount === 1) {
			await expect(block).toContainText("Line B");
		} else {
			expect(blockCount).toBeGreaterThanOrEqual(1);
		}
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

	test("Shift-Enter at block end should insert paragraph after block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: '"""\nLine A\nLine B\n"""' });
		const block = editor.locator(".pm-nodeview-hardbreaks");
		await expect(block).toBeVisible({ timeout: 5000 });
		await block.locator(".pm-nodeview-content").click();
		await page.keyboard.press("Control+End");
		await page.keyboard.press("Shift+Enter");
		await page.keyboard.type("After");
		await expect(editor.locator(".pm-nodeview-hardbreaks")).toHaveCount(1);
		await expect(block).not.toContainText("After");
		await expect(editor.locator("p")).toContainText("After");
	});

	test("Shift-Enter at block start should insert paragraph before block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: '"""\nLine A\nLine B\n"""' });
		const block = editor.locator(".pm-nodeview-hardbreaks");
		await expect(block).toBeVisible({ timeout: 5000 });
		await block.locator(".pm-nodeview-content").click();
		await page.keyboard.press("Control+Home");
		await page.keyboard.press("Shift+Enter");
		await page.keyboard.type("Before");
		await expect(editor.locator(".pm-nodeview-hardbreaks")).toHaveCount(1);
		await expect(block).not.toContainText("Before");
		await expect(editor.locator("p")).toContainText("Before");
	});

	test("Shift-Enter in block middle should split into two blocks", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: '"""\nLine A\nLine B\nLine C\n"""' });
		const block = editor.locator(".pm-nodeview-hardbreaks").first();
		await expect(block).toBeVisible({ timeout: 5000 });

		// Place cursor at end of "Line B" programmatically
		await block.locator(".pm-nodeview-content").evaluate((el) => {
			const viewEl = el.closest(".ProseMirror");
			function findAllEngines(widget) {
				const results = [];
				if(widget && widget.engine && widget.engine.view) results.push(widget.engine);
				if(widget && widget.children) {
					for(const child of widget.children) results.push.apply(results, findAllEngines(child));
				}
				return results;
			}
			const engine = findAllEngines($tw.rootWidget).find((e) => e.view && e.view.dom === viewEl);
			if(!engine || !engine.view) throw new Error("ProseMirror view not found");
			const view = engine.view;
			const TextSelection = $tw.modules.execute("prosemirror-state").TextSelection;
			let targetPos = null;
			view.state.doc.descendants((node, pos) => {
				if(targetPos !== null || !node.isText) return;
				const idx = (node.text || "").indexOf("Line B");
				if(idx !== -1) targetPos = pos + idx + "Line B".length;
			});
			if(targetPos === null) throw new Error("Line B position not found");
			view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, targetPos)));
			view.focus();
		});

		await page.keyboard.press("Shift+Enter");
		await page.keyboard.type("Middle");
		await expect(editor.locator(".pm-nodeview-hardbreaks")).toHaveCount(2);
		await expect(editor.locator("p")).toContainText("Middle");
	});
});
