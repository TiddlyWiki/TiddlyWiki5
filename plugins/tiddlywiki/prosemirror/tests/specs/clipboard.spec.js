"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, selectAllEditorContent } = require("../helpers.js");

test.describe("ProseMirror Editor - Clipboard", () => {
	// Keep native clipboard operations in this file sequential even when the
	// surrounding suite is fully parallel.
	test.describe.configure({ mode: "default" });

	["copy", "cut"].forEach((operation) => {
		test(operation + " retains inline source and typed-block bodies in plain text", async ({ page }) => {
			const title = "ClipboardSource_" + operation;
			const source = "Before <<now>> after\n\n$$$text/plain\nKeep the whole body\nSecond line\n$$$";
			const editor = await setupProseMirrorTest(page,title,{
				useReadmeTiddler: false, initialText: source
			});
			// A native textarea represents the destination in a plain-text editor.
			// Exercise the browser clipboard using real copy/cut/paste shortcuts.
			await editor.evaluate((element) => {
				const destination = element.ownerDocument.createElement("textarea");
				destination.setAttribute("aria-label","Plain-text clipboard destination");
				element.closest(".tc-tiddler-body").appendChild(destination);
			});
			await selectAllEditorContent(editor);
			await editor.press(operation === "copy" ? "ControlOrMeta+c" : "ControlOrMeta+x");
			const destination = page.getByRole("textbox", { name: "Plain-text clipboard destination" });
			await destination.focus();
			await destination.press("ControlOrMeta+v");
			await expect(destination).toHaveValue("Before <<now>> after\n\nKeep the whole body\nSecond line");
			if(operation === "cut") {
				await expect(editor).toHaveText("");
				await expect(editor.locator(".pm-nodeview-typedblock")).toHaveCount(0);
				await editor.focus();
				await editor.press("ControlOrMeta+z");
			}
			await expect.poll(() => page.evaluate((name) => $tw.wiki.getTiddlerText(name),title)).toBe(source);

			// The same clipboard also retains its structured HTML for a rich paste.
			await selectAllEditorContent(editor);
			await editor.press("Backspace");
			await editor.press("ControlOrMeta+v");
			await expect(editor.locator(".pm-opaque-inline")).toHaveCount(1);
			await expect(editor.locator(".pm-nodeview-typedblock")).toHaveCount(1);
			await expect.poll(() => page.evaluate((name) => $tw.wiki.getTiddlerText(name),title)).toBe(source);
		});
	});
});
