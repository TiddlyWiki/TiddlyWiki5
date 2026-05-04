"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, clearEditor, pastePlainText } = require("../helpers.js");

test.describe("ProseMirror Editor - Images", () => {
	const imageTitle = "Motovun Jack.jpg";
	const svgText = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"24\"><rect width=\"32\" height=\"24\" fill=\"#22c55e\"/></svg>";

	function imageTiddlerFields() {
		return { title: imageTitle, type: "image/svg+xml", text: svgText };
	}

	test("should render [img[...]] and <$image .../> as images", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "[img[Motovun Jack.jpg]]\n\n<$image source=\"Motovun Jack.jpg\" />",
			configTiddlers: [imageTiddlerFields()]
		});
		const editorImgs = editor.locator(`img[data-tw-source="${imageTitle}"]`);
		await expect(editorImgs).toHaveCount(2);
		const firstSrc = await editorImgs.first().getAttribute("src");
		expect(firstSrc).toContain("data:image/svg+xml");
	});

	test("should convert pasted image syntax into image node and allow deletion", async ({ page }) => {
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "",
			configTiddlers: [imageTiddlerFields()]
		});
		await clearEditor(editor);
		await pastePlainText(editor, "[img[Motovun Jack.jpg]]");
		const img = editor.locator(`img[data-tw-source="${imageTitle}"]`).first();
		await expect(img).toBeVisible({ timeout: 5000 });
		await page.waitForTimeout(600);
		expect(await page.evaluate((t) => $tw.wiki.getTiddlerText(t, ""), exampleTitle)).toContain("[img[Motovun Jack.jpg]]");
		await editor.click();
		await editor.press("Control+A");
		await editor.press("Backspace");
		await expect(editor.locator(`img[data-tw-source="${imageTitle}"]`)).toHaveCount(0);
		await page.waitForTimeout(600);
		expect(await page.evaluate((t) => $tw.wiki.getTiddlerText(t, ""), exampleTitle)).not.toContain("Motovun Jack.jpg");
	});

	test("should open built-in image picker and replace selected image", async ({ page }) => {
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		const tiddlers = [
			imageTiddlerFields(),
			{ title: "Second Image.svg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"24\"><rect width=\"32\" height=\"24\" fill=\"#3b82f6\"/></svg>" }
		];
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "[img[Motovun Jack.jpg]]",
			configTiddlers: tiddlers
		});
		const img = editor.locator(`img[data-tw-source="${imageTitle}"]`).first();
		await expect(img).toBeVisible({ timeout: 5000 });
		await img.evaluate((el) => el.click());
		await page.waitForTimeout(300);
		const editBtn = editor.locator(".pm-nodeview-image .pm-nodeview-btn-edit").first();
		await expect(editBtn).toBeVisible();
		expect(await editBtn.innerHTML()).toContain("<svg");
		await editBtn.evaluate((el) => el.click());
		const sourceInput = editor.locator('.pm-nodeview-image .pm-nodeview-form-input[data-key="twSource"]').first();
		await expect(sourceInput).toBeVisible();
		await expect(sourceInput).toHaveValue("Motovun Jack.jpg");
		await expect(editor.locator(".pm-nodeview-image .pm-nodeview-btn-delete").first()).toBeVisible();
		const picker = editor.locator(".pm-nodeview-image .pm-image-nodeview-picker").first();
		await expect(picker).toBeVisible();
		await picker.locator(".tc-image-chooser a[title=\"Second Image.svg\"]").first().click();
		await expect(sourceInput).not.toBeVisible({ timeout: 2000 });
		await expect(editor.locator('img[data-tw-source="Second Image.svg"]')).toHaveCount(1);
		await page.waitForTimeout(600);
		const saved = await page.evaluate((t) => $tw.wiki.getTiddlerText(t, ""), exampleTitle);
		expect(saved).toContain("Second Image.svg");
		expect(saved).not.toContain("Motovun Jack.jpg");
	});

	test("should support <$image> widget syntax editing", async ({ page }) => {
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		const tiddlers = [
			imageTiddlerFields(),
			{ title: "Another.svg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"24\"><rect width=\"32\" height=\"24\" fill=\"#ff0000\"/></svg>" }
		];
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "<$image source=\"Motovun Jack.jpg\"/>",
			configTiddlers: tiddlers
		});
		const img = editor.locator("img[data-tw-source=\"Motovun Jack.jpg\"]").first();
		await expect(img).toBeVisible({ timeout: 5000 });
		await img.evaluate((el) => el.click());
		await page.waitForTimeout(300);
		await editor.locator(".pm-nodeview-image .pm-nodeview-btn-edit").first().evaluate((el) => el.click());
		const sourceInput = editor.locator('.pm-nodeview-image .pm-nodeview-form-input[data-key="twSource"]').first();
		await expect(sourceInput).toBeVisible();
		await expect(sourceInput).toHaveValue("Motovun Jack.jpg");
		await editor.locator(".pm-nodeview-image .pm-image-nodeview-picker").first()
			.locator(".tc-image-chooser a[title=\"Another.svg\"]").first().click();
		await expect(editor.locator('img[data-tw-source="Another.svg"]')).toHaveCount(1);
		await page.waitForTimeout(600);
		expect(await page.evaluate((t) => $tw.wiki.getTiddlerText(t, ""), exampleTitle)).toContain("<$image source=\"Another.svg\"/>");
	});

	test("should preserve width and height attributes", async ({ page }) => {
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "[img width=100 height=80 [Test.svg]]",
			configTiddlers: [{ title: "Test.svg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"150\"><rect width=\"200\" height=\"150\" fill=\"#3b82f6\"/></svg>" }]
		});
		const img = editor.locator('img[data-tw-source="Test.svg"]').first();
		await expect(img).toBeVisible({ timeout: 5000 });
		await expect(img).toHaveAttribute("width", "100");
		await expect(img).toHaveAttribute("height", "80");
		await page.waitForTimeout(600);
		const saved = await page.evaluate((t) => $tw.wiki.getTiddlerText(t, ""), exampleTitle);
		expect(saved).toContain("width=100");
		expect(saved).toContain("height=80");
	});

	test("should preserve width and height when using image picker in edit mode", async ({ page }) => {
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		const tiddlers = [
			{ title: "Image1.svg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"150\"><rect width=\"200\" height=\"150\" fill=\"#3b82f6\"/></svg>" },
			{ title: "Image2.svg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"><circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"#ef4444\"/></svg>" }
		];
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "[img width=120 height=90 [Image1.svg]]",
			configTiddlers: tiddlers
		});
		const img = editor.locator('img[data-tw-source="Image1.svg"]').first();
		await expect(img).toBeVisible({ timeout: 5000 });
		await img.click();
		await editor.locator(".pm-nodeview-btn-edit").first().evaluate((el) => el.click());
		await expect(editor.locator('.pm-nodeview-form-input[data-key="twSource"]').first()).toHaveValue("Image1.svg");
		await expect(editor.locator('.pm-nodeview-form-input[data-key="width"]').first()).toHaveValue("120");
		await expect(editor.locator('.pm-nodeview-form-input[data-key="height"]').first()).toHaveValue("90");
		await editor.locator(".pm-image-nodeview-picker").first()
			.locator(".tc-image-chooser a[title=\"Image2.svg\"]").first().click();
		await expect(editor.locator('img[data-tw-source="Image2.svg"]')).toBeVisible({ timeout: 2000 });
		await page.waitForTimeout(600);
		const saved = await page.evaluate((t) => $tw.wiki.getTiddlerText(t, ""), exampleTitle);
		expect(saved).toContain("width=\"120\"");
		expect(saved).toContain("height=\"90\"");
		expect(saved).toContain("Image2.svg");
		expect(saved).not.toContain("Image1.svg");
	});
});
