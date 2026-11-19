"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest } = require("../helpers.js");

test.describe("ProseMirror Editor - Source safety", () => {
	test("companion serializer edits reach the source and the visual document", async ({ page }) => {
		const title = "SourceSafeSerializerMutation";
		const source = "<<now    'YYYY'>>\n\n```js\nkeep this suffix\n```\n\n* keep this suffix";
		const editor = await setupProseMirrorTest(page,title,{
			useReadmeTiddler: false, initialText: source
		});
		await page.evaluate((title) => {
			const original = $tw.wiki.getTiddlerText(title);
			const tree = $tw.wiki.parseText("text/vnd.tiddlywiki",original).tree;
			tree[1].attributes.code.value = "keep";
			tree[1].attributes.language.value = "css";
			tree[2].children[0].children[0].text = "keep";
			$tw.wiki.setText(title,"text",null,$tw.utils.serializeWikitextParseTree(tree,{source: original}));
		},title);
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe("<<now    'YYYY'>>\n\n```css\nkeep\n```\n\n* keep");
		await expect(editor.locator("pre code")).toHaveText("keep");
		await expect(editor.locator(".list-content")).toHaveText("keep");
		const codeBlock = editor.locator(".pm-nodeview-codeblock");
		await codeBlock.hover();
		await codeBlock.locator(".pm-nodeview-btn-source").click();
		await expect(editor.locator("textarea.pm-nodeview-editor")).toHaveValue(/^```css\nkeep\n```\n*$/);
	});

	test("editing a neighbour preserves table caption, class, alignment and spans", async ({ page }) => {
		const title = "SourceSafeTable";
		const table = "|caption|c\n|my-class|k\n|!A|!B|\n|one | two|\n|~|three|";
		const editor = await setupProseMirrorTest(page,title,{
			useReadmeTiddler: false, initialText: "Before\n\n" + table
		});
		await editor.locator("p").first().click();
		await page.keyboard.press("Home");
		await page.keyboard.type("X");
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe("XBefore\n\n" + table);
	});

	test("dynamic attributes never turn a loaded document into an empty one", async ({ page }) => {
		const title = "SourceSafeDynamicAttribute";
		const source = "<div class=<<mymacro param={{Something}}>>>content</div>";
		const editor = await setupProseMirrorTest(page,title,{
			useReadmeTiddler: false, initialText: source + "\n\nKeep me"
		});
		const paragraph = editor.locator("p").filter({ hasText: "Keep me" });
		await paragraph.click();
		await page.keyboard.press("End");
		await page.keyboard.type("X");
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe(source + "\n\nKeep meX");
	});

	test("explicit Markdown editing stays source-only and retains its MIME type", async ({ page }) => {
		const title = "SourceSafeMarkdown";
		const source = "# Heading\n\n**bold** and [caption](https://example.com)\n";
		const editor = await setupProseMirrorTest(page,title,{
			useReadmeTiddler: false, contentType: "text/markdown", initialText: source
		});
		await expect(editor.locator("h1")).toHaveCount(0);
		const block = editor.locator(".pm-nodeview-opaque");
		await block.hover();
		await block.locator(".pm-nodeview-btn-edit").click();
		const textarea = block.locator("textarea.pm-nodeview-editor");
		await expect(textarea).toHaveValue(source);
		const next = source.replace("# Heading","# HeadingX");
		await textarea.fill(next);
		await block.locator(".pm-nodeview-btn-edit").click();
		await expect.poll(() => page.evaluate((title) => {
			const fields = $tw.wiki.getTiddler(title).fields;
			return { text: fields.text, type: fields.type };
		},title)).toEqual({ text: next, type: "text/markdown" });
	});

	test("an inline macro is valid and survives editing surrounding text", async ({ page }) => {
		const title = "SourceSafeInlineMacro";
		const editor = await setupProseMirrorTest(page,title,{
			useReadmeTiddler: false, initialText: "Before <<now>> after"
		});
		await expect(editor.locator(".pm-opaque-inline")).toHaveCount(1);
		await editor.locator("p").click();
		await page.keyboard.press("End");
		await page.keyboard.type("X");
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe("Before <<now>> afterX");
	});
});
