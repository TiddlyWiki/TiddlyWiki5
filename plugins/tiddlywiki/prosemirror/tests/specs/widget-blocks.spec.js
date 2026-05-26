"use strict";

const { test, expect } = require("@playwright/test");
const {
	setupProseMirrorTest, clearEditor, pastePlainText
} = require("../helpers.js");

function selectFirstWidgetBlockNode(editor) {
	return editor.evaluate((el) => {
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
		if(!engine || !engine.view) return { selectionType: null, selectedNodeType: null };
		const sel = engine.view.state.selection;
		return {
			selectionType: sel && sel.constructor && sel.constructor.name,
			selectedNodeType: sel && sel.node && sel.node.type && sel.node.type.name
		};
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget Blocks
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Widget Blocks", () => {
	test("should support editable widget block lifecycle and insertion flows", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);

		await test.step("render widget syntax as a nodeview block", async () => {
			await clearEditor(editor);
			await page.keyboard.type('<<now "YYYY-MM-DD">>');
			const widgetBlocks = editor.locator(".pm-nodeview-widget");
			await expect(widgetBlocks.first()).toBeVisible({ timeout: 5000 });
			await expect(widgetBlocks.first().locator(".pm-nodeview-header")).toContainText("Widget: now");
		});

		await test.step("edit mode exposes textarea and delete button, then saves changes", async () => {
			await clearEditor(editor);
			await page.keyboard.type("<<now>>");
			const widgetBlock = editor.locator(".pm-nodeview-widget").first();
			await expect(widgetBlock).toBeVisible({ timeout: 5000 });
			await widgetBlock.hover();
			await expect(widgetBlock.locator(".pm-nodeview-btn-delete")).toBeHidden();
			await expect(widgetBlock.locator(".pm-nodeview-btn-edit").first()).toBeVisible({ timeout: 2000 });

			const saveResult = await editor.evaluate(async (root, newText) => {
				const waitFrame = () => new Promise((resolve) => {
					requestAnimationFrame(resolve);
				});
				const waitFor = async (selector, retries) => {
					const el = root.querySelector(selector);
					if(el || retries <= 1) return el;
					await waitFrame();
					return waitFor(selector, retries - 1);
				};
				const editBtn = root.querySelector(".pm-nodeview-widget .pm-nodeview-btn-edit");
				if(!editBtn) return { ok: false, step: "editBtn" };
				editBtn.click();
				const textarea = await waitFor(".pm-nodeview-widget textarea.pm-nodeview-editor", 10);
				if(!textarea) return { ok: false, step: "textarea" };
				const deleteBtn = await waitFor(".pm-nodeview-widget.pm-nodeview-editing .pm-nodeview-btn-delete", 10);
				if(!deleteBtn) return { ok: false, step: "deleteBtn" };
				if(getComputedStyle(deleteBtn).display !== "flex") return { ok: false, step: "deleteBtnDisplay", display: getComputedStyle(deleteBtn).display };
				textarea.value = newText;
				textarea.dispatchEvent(new Event("input", { bubbles: true }));
				editBtn.click();
				return { ok: true };
			}, '<<now "YYYY">>');
			expect(saveResult).toEqual({ ok: true });
			await expect(editor.locator(".pm-nodeview-widget .pm-nodeview-header").first()).toContainText("Widget: now");
		});

		await test.step("delete button removes the widget block", async () => {
			await clearEditor(editor);
			await page.keyboard.type("<<now>>");
			await expect(editor.locator(".pm-nodeview-widget").first()).toBeVisible({ timeout: 5000 });

			const deleteResult = await editor.evaluate(async (root) => {
				const waitFrame = () => new Promise((resolve) => {
					requestAnimationFrame(resolve);
				});
				const waitFor = async (selector, retries) => {
					const el = root.querySelector(selector);
					if(el || retries <= 1) return el;
					await waitFrame();
					return waitFor(selector, retries - 1);
				};
				const editBtn = root.querySelector(".pm-nodeview-widget .pm-nodeview-btn-edit");
				if(!editBtn) return { ok: false, step: "editBtn" };
				editBtn.click();
				const deleteBtn = await waitFor(".pm-nodeview-widget.pm-nodeview-editing .pm-nodeview-btn-delete", 30);
				if(!deleteBtn) return { ok: false, step: "deleteBtn" };
				deleteBtn.click();
				await waitFrame();
				return { ok: true };
			});
			expect(deleteResult).toEqual({ ok: true });
			await expect(editor.locator(".pm-nodeview-widget")).toHaveCount(0, { timeout: 10000 });
		});

		await test.step("pasted widget syntax converts to a widget block", async () => {
			await clearEditor(editor);
			await pastePlainText(editor, '<<now "YYYY-MM-DD">>');
			await expect.poll(() => editor.locator(".pm-nodeview-widget").count(), { timeout: 5000 }).toBe(1);
		});

		await test.step("typing after a widget block creates following text", async () => {
			await clearEditor(editor);
			await page.keyboard.type("<<now>>");
			await expect(editor.locator(".pm-nodeview-widget").first()).toBeVisible({ timeout: 2000 });
			await page.keyboard.type("\n\nAfter widget");
			await expect(editor).toContainText("After widget");
		});

		await test.step("multiple widget syntaxes render as separate widget blocks", async () => {
			await clearEditor(editor);
			await page.keyboard.type("<<now>>");
			await expect(editor.locator(".pm-nodeview-widget").first()).toBeVisible({ timeout: 2000 });
			await page.keyboard.type("\n\n<<list-links '[tag[test]]'>>");
			await expect(editor.locator(".pm-nodeview-widget")).toHaveCount(2);
		});
	});

	test("should keep rendered list-links widget selectable and clickable", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, "WidgetListLinkInteractions", {
			useReadmeTiddler: false,
			initialText: '<<list-links "[tag[test]]">>',
			configTiddlers: [
				{ title: "TaggedLinkA", text: "A", tags: ["test"] },
				{ title: "TaggedLinkB", text: "B", tags: ["test"] }
			]
		});

		await test.step("links inside list-links widget remain clickable", async () => {
			const firstLink = editor.locator(".pm-nodeview-widget .pm-nodeview-content a").first();
			await expect(firstLink).toBeVisible({ timeout: 5000 });
			await firstLink.click();
			await expect(page.locator('.tc-tiddler-frame[data-tiddler-title="TaggedLinkA"]')).toBeVisible({ timeout: 5000 });
		});

		await test.step("clicking read-only widget content selects the widget block", async () => {
			const widgetContent = editor.locator(".pm-nodeview-widget .pm-nodeview-content").first();
			await expect(widgetContent).toBeVisible({ timeout: 5000 });
			await widgetContent.evaluate((el) => {
				el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
			});
			const selectionInfo = await selectFirstWidgetBlockNode(editor);
			expect(selectionInfo).toEqual({ selectionType: "NodeSelection", selectedNodeType: "paragraph" });
			await expect(editor.locator(".pm-nodeview-widget").first()).toHaveClass(/pm-nodeview-selected/);
		});
	});

});
