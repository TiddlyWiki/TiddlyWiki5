"use strict";

const {test, expect} = require("@playwright/test");
const {pathToFileURL} = require("url");
const {setupProseMirrorTest} = require("../helpers.js");

async function saveAndReopen(page, testInfo, title) {
	const [download] = await Promise.all([
		page.waitForEvent("download"),
		page.locator(".tc-sidebar-header").getByRole("button",{name: "save changes", exact: true}).click()
	]);
	const filename = testInfo.outputPath("code-delimiters.html");
	await download.saveAs(filename);
	await page.goto("about:blank");
	await page.goto(pathToFileURL(filename).href + "#" + encodeURIComponent("Harness_" + title),{waitUntil: "domcontentloaded"});
}

test.describe("ProseMirror code delimiter safety", () => {
	test("edits a closing fence inside code, undoes it and reopens a saved wiki", async ({page}, testInfo) => {
		const title = "Code fence collision";
		const initial = "```markdown\nbefore\n```";
		const addition = "\n```\nafter \"double\" 'single' \"\"\"triple\"\"\" ]] end] 中文 📝";
		const code = "before" + addition;
		const editor = await setupProseMirrorTest(page,title,{useReadmeTiddler: false, initialText: initial});
		await page.evaluate(() => {
			const clipboard = document.createElement("textarea");
			clipboard.id = "code-clipboard";
			document.body.prepend(clipboard);
		});
		const clipboard = page.locator("#code-clipboard");
		await clipboard.fill(addition);
		await clipboard.press("ControlOrMeta+a");
		await clipboard.press("ControlOrMeta+c");
		await editor.locator("pre code").click();
		await editor.press("ControlOrMeta+End");
		await editor.press("ControlOrMeta+v");
		await expect(editor.locator("pre code")).toHaveText(code);
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toMatch(/^<\$codeblock code=\{\{\{/);
		await editor.press("ControlOrMeta+z");
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe(initial);
		await editor.press("ControlOrMeta+Shift+z");
		await expect(editor.locator("pre code")).toHaveText(code);
		await saveAndReopen(page,testInfo,title);
		await expect(editor.locator("pre code")).toHaveText(code);
		await expect(editor.locator(".pm-nodeview-opaque")).toHaveCount(0);
		await editor.locator("pre code").click();
		await editor.press("ControlOrMeta+End");
		await page.keyboard.type("X");
		await expect(editor.locator("pre code")).toHaveText(code + "X");
		await expect.poll(() => page.evaluate((title) => {
			const source = $tw.wiki.getTiddlerText(title);
			return $tw.utils.wikitextParseTree.codeBlockParts($tw.wiki.parseText("text/vnd.tiddlywiki",source).tree[0]);
		},title)).toEqual({code: code + "X", language: "markdown"});
		await editor.screenshot({path: testInfo.outputPath("code-block-after-reopen.png")});
	});

	test("retains double backticks in inline code after editing and saving", async ({page}, testInfo) => {
		const title = "Inline code collision";
		const code = "before``after <&amp;> ''bold'' <<now>> {{X}} 中文 📝";
		const editor = await setupProseMirrorTest(page,title,{useReadmeTiddler: false, initialText: "`before`"});
		await editor.locator("code").click();
		await editor.press("End");
		await page.keyboard.insertText(code.substring("before".length));
		await expect(editor.locator("code")).toHaveText(code);
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toMatch(/^<code>/);
		await saveAndReopen(page,testInfo,title);
		await expect(editor.locator("code")).toHaveText(code);
		await expect(editor.locator(".pm-nodeview-opaque")).toHaveCount(0);
		await editor.locator("code").click();
		await editor.press("End");
		await page.keyboard.type("X");
		await expect(editor.locator("code")).toHaveText(code + "X");
		await expect.poll(() => page.evaluate((title) => {
			const source = $tw.wiki.getTiddlerText(title);
			return $tw.utils.wikitextParseTree.codeText($tw.wiki.parseText("text/vnd.tiddlywiki",source).tree[0].children[0]);
		},title)).toBe(code + "X");
		await editor.screenshot({path: testInfo.outputPath("inline-code-after-reopen.png")});
	});
});
