"use strict";

const { test, expect } = require("@playwright/test");
const {
	setupProseMirrorTest, clearEditor, pastePlainText
} = require("../helpers.js");

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
		await widgetBlock.hover();
		const editBtn = widgetBlock.locator(".pm-nodeview-btn-edit").first();
		await expect(editBtn).toBeVisible({ timeout: 5000 });
		await editBtn.click();
		const deleteBtn = widgetBlock.locator(".pm-nodeview-btn-delete").first();
		await expect(deleteBtn).toBeVisible({ timeout: 5000 });
		await deleteBtn.evaluate((el) => el.click());
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

});
