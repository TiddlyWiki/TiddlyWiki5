"use strict";

const { test, expect } = require("@playwright/test");
const { resolve } = require("path");
const { pathToFileURL } = require("url");

const indexUrl = pathToFileURL(resolve(__dirname, "output", "test.html")).href;

async function loadTestPage(page) {
	await page.route("http://**/*", (route) => route.abort());
	await page.route("https://**/*", (route) => route.abort());
	await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
	await expect(page.locator(".tc-site-title")).toHaveText("TiddlyWiki5");
}

async function createEditor(page, title, initialText, toolbarMarkup) {
	await loadTestPage(page);
	const harnessTitle = "Harness/" + title;
	await page.evaluate(({ title, harnessTitle, initialText, toolbarMarkup }) => {
		$tw.wiki.addTiddler({
			title: title,
			text: initialText,
			type: "text/vnd.tiddlywiki"
		});
		$tw.wiki.addTiddler({
			title: harnessTitle,
			text: toolbarMarkup ?
				"<$edit-prosemirror tiddler=\"" + title + "\">" + toolbarMarkup + "</$edit-prosemirror>" :
				"<$edit-prosemirror tiddler=\"" + title + "\"/>"
		});
		const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
		$tw.wiki.addTiddler({
			title: "$:/StoryList",
			list: [harnessTitle].concat(storyList)
		});
	}, { title, harnessTitle, initialText, toolbarMarkup: toolbarMarkup || "" });
	const editor = page.locator('.tc-tiddler-frame[data-tiddler-title="' + harnessTitle + '"] .ProseMirror').first();
	await expect(editor).toBeVisible();
	return editor;
}

async function createTwoEditors(page, firstTitle, secondTitle) {
	await loadTestPage(page);
	const harnessTitle = "Harness/MultiEditor";
	await page.evaluate(({ firstTitle, secondTitle, harnessTitle }) => {
		$tw.wiki.addTiddler({ title: firstTitle, text: "First", type: "text/vnd.tiddlywiki" });
		$tw.wiki.addTiddler({ title: secondTitle, text: "Second", type: "text/vnd.tiddlywiki" });
		$tw.wiki.addTiddler({
			title: harnessTitle,
			text: "<$edit-prosemirror tiddler=\"" + firstTitle + "\"/>\n<$edit-prosemirror tiddler=\"" + secondTitle + "\"/>"
		});
		$tw.wiki.addTiddler({
			title: "$:/StoryList",
			list: [harnessTitle].concat($tw.wiki.getTiddlerList("$:/StoryList"))
		});
	}, { firstTitle, secondTitle, harnessTitle });
	const frame = page.locator('.tc-tiddler-frame[data-tiddler-title="' + harnessTitle + '"]');
	const editors = frame.locator(".ProseMirror");
	await expect(editors).toHaveCount(2);
	return { harnessTitle, editors };
}

test.describe("ProseMirror command surfaces", () => {
	test("slash menu filters in a real input and executes a native command", async ({ page }) => {
		const editor = await createEditor(page, "SlashCommandTest", "");
		await editor.click();
		await editor.press("Slash");

		const menu = page.locator(".tc-editor-command-menu:visible");
		await expect(menu).toBeVisible();
		const search = menu.locator(".tc-editor-command-menu-search");
		await expect(search).toBeFocused();
		await expect(search).toHaveAttribute("role", "combobox");
		await expect(search).toHaveAttribute("aria-expanded", "true");
		await expect(menu.locator(".tc-editor-command-menu-content")).toHaveAttribute("role", "listbox");
		await search.fill("heading 2");
		const headingCommand = menu.locator(".tc-editor-command-menu-item", { hasText: "Heading 2" });
		await expect(headingCommand).toBeVisible();
		await expect(headingCommand).toHaveAttribute("role", "option");
		await expect(headingCommand).toHaveAttribute("aria-selected", "true");
		await expect(search).toHaveAttribute("aria-activedescendant", await headingCommand.getAttribute("id"));
		await search.dispatchEvent("keydown", {
			key: "Enter",
			code: "Enter",
			keyCode: 229,
			isComposing: true
		});
		await expect(menu).toBeVisible();
		await expect(editor.locator("h2")).toHaveCount(0);
		await search.press("Enter");

		await expect(menu).toBeHidden();
		await expect(editor.locator("h2")).toHaveCount(1);
		await page.keyboard.type("Visual heading");
		await expect(editor.locator("h2")).toHaveText("Visual heading");
		await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("SlashCommandTest"))).toContain("!! Visual heading");
	});

	test("cancelling the slash menu inserts a literal slash", async ({ page }) => {
		const editor = await createEditor(page, "LiteralSlashTest", "");
		await editor.click();
		await editor.press("Slash");

		const menu = page.locator(".tc-editor-command-menu:visible");
		const search = menu.locator(".tc-editor-command-menu-search");
		await expect(search).toBeFocused();
		await search.fill("no such command");
		await search.press("Escape");

		await expect(menu).toBeHidden();
		await expect(editor).toHaveText("/");
		await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("LiteralSlashTest"))).toBe("/");
	});

	test("slash in ordinary text remains ordinary input", async ({ page }) => {
		const editor = await createEditor(page, "InlineSlashTest", "before");
		await editor.locator("p").click();
		await page.keyboard.press("End");
		await editor.press("Slash");

		await expect(page.locator(".tc-editor-command-menu:visible")).toHaveCount(0);
		await expect(editor).toHaveText("before/");
		await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("InlineSlashTest"))).toBe("before/");
	});

	test("long unbroken WikiText does not widen the editor", async ({ page }) => {
		const longFilter = "[all[tiddlers]" + "prefix[$:/very/long/unbroken/filter/segment/]".repeat(80) + "]";
		const editor = await createEditor(page, "LongWikiTextTest", longFilter);
		const dimensions = await editor.evaluate((element) => {
			const wrapper = element.closest(".tc-prosemirror-wrapper");
			return {
				editorClientWidth: element.clientWidth,
				editorScrollWidth: element.scrollWidth,
				wrapperClientWidth: wrapper.clientWidth,
				wrapperScrollWidth: wrapper.scrollWidth
			};
		});
		expect(dimensions.editorScrollWidth).toBeLessThanOrEqual(dimensions.editorClientWidth + 1);
		expect(dimensions.wrapperScrollWidth).toBeLessThanOrEqual(dimensions.wrapperClientWidth + 1);
	});

	test("clicking the drag handle opens the shared block menu", async ({ page }) => {
		const editor = await createEditor(page, "BlockMenuTest", "First paragraph\n\nSecond paragraph");
		await editor.locator("p").first().hover();

		const handle = page.locator(".tc-prosemirror-drag-handle:visible");
		await expect(handle).toBeVisible();
		await handle.click();
		await expect(handle).toHaveAttribute("aria-expanded", "true");

		const menu = page.locator(".tc-editor-command-menu:visible");
		const search = menu.locator(".tc-editor-command-menu-search");
		await expect(search).toBeFocused();
		await search.fill("duplicate");
		await menu.locator(".tc-editor-command-menu-item", { hasText: "Duplicate" }).click();

		await expect(menu).toBeHidden();
		await expect(editor.locator("p")).toHaveCount(3);
		expect(await editor.locator("p").allTextContents()).toEqual([
			"First paragraph",
			"First paragraph",
			"Second paragraph"
		]);
		await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("BlockMenuTest"))).toContain("First paragraph\n\nFirst paragraph");
	});

	test("the standard transcludify toolbar message uses an inline AST transaction", async ({ page }) => {
		const toolbarMarkup = "<$button class=\"test-transcludify\"><$action-sendmessage $message=\"tm-edit-text-operation\" $param=\"wrap-selection\" prefix=\"{{\" suffix=\"}}\" trimSelection=\"yes\"/>Transcludify</$button>";
		const editor = await createEditor(page, "TranscludifyToolbarTest", "Target", toolbarMarkup);
		await page.evaluate((title) => {
			function findEngine(widget) {
				if(widget && widget.engine && widget.engine.view && widget.editTitle === title) {
					return widget.engine;
				}
				for(const child of widget && widget.children || []) {
					const engine = findEngine(child);
					if(engine) return engine;
				}
				return null;
			}
			const engine = findEngine($tw.rootWidget);
			const TextSelection = $tw.modules.execute("prosemirror-state").TextSelection;
			engine.view.dispatch(engine.view.state.tr.setSelection(
				TextSelection.create(engine.view.state.doc, 1, 7)
			));
		}, "TranscludifyToolbarTest");

		await page.locator(".test-transcludify").click();
		await expect(editor.locator(".pm-opaque-inline")).toHaveCount(1);
		await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("TranscludifyToolbarTest"))).toBe("{{Target}}");

		await editor.press("Control+z");
		await expect(editor.locator(".pm-opaque-inline")).toHaveCount(0);
		await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("TranscludifyToolbarTest"))).toBe("Target");
	});

	test("multiple editor instances isolate command state and clean up their menus", async ({ page }) => {
		const { harnessTitle, editors } = await createTwoEditors(page, "MultiEditorFirst", "MultiEditorSecond");
		const first = editors.nth(0);
		const second = editors.nth(1);

		await first.locator("p").click();
		await page.keyboard.press("Home");
		await first.press("Slash");
		const menu = page.locator(".tc-editor-command-menu:visible");
		await menu.locator(".tc-editor-command-menu-search").fill("heading 1");
		await menu.locator(".tc-editor-command-menu-search").press("Enter");
		await expect(first.locator("h1")).toHaveText("First");
		await expect(second.locator("p")).toHaveText("Second");
		await expect.poll(() => page.evaluate(() => ({
			first: $tw.wiki.getTiddlerText("MultiEditorFirst"),
			second: $tw.wiki.getTiddlerText("MultiEditorSecond")
		}))).toEqual({ first: "! First", second: "Second" });

		await second.locator("p").click();
		await page.keyboard.press("Home");
		await second.press("Slash");
		await expect(page.locator(".tc-editor-command-menu:visible")).toHaveCount(1);
		await page.evaluate((title) => {
			$tw.wiki.addTiddler({
				title: "$:/StoryList",
				list: $tw.wiki.getTiddlerList("$:/StoryList").filter((item) => item !== title)
			});
		}, harnessTitle);
		await expect(page.locator(".tc-editor-command-menu")).toHaveCount(0);
	});
});
