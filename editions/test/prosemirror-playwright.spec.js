"use strict";

const { test, expect } = require("@playwright/test");
const { resolve } = require("path");
const { pathToFileURL } = require("url");

const indexUrl = pathToFileURL(resolve(__dirname, "output", "test.html")).href;

function parseRgb(cssColor) {
	const components = cssColor.match(/[\d.]+/g);
	if(!components || components.length < 3) throw new Error("Unsupported CSS colour: " + cssColor);
	return components.slice(0, 3).map((component) => Number(component) / 255);
}

function relativeLuminance(cssColor) {
	const rgb = parseRgb(cssColor).map((component) => (component <= 0.04045 ?
		component / 12.92 : Math.pow((component + 0.055) / 1.055, 2.4)));
	return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(foreground, background) {
	const foregroundLuminance = relativeLuminance(foreground);
	const backgroundLuminance = relativeLuminance(background);
	return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
		(Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

async function loadTestPage(page) {
	await page.route("http://**/*", (route) => route.abort());
	await page.route("https://**/*", (route) => route.abort());
	await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
	await expect(page.locator(".tc-site-title")).toHaveText("TiddlyWiki5");
}

async function createEditor(page, title, initialText, toolbarMarkup, palette) {
	await loadTestPage(page);
	const harnessTitle = "Harness/" + title;
	await page.evaluate(({ title, harnessTitle, initialText, toolbarMarkup, palette }) => {
		if(palette) $tw.wiki.setText("$:/palette","text",null,"$:/palettes/" + palette);
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
	}, { title, harnessTitle, initialText, toolbarMarkup: toolbarMarkup || "", palette: palette || "" });
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

async function moveToBlockStart(editor) {
	await editor.press("Home");
	// Home updates the native caret before the asynchronous selectionchange
	// reaches ProseMirror. Context-sensitive commands need that transition.
	await expect.poll(() => editor.evaluate((root) => {
		let offset = null;
		function visit(widget) {
			if(widget.engine && widget.engine.view && widget.engine.view.dom === root) {
				offset = widget.engine.view.state.selection.$from.parentOffset;
			}
			(widget.children || []).forEach(visit);
		}
		visit($tw.rootWidget);
		return offset;
	})).toBe(0);
}

async function expectReadablePlaceholder(search) {
	await expect.poll(async () => {
		const colours = await search.evaluate((input) => ({
			foreground: getComputedStyle(input,"::placeholder").color,
			background: getComputedStyle(input).backgroundColor
		}));
		return contrastRatio(colours.foreground,colours.background);
	}).toBeGreaterThanOrEqual(4.5);
	await expect.poll(() => search.evaluate((input) => getComputedStyle(input,"::placeholder").opacity)).toBe("1");
}

test.describe("ProseMirror command surfaces", () => {
	test("RTL block menu stays in the gutter and duplicates the intended block", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		const title = "RTLBlockMenuTest";
		const editor = await createEditor(page,title,"مرحبا بالعالم\n\nשלום עולם");
		await page.evaluate(() => document.documentElement.setAttribute("dir","rtl"));
		const paragraph = editor.locator("p").first();
		await paragraph.hover();
		const handle = page.locator(".tc-prosemirror-drag-handle:visible");
		await expect(handle).toBeVisible();
		const paragraphBox = await paragraph.boundingBox();
		const handleBox = await handle.boundingBox();
		expect(handleBox.x).toBeGreaterThanOrEqual(paragraphBox.x + paragraphBox.width - 2);
		expect(handleBox.x + handleBox.width).toBeLessThanOrEqual(390);
		await handle.click();
		const menu = page.locator(".tc-editor-command-menu:visible");
		await expect(menu).toBeVisible();
		const menuBox = await menu.boundingBox();
		expect(menuBox.x).toBeGreaterThanOrEqual(0);
		expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(390);
		await menu.locator("input").fill("duplicate");
		await menu.locator("input").press("Enter");
		await expect(editor.locator("p")).toHaveText(["مرحبا بالعالم", "مرحبا بالعالم", "שלום עולם"]);
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe("مرحبا بالعالم\n\nمرحبا بالعالم\n\nשלום עולם");
	});

	for(const surface of["slash", "block"]) {
		test(surface + " menu stays usable after viewport shrink and filter changes", async ({ page }) => {
			await page.setViewportSize({ width: 1280, height: 720 });
			const title = "MenuViewport/" + surface;
			const editor = await createEditor(page,title,"Viewport paragraph");
			if(surface === "slash") {
				await editor.locator("p").click();
				await moveToBlockStart(editor);
				await editor.press("Slash");
			} else {
				await editor.locator("p").hover();
				await page.locator(".tc-prosemirror-drag-handle:visible").click();
			}
			const menu = page.locator(".tc-editor-command-menu:visible");
			const search = menu.locator(".tc-editor-command-menu-search");
			await expect(search).toBeFocused();
			await page.setViewportSize({ width: 390, height: 250 });
			const expectInViewport = async () => {
				await expect.poll(async () => {
					const box = await menu.boundingBox();
					return !!box && box.x >= 0 && box.y >= 0 &&
						box.x + box.width <= 391 && box.y + box.height <= 251;
				}).toBe(true);
			};
			await expectInViewport();
			await search.fill("heading 2");
			await expectInViewport();
			await search.fill("");
			await expectInViewport();
			await search.fill("heading 2");
			await search.press("Enter");
			await expect(menu).toBeHidden();
			await expect(editor.locator("h2")).toHaveText("Viewport paragraph");
			await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe("!! Viewport paragraph");
		});
	}

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
		await expectReadablePlaceholder(search);
		await search.fill("heading 2");
		const headingCommand = menu.locator(".tc-editor-command-menu-item", { hasText: "Heading 2" });
		await expect(headingCommand).toBeVisible();
		await expect(headingCommand).toHaveAttribute("role", "option");
		await expect(headingCommand).toHaveAttribute("aria-selected", "true");
		await expect(search).toHaveAttribute("aria-activedescendant", await headingCommand.getAttribute("id"));
		const commandColours = await headingCommand.evaluate((item) => {
			const description = item.querySelector(".tc-editor-command-menu-item-description");
			return {
				foreground: getComputedStyle(description).color,
				background: getComputedStyle(item).backgroundColor
			};
		});
		expect(contrastRatio(commandColours.foreground, commandColours.background)).toBeGreaterThanOrEqual(4.5);
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

	test("dark menu search placeholder remains readable", async ({ page }) => {
		const editor = await createEditor(page,"DarkMenuContrastTest","","","Twilight");
		await editor.click();
		await editor.press("Slash");
		const search = page.locator(".tc-editor-command-menu:visible .tc-editor-command-menu-search");
		await expect(search).toBeVisible();
		await expectReadablePlaceholder(search);
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

	test("touch long-press opens an unclipped block menu", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		const editor = await createEditor(page, "TouchBlockMenuTest", "First mobile paragraph\n\nSecond mobile paragraph");
		await editor.locator("p").first().hover();

		const handle = page.locator(".tc-prosemirror-drag-handle:visible");
		await expect(handle).toBeVisible();
		await handle.evaluate((element) => {
			const rect = element.getBoundingClientRect();
			const touch = {
				identifier: 1,
				target: element,
				clientX: rect.x + rect.width / 2,
				clientY: rect.y + rect.height / 2
			};
			// Desktop Firefox does not expose Touch/TouchEvent constructors.
			// Supply the listener's touch data without requiring those globals.
			const event = new Event("touchstart", {
				bubbles: true,
				cancelable: true
			});
			Object.defineProperties(event, {
				touches: { value: [touch] },
				targetTouches: { value: [touch] },
				changedTouches: { value: [touch] }
			});
			element.dispatchEvent(event);
		});

		const menu = page.locator(".tc-editor-command-menu:visible");
		await expect(menu).toBeVisible();
		const menuBox = await menu.boundingBox();
		const viewport = page.viewportSize();
		expect(menuBox.x).toBeGreaterThanOrEqual(-1);
		expect(menuBox.y).toBeGreaterThanOrEqual(-1);
		expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewport.width + 1);
		expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewport.height + 1);
	});

	test("dragging the handle reorders a block and remains undoable", async ({ page }) => {
		const editor = await createEditor(page, "PointerDragTest", "Alpha\n\nBeta\n\nGamma");
		const blocks = editor.locator("p");
		await blocks.first().hover();
		const handle = page.locator(".tc-prosemirror-drag-handle:visible");
		await expect(handle).toBeVisible();
		const handleBox = await handle.boundingBox();
		const targetBox = await blocks.last().boundingBox();
		const sourceX = handleBox.x + handleBox.width / 2;
		const sourceY = handleBox.y + handleBox.height / 2;
		const targetX = targetBox.x + targetBox.width / 2;
		const targetY = targetBox.y + targetBox.height - 1;

		await page.mouse.move(sourceX, sourceY);
		await page.mouse.down();
		await page.mouse.move(sourceX + 4, sourceY + 4, { steps: 4 });
		await page.mouse.move(targetX, targetY, { steps: 20 });
		await page.mouse.up();

		await expect.poll(() => blocks.allTextContents()).toEqual(["Beta", "Gamma", "Alpha"]);
		await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("PointerDragTest"))).toBe("Beta\n\nGamma\n\nAlpha");
		await editor.press("Control+z");
		await expect.poll(() => blocks.allTextContents()).toEqual(["Alpha", "Beta", "Gamma"]);
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
		await moveToBlockStart(first);
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
		await moveToBlockStart(second);
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
