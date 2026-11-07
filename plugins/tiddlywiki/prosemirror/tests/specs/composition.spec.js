"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest } = require("../helpers.js");

async function expectComposing(editor, expected) {
	await expect.poll(() => editor.evaluate((root) => {
		function find(widget) {
			if(widget.engine && widget.engine.view && widget.engine.view.dom === root) {
				return widget.engine.view.composing;
			}
			for(const child of widget.children || []) {
				const composing = find(child);
				if(composing !== undefined) return composing;
			}
		}
		return find($tw.rootWidget);
	})).toBe(expected);
}

test("Chromium browser IME input commits Chinese text as one undoable edit", async ({ page, browserName }) => {
	test.skip(browserName !== "chromium","Chromium DevTools IME input protocol; OS candidate windows are outside this test");
	const title = "NativeCompositionSource";
	const editor = await setupProseMirrorTest(page,title,{ initialText: "", useReadmeTiddler: false });
	await editor.click();
	const session = await page.context().newCDPSession(page);
	try {
		// These commands use Chromium's input/composition path rather than
		// dispatching synthetic DOM CompositionEvents in page JavaScript.
		await session.send("Input.imeSetComposition",{ text: "zhong", selectionStart: 5, selectionEnd: 5 });
		await expectComposing(editor,true);
		await expect(editor).toHaveText("zhong");
		await session.send("Input.imeSetComposition",{ text: "中文", selectionStart: 2, selectionEnd: 2 });
		await session.send("Input.insertText",{ text: "中文" });
		await expectComposing(editor,false);
		await expect(editor).toHaveText("中文");
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe("中文");
		await expect(page.locator(".tc-editor-command-menu:visible")).toHaveCount(0);
		await editor.press("ControlOrMeta+z");
		await expect(editor).toHaveText("");
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe("");
	} finally{
		await session.detach();
	}
});
