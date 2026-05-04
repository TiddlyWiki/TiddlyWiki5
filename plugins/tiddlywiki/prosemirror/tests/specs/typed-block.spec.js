"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, clearEditor } = require("../helpers.js");

// ─────────────────────────────────────────────────────────────────────────────
// Typed Block
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Typed Block", () => {
	test("should render typed block with type dropdown", async ({ page }) => {
		await setupProseMirrorTest(page, null, {
			initialText: '$$$application/javascript\nconsole.log("hello");\n$$$'
		});
		const typedBlock = page.locator(".pm-nodeview-typedblock");
		await expect(typedBlock).toBeVisible({ timeout: 5000 });
		const select = typedBlock.locator(".pm-typed-block-type-select");
		await expect(select).toBeVisible();
		await expect(select).toHaveValue("application/javascript");
		const selectedType = await select.evaluate((el) => ({
			label: el.selectedOptions[0] ? el.selectedOptions[0].textContent.trim() : "",
			width: el.clientWidth
		}));
		expect(selectedType.label).toBe("JavaScript");
		expect(selectedType.width).toBeGreaterThan(40);
		await expect(typedBlock.locator(".pm-typed-block-content")).toContainText('console.log("hello");');
	});

	test("should insert typed block via slash menu", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await editor.click();
		await editor.press("Slash");
		const menu = page.locator(".tw-slash-menu-root");
		await expect(menu).toBeVisible({ timeout: 5000 });
		await page.keyboard.type("JavaScript");
		await page.waitForTimeout(200);
		await expect(menu.locator(".tw-slash-menu-item-label", { hasText: "$$$ JavaScript" })).toBeVisible();
		await page.keyboard.press("Enter");
		await expect(menu).toBeHidden({ timeout: 5000 });
		await expect(page.locator(".pm-nodeview-typedblock")).toBeVisible({ timeout: 5000 });
	});

	test("should change type via dropdown", async ({ page }) => {
		await setupProseMirrorTest(page, null, { initialText: "$$$application/javascript\ncode here\n$$$" });
		const select = page.locator(".pm-typed-block-type-select").first();
		await expect(select).toBeVisible({ timeout: 5000 });
		await select.selectOption("text/css");
		await page.waitForTimeout(200);
		await expect(select).toHaveValue("text/css");
	});

	test("typed block round-trip should preserve content", async ({ page }) => {
		await setupProseMirrorTest(page, null, { initialText: "$$$application/javascript\nvar x = 1;\n$$$" });
		await expect(page.locator(".pm-nodeview-typedblock")).toBeVisible({ timeout: 5000 });
		const savedText = await page.evaluate(() => $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/example"));
		expect(savedText).toContain("$$$");
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Typed Block Edit Button
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Typed Block Edit Button", () => {
	test.describe.configure({ retries: 2 });

	test("edit button should toggle between edit and save icons", async ({ page }) => {
		await setupProseMirrorTest(page, null, {
			initialText: '$$$application/javascript\nconsole.log("test");\n$$$'
		});
		const editBtn = page.locator(".pm-nodeview-typedblock .pm-nodeview-btn-edit").first();
		await expect(editBtn).toBeVisible({ timeout: 5000 });
		await editBtn.scrollIntoViewIfNeeded();
		await expect(editBtn).toHaveAttribute("title", /edit/i);
		await editBtn.evaluate((el) => el.click());
		await page.waitForTimeout(300);
		await expect(page.locator(".pm-nodeview-typedblock .pm-nodeview-btn-edit").first()).toHaveAttribute("title", /save/i);
		await expect(page.locator(".pm-nodeview-typedblock textarea.pm-nodeview-editor").first()).toBeVisible();
		await page.locator(".pm-nodeview-typedblock .pm-nodeview-btn-edit").first().evaluate((el) => el.click());
		await page.waitForTimeout(500);
		const editBtnFinal = page.locator(".pm-nodeview-typedblock .pm-nodeview-btn-edit").first();
		await expect(editBtnFinal).toBeVisible({ timeout: 3000 });
		await expect(editBtnFinal).toHaveAttribute("title", /edit/i, { timeout: 3000 });
		await expect(page.locator(".pm-nodeview-typedblock textarea.pm-nodeview-editor").first()).toBeHidden();
	});

	test("double-clicking edit button should not crash", async ({ page }) => {
		await setupProseMirrorTest(page, null, { initialText: "$$$text/css\nbody { color: red; }\n$$$" });
		const editBtn = page.locator(".pm-nodeview-typedblock .pm-nodeview-btn-edit").first();
		await expect(editBtn).toBeVisible({ timeout: 5000 });
		await editBtn.scrollIntoViewIfNeeded();
		await editBtn.click({ force: true });
		await page.waitForTimeout(100);
		await editBtn.click({ force: true });
		await page.waitForTimeout(200);
		const errors = [];
		page.on("pageerror", (err) => errors.push(err.message));
		await page.waitForTimeout(300);
		expect(errors.filter((e) => e.includes("replaceChild"))).toHaveLength(0);
	});
});
