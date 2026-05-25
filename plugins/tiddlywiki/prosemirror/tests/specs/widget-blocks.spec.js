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

function setFirstWidgetBlockNodeSelection(editor) {
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
		const view = engine.view;
		const NodeSelection = $tw.modules.execute("prosemirror-state").NodeSelection;
		let widgetPos = null;
		view.state.doc.descendants((node, pos) => {
			if(widgetPos !== null) return false;
			if(node.type && node.type.name === "paragraph" && /^<</.test((node.textContent || "").trim())) {
				widgetPos = pos;
				return false;
			}
		});
		if(widgetPos === null) return { selectionType: null, selectedNodeType: null };
		view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, widgetPos)));
		view.focus();
		const sel = view.state.selection;
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
	test("should render widget syntax as block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type('<<now "YYYY-MM-DD">>');
		await page.waitForTimeout(800);
		const widgetBlocks = page.locator(".pm-nodeview-widget");
		expect(await widgetBlocks.count()).toBeGreaterThan(0);
		await expect(widgetBlocks.first().locator(".pm-nodeview-header")).toContainText("Widget: now");
	});

	test("should enter edit mode when clicking edit button", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		const widgetBlock = editor.locator(".pm-nodeview-widget").first();
		await expect(widgetBlock).toBeVisible({ timeout: 5000 });
		await widgetBlock.hover();
		await expect(widgetBlock.locator(".pm-nodeview-btn-edit").first()).toBeVisible({ timeout: 2000 });
		await widgetBlock.locator(".pm-nodeview-btn-edit").first().evaluate((el) => el.click());
		await expect(widgetBlock.locator("textarea.pm-nodeview-editor")).toHaveCount(1, { timeout: 10000 });
		await expect(widgetBlock.locator("textarea.pm-nodeview-editor").first()).toBeVisible({ timeout: 10000 });
	});

	test("should show delete button in edit mode", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		const widgetBlock = editor.locator(".pm-nodeview-widget").first();
		await expect(widgetBlock).toBeVisible({ timeout: 2000 });
		await widgetBlock.hover();
		await expect(widgetBlock.locator(".pm-nodeview-btn-delete")).toBeHidden();

		const editState = await editor.evaluate(async (root) => {
			const waitFrame = () => new Promise((resolve) => {
				requestAnimationFrame(resolve);
			});
			const findEditingWidget = async (n) => {
				await waitFrame();
				const el = root.querySelector(".pm-nodeview-widget.pm-nodeview-editing");
				if(el || n <= 1) return el;
				return findEditingWidget(n - 1);
			};
			const editBtn = root.querySelector(".pm-nodeview-widget .pm-nodeview-btn-edit");
			if(!editBtn) return { ok: false, step: "editBtn" };
			editBtn.click();
			const editingWidget = await findEditingWidget(10);
			if(!editingWidget) return { ok: false, step: "editingWidget" };
			const deleteBtn = editingWidget.querySelector(".pm-nodeview-btn-delete");
			if(!deleteBtn) return { ok: false, step: "deleteBtn" };
			return { ok: getComputedStyle(deleteBtn).display !== "none", step: "display", display: getComputedStyle(deleteBtn).display };
		});
		expect(editState).toEqual({ ok: true, step: "display", display: "flex" });
	});

	test("should save changes when clicking save button", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		await expect(editor.locator(".pm-nodeview-widget").first()).toBeVisible({ timeout: 5000 });

		const saveResult = await editor.evaluate(async (root, newText) => {
			const waitFrame = () => new Promise((resolve) => {
				requestAnimationFrame(resolve);
			});
			const findTextarea = async (n) => {
				await waitFrame();
				const el = root.querySelector(".pm-nodeview-widget textarea.pm-nodeview-editor");
				if(el || n <= 1) return el;
				return findTextarea(n - 1);
			};
			const editBtn = root.querySelector(".pm-nodeview-widget .pm-nodeview-btn-edit");
			if(!editBtn) return { ok: false, step: "editBtn" };
			editBtn.click();
			const textarea = await findTextarea(10);
			if(!textarea) return { ok: false, step: "textarea" };
			textarea.value = newText;
			textarea.dispatchEvent(new Event("input", { bubbles: true }));
			editBtn.click();
			return { ok: true };
		}, '<<now "YYYY">>');
		expect(saveResult).toEqual({ ok: true });
		await expect(editor.locator(".pm-nodeview-widget .pm-nodeview-header").first()).toContainText("Widget: now");
	});

	test("should delete widget when clicking delete button", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		const widgetBlock = editor.locator(".pm-nodeview-widget").first();
		await expect(widgetBlock).toBeVisible({ timeout: 5000 });

		const deleteResult = await editor.evaluate(async (root) => {
			const waitFrame = () => new Promise((resolve) => {
				requestAnimationFrame(resolve);
			});
			const waitFor = async (selector, retries) => {
				const el = root.querySelector(selector);
				if(el || retries <= 1) {
					return el;
				}
				await waitFrame();
				return waitFor(selector, retries - 1);
			};
			const editBtn = root.querySelector(".pm-nodeview-widget .pm-nodeview-btn-edit");
			if(!editBtn) {
				return { ok: false, step: "editBtn" };
			}
			editBtn.click();
			const deleteBtn = await waitFor(".pm-nodeview-widget.pm-nodeview-editing .pm-nodeview-btn-delete", 30);
			if(!deleteBtn) {
				return { ok: false, step: "deleteBtn" };
			}
			deleteBtn.click();
			await waitFrame();
			return { ok: true };
		});
		expect(deleteResult).toEqual({ ok: true });
		await expect(editor.locator(".pm-nodeview-widget")).toHaveCount(0, { timeout: 10000 });
	});

	test("should support multiple widget syntaxes", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		await expect(editor.locator(".pm-nodeview-widget").first()).toBeVisible({ timeout: 2000 });
		await page.keyboard.type("\n\n<<list-links '[tag[test]]'>>");
		await expect(editor.locator(".pm-nodeview-widget")).toHaveCount(2);
	});

	test("should convert pasted widget syntax to block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await pastePlainText(editor, '<<now "YYYY-MM-DD">>');
		await expect.poll(() => editor.locator(".pm-nodeview-widget").count(), { timeout: 5000 }).toBe(1);
	});

	test("should allow adding a new line after a widget block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		await expect(page.locator(".pm-nodeview-widget").first()).toBeVisible({ timeout: 2000 });
		await page.keyboard.type("\n\nAfter widget");
		await expect(editor).toContainText("After widget");
	});

	test("clicking read-only widget content should select the widget block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, "WidgetListLinkSelection", {
			useReadmeTiddler: false,
			initialText: '<<list-links "[tag[test]]">>',
			configTiddlers: [
				{ title: "TaggedA", text: "A", tags: ["test"] },
				{ title: "TaggedB", text: "B", tags: ["test"] }
			]
		});
		const widgetContent = editor.locator(".pm-nodeview-widget .pm-nodeview-content").first();
		await expect(widgetContent).toBeVisible({ timeout: 5000 });
		await widgetContent.evaluate((el) => {
			el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
		});
		const selectionInfo = await selectFirstWidgetBlockNode(editor);
		expect(selectionInfo).toEqual({ selectionType: "NodeSelection", selectedNodeType: "paragraph" });
		await expect(editor.locator(".pm-nodeview-widget").first()).toHaveClass(/pm-nodeview-selected/);
	});

	test("links inside list-links widget should remain clickable", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, "WidgetListLinkClick", {
			useReadmeTiddler: false,
			initialText: '<<list-links "[tag[test]]">>',
			configTiddlers: [
				{ title: "TaggedLinkA", text: "A", tags: ["test"] },
				{ title: "TaggedLinkB", text: "B", tags: ["test"] }
			]
		});
		const firstLink = editor.locator(".pm-nodeview-widget .pm-nodeview-content a").first();
		await expect(firstLink).toBeVisible({ timeout: 5000 });
		await firstLink.click();
		await expect(page.locator('.tc-tiddler-frame[data-tiddler-title="TaggedLinkA"]')).toBeVisible({ timeout: 5000 });
	});

	test("Enter on a selected read-only widget block should insert a paragraph after it", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, "WidgetListLinkEnter", {
			useReadmeTiddler: false,
			initialText: '<<list-links "[tag[test]]">>',
			configTiddlers: [
				{ title: "TaggedEnterA", text: "A", tags: ["test"] },
				{ title: "TaggedEnterB", text: "B", tags: ["test"] }
			]
		});
		const widgetBlock = editor.locator(".pm-nodeview-widget").first();
		await expect(widgetBlock).toBeVisible({ timeout: 5000 });
		expect(await setFirstWidgetBlockNodeSelection(editor)).toEqual({ selectionType: "NodeSelection", selectedNodeType: "paragraph" });
		await page.keyboard.press("Enter");
		await page.keyboard.type("After widget block");
		await expect(editor.locator(":scope > .pm-nodeview-widget + p").first()).toContainText("After widget block");
		await expect(widgetBlock).not.toContainText("After widget block");
	});

	test("Shift-Enter on a selected read-only widget block should insert a paragraph after it", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, "WidgetListLinkShiftEnter", {
			useReadmeTiddler: false,
			initialText: '<<list-links "[tag[test]]">>',
			configTiddlers: [
				{ title: "TaggedShiftA", text: "A", tags: ["test"] },
				{ title: "TaggedShiftB", text: "B", tags: ["test"] }
			]
		});
		const widgetBlock = editor.locator(".pm-nodeview-widget").first();
		await expect(widgetBlock).toBeVisible({ timeout: 5000 });
		expect(await setFirstWidgetBlockNodeSelection(editor)).toEqual({ selectionType: "NodeSelection", selectedNodeType: "paragraph" });
		await page.keyboard.press("Shift+Enter");
		await page.keyboard.type("After shift enter");
		await expect(editor.locator(":scope > .pm-nodeview-widget + p").first()).toContainText("After shift enter");
		await expect(widgetBlock).not.toContainText("After shift enter");
	});

});
