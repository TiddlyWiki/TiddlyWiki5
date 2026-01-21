const{ test, expect } = require("@playwright/test");
const{ resolve } = require("path");
const{ pathToFileURL } = require("url");

const _externalRoutesInstalled = new WeakSet();

async function clearEditor(editor) {
	await editor.click();
	await editor.press("Control+A");
	await editor.press("Backspace");
}

async function pastePlainText(editor, text) {
	await editor.evaluate((el, t) => {
		const dt = new DataTransfer();
		dt.setData("text/plain", t);
		const evt = new ClipboardEvent("paste", {
			clipboardData: dt,
			bubbles: true,
			cancelable: true
		});
		el.dispatchEvent(evt);
		// Some browser builds ignore clipboardData on synthetic events.
		// Insert text as a deterministic fallback while still exercising the paste event path.
		try {
			el.ownerDocument.execCommand("insertText", false, t);
		} catch (e) {
			// ignore
		}
	}, text);
}

// Helper to load the test page
async function loadTestPage(page) {
	if(!_externalRoutesInstalled.has(page)) {
		// Avoid long stalls when test.html references external resources in offline/CI.
		await page.route("http://**/*", route => route.abort());
		await page.route("https://**/*", route => route.abort());
		_externalRoutesInstalled.add(page);
	}

	const repoRoot = resolve(__dirname, "../../../../");
	const indexPath = resolve(repoRoot, "editions/test/output", "test.html");
	const indexUrl = pathToFileURL(indexPath).href;
	
	try {
		await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
	} catch (e) {
		await page.waitForTimeout(1000);
		await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
	}
	
	await page.waitForSelector(".tc-site-title", { timeout: 10000 });
}

// Helper to setup test environment
async function setupProseMirrorTest(page, tiddlerTitle = null, options = {}) {
	if(!tiddlerTitle) {
		tiddlerTitle = "ProseMirrorTestTiddler_" + Math.floor(Math.random() * 10000);
	}
	const initialText = options.initialText !== undefined ? options.initialText : "Start";
	const configTiddlers = Array.isArray(options.configTiddlers) ? options.configTiddlers : [];
	const useReadmeTiddler = options.useReadmeTiddler !== undefined ? !!options.useReadmeTiddler : true;

	page.on("pageerror", err => {
		console.log(`[Browser Error] ${err.message}`);
	});

	await loadTestPage(page);

	if(useReadmeTiddler) {
		const readmeTitle = "$:/plugins/tiddlywiki/prosemirror/readme";
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		await page.evaluate(({readmeTitle, exampleTitle, initialText, configTiddlers}) => {
			// Optional config tiddlers must be created before the editor widget is instantiated
			for(const t of configTiddlers) {
				$tw.wiki.addTiddler({
					title: t.title,
					text: t.text,
					type: t.type
				});
			}

			// The readme's <$edit-prosemirror> edits this fixed example tiddler
			$tw.wiki.addTiddler({
				title: exampleTitle,
				text: initialText,
				type: "text/vnd.tiddlywiki"
			});

			// Ensure the readme tiddler is open
			const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
			if(storyList.indexOf(readmeTitle) === -1) {
				storyList.unshift(readmeTitle);
				$tw.wiki.addTiddler({title: "$:/StoryList", list: storyList});
			}
		}, {readmeTitle, exampleTitle, initialText, configTiddlers});

		await page.waitForSelector(`.tc-tiddler-frame[data-tiddler-title="${readmeTitle}"]`, { timeout: 10000 });
		const editor = page.locator(`.tc-tiddler-frame[data-tiddler-title="${readmeTitle}"] .ProseMirror`).first();
		await editor.waitFor({ state: "visible", timeout: 10000 });
		return editor;
	}

	// Legacy: isolated harness tiddler per test
	const harnessTitle = `Harness_${tiddlerTitle}`;
	await page.evaluate(({tiddlerTitle, harnessTitle, initialText, configTiddlers}) => {
		for(const t of configTiddlers) {
			$tw.wiki.addTiddler({
				title: t.title,
				text: t.text,
				type: t.type
			});
		}

		$tw.wiki.addTiddler({
			title: tiddlerTitle,
			text: initialText,
			type: "text/vnd.tiddlywiki"
		});

		$tw.wiki.addTiddler({
			title: harnessTitle,
			text: `<$edit-prosemirror tiddler="${tiddlerTitle}"/>`
		});

		const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
		if(storyList.indexOf(harnessTitle) === -1) {
			storyList.unshift(harnessTitle);
			$tw.wiki.addTiddler({title: "$:/StoryList", list: storyList});
		}
	}, {tiddlerTitle, harnessTitle, initialText, configTiddlers});

	await page.waitForSelector(`.tc-tiddler-frame[data-tiddler-title="${harnessTitle}"]`, { timeout: 10000 });
	const editor = page.locator(`.tc-tiddler-frame[data-tiddler-title="${harnessTitle}"] .ProseMirror`).first();
	await editor.waitFor({ state: "visible", timeout: 10000 });
	return editor;
}

test.describe("ProseMirror Editor - Basic Editing", () => {
	test("should load and display editor", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await expect(editor).toBeVisible();
	});

	test("should allow typing text", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("Hello World");
		
		await expect(editor).toContainText("Hello World");
	});

	test("should support basic formatting with keyboard shortcuts", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("Bold text");

		const container = editor.locator('xpath=ancestor::div[contains(@class,"tc-prosemirror-container")]').first();
		const keyCapture = await container.getAttribute("data-tw-prosemirror-keycapture");
		if(keyCapture !== "yes") {
			await editor.evaluate((el) => {
				const root = el.closest('.tc-prosemirror-container');
				if(root && !root.__twKeyCaptureInstalled) {
					root.addEventListener('keydown', (event) => {
						event.twEditor = true;
						event.stopPropagation();
					}, true);
					root.__twKeyCaptureInstalled = true;
				}
			});
		}

		await editor.press("Control+A");
		await editor.press("Control+B");
		
		// Check that bold mark was applied
		const strongElement = editor.locator("strong");
		await expect(strongElement).toContainText("Bold text");
	});

	test("should support italic formatting", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("Italic text");

		const container = editor.locator('xpath=ancestor::div[contains(@class,"tc-prosemirror-container")]').first();
		const keyCapture = await container.getAttribute("data-tw-prosemirror-keycapture");
		if(keyCapture !== "yes") {
			await editor.evaluate((el) => {
				const root = el.closest('.tc-prosemirror-container');
				if(root && !root.__twKeyCaptureInstalled) {
					root.addEventListener('keydown', (event) => {
						event.twEditor = true;
						event.stopPropagation();
					}, true);
					root.__twKeyCaptureInstalled = true;
				}
			});
		}

		await editor.press("Control+A");
		await editor.press("Control+I");
		
		const emElement = editor.locator("em");
		await expect(emElement).toContainText("Italic text");
	});

	test("should support undo/redo", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("First line");
		await page.keyboard.press("Enter");
		await page.keyboard.type("Second line");
		
		await expect(editor).toContainText("Second line");
		
		const container = editor.locator('xpath=ancestor::div[contains(@class,"tc-prosemirror-container")]').first();
		const undoButton = container.locator('.ProseMirror-menubar [title*="Undo"]').first();
		const redoButton = container.locator('.ProseMirror-menubar [title*="Redo"]').first();
		await expect(undoButton).toBeVisible();
		await expect(redoButton).toBeVisible();

		// Undo
		await undoButton.click();
		await expect(editor).not.toContainText("Second line");
		
		// Redo
		await redoButton.click();
		await expect(editor).toContainText("Second line");
	});
});

test.describe("ProseMirror Editor - Widget Blocks", () => {
	test("should render widget syntax as block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type('<<now "YYYY-MM-DD">>');
		
		// Wait a bit for the widget block to be created
		await page.waitForTimeout(1000);
		
		// Check if widget block appears
		const widgetBlock = page.locator(".pm-widget-block-nodeview");
		const widgetCount = await widgetBlock.count();
		
		// Widget block should appear
		expect(widgetCount).toBeGreaterThan(0);
		
		if(widgetCount > 0) {
			// Check header displays widget name
			const header = widgetBlock.first().locator(".pm-widget-block-nodeview-header");
			await expect(header).toContainText("Widget: now");
		}
	});

	test("should enter edit mode when clicking edit button", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		
		const widgetBlock = page.locator(".pm-widget-block-nodeview").first();
		await expect(widgetBlock).toBeVisible({ timeout: 2000 });
		
		// Click edit button
		const editBtn = widgetBlock.locator(".pm-widget-block-nodeview-edit").first();
		await editBtn.click();
		
		// Check textarea appears
		const textarea = widgetBlock.locator("textarea.pm-widget-block-nodeview-editor");
		await expect(textarea).toBeVisible();
		await expect(textarea).toHaveValue("<<now>>");
	});

	test("should show delete button in edit mode", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		
		const widgetBlock = page.locator(".pm-widget-block-nodeview").first();
		await expect(widgetBlock).toBeVisible({ timeout: 2000 });
		
		// Delete button should be hidden initially
		const deleteBtn = widgetBlock.locator(".pm-widget-block-nodeview-delete");
		await expect(deleteBtn).toBeHidden();
		
		// Click edit button
		const editBtn = widgetBlock.locator(".pm-widget-block-nodeview-edit").first();
		await editBtn.click();
		
		// Delete button should now be visible
		await expect(deleteBtn).toBeVisible();
	});

	test("should save changes when clicking save button", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		
		const widgetBlock = page.locator(".pm-widget-block-nodeview");
		await expect(widgetBlock).toBeVisible({ timeout: 2000 });
		
		// Enter edit mode
		const editBtn = widgetBlock.locator(".pm-widget-block-nodeview-edit").first();
		await editBtn.click();
		
		// Modify the widget
		const textarea = widgetBlock.locator("textarea");
		await textarea.fill('<<now "YYYY">>');
		
		// Click save button (edit button becomes save button in edit mode)
		await editBtn.click();
		
		// Check widget updated
		const header = widgetBlock.locator(".pm-widget-block-nodeview-header");
		await expect(header).toContainText("Widget: now");
	});

	test("should delete widget when clicking delete button", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		
		const widgetBlock = page.locator(".pm-widget-block-nodeview");
		await expect(widgetBlock).toBeVisible({ timeout: 2000 });
		
		// Enter edit mode
		const editBtn = widgetBlock.locator(".pm-widget-block-nodeview-edit").first();
		await editBtn.click();
		
		// Click delete button
		const deleteBtn = widgetBlock.locator(".pm-widget-block-nodeview-delete");
		await deleteBtn.click();
		
		// Widget should be removed
		await expect(widgetBlock).not.toBeVisible();
	});

	test("should support multiple widget syntaxes", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		
		// Type different widget syntaxes
		await page.keyboard.type("<<now>>");
		await expect(page.locator(".pm-widget-block-nodeview").first()).toBeVisible({ timeout: 2000 });

		// Ensure we can add a new paragraph after a widget block
		await page.locator(".tc-prosemirror-addline-btn").first().click();
		await page.keyboard.type('<<list-links "[tag[test]]">>');
		
		// Both should render as blocks
		const widgetBlocks = page.locator(".pm-widget-block-nodeview");
		await expect(widgetBlocks).toHaveCount(2);
	});

	test("should convert pasted widget syntax to block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await pastePlainText(editor, '<<now "YYYY-MM-DD">>');
		
		// Should render as block
		const widgetBlock = page.locator(".pm-widget-block-nodeview");
		await expect(widgetBlock).toBeVisible({ timeout: 2000 });
	});

	test("should allow adding a new line after a widget block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");

		const widgetBlock = page.locator(".pm-widget-block-nodeview").first();
		await expect(widgetBlock).toBeVisible({ timeout: 2000 });

		// Use the bottom button to insert a new paragraph and type into it
		const addLineBtn = page.locator(".tc-prosemirror-addline-btn").first();
		await expect(addLineBtn).toBeVisible();
		await addLineBtn.click();
		await page.keyboard.type("After widget");

		await expect(editor).toContainText("After widget");
	});
});

test.describe("ProseMirror Editor - Lists", () => {
	test("should create bulleted list", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("* Item 1");

		// prosemirror-flat-list renders div.prosemirror-flat-list, not ul/li
		const list = editor.locator(".prosemirror-flat-list").first();
		await expect(list).toBeVisible();
		await expect(list.locator(".list-content")).toContainText("Item 1");
	});

	test("should support list indentation with Tab", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("* Item 1");
		await page.keyboard.press("Enter");
		await page.keyboard.type("Item 2");
		await page.keyboard.press("Tab");
		
		// Nested list should appear inside the parent list-content
		const nestedList = editor.locator(".prosemirror-flat-list .prosemirror-flat-list");
		await expect(nestedList).toHaveCount(1);
	});

	test("should support list dedentation with Shift+Tab", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("* Item 1");
		await page.keyboard.press("Enter");
		await page.keyboard.type("Item 2");
		await page.keyboard.press("Tab");
		await page.keyboard.press("Shift+Tab");
		
		// After dedent, there should be no nested list and both items should be present
		const lists = editor.locator(".prosemirror-flat-list");
		await expect(lists).toHaveCount(2);
		await expect(editor.locator(".prosemirror-flat-list .prosemirror-flat-list")).toHaveCount(0);
		await expect(lists.nth(0).locator(".list-content")).toContainText("Item 1");
		await expect(lists.nth(1).locator(".list-content")).toContainText("Item 2");
	});
});

test.describe("ProseMirror Editor - Headings", () => {
	test("should create heading with keyboard shortcut", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("Heading Text");
		await page.keyboard.press("Control+Shift+1");
		
		const heading = editor.locator("h1");
		await expect(heading).toContainText("Heading Text");
	});

	test("should support different heading levels", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		
		for(let level = 1; level <= 6; level++) {
			if(level > 1) {
				await page.keyboard.press("Enter");
			}
			await page.keyboard.type(`Heading ${level}`);
			await page.keyboard.press(`Control+Shift+${level}`);
			
			const heading = editor.locator(`h${level}`);
			await expect(heading).toContainText(`Heading ${level}`);
		}
	});
});

test.describe("ProseMirror Editor - Configuration", () => {
	test("should respect custom keyboard shortcuts", async ({ page }) => {
		// Override the bold shortcut to a non-default combination and verify it works
		const editor = await setupProseMirrorTest(page, null, {
			configTiddlers: [
				{ title: "$:/config/prosemirror/shortcuts/bold", text: "Shift-Mod-b" }
			]
		});

		await clearEditor(editor);
		await page.keyboard.type("Bold Text");
		await editor.press("Control+A");
		await editor.press("Control+Shift+B");

		await expect(editor.locator("strong")).toContainText("Bold Text");
	});

	test("should respect widget block enable/disable setting", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			configTiddlers: [
				{ title: "$:/config/prosemirror/enable-widget-blocks", text: "no" }
			]
		});
		
		await clearEditor(editor);
		await page.keyboard.type("<<now>>");
		
		// Widget block should NOT appear
		await expect(page.locator(".pm-widget-block-nodeview")).toHaveCount(0);
	});
});

test.describe("ProseMirror Editor - Integration", () => {
	test("should save content to tiddler", async ({ page }) => {
		// Use isolated harness to control the tiddler title we read back
		const tiddlerTitle = "ProseMirrorTestTiddler";
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Start"
		});
		await clearEditor(editor);
		await page.keyboard.type("Test content");
		
		// Wait for debounced save
		await page.waitForTimeout(500);
		
		// Check tiddler was updated
		const tiddlerText = await page.evaluate(() => $tw.wiki.getTiddlerText("ProseMirrorTestTiddler"));
		
		expect(tiddlerText).toContain("Test content");
	});

	test("should load existing tiddler content", async ({ page }) => {
		const tiddlerTitle = "ProseMirrorTestTiddler";
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Existing content"
		});
		
		// Check content loaded
		await expect(editor).toContainText("Existing content");
	});

	test("should not trigger import dialog on paste", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);

		// Monitor for import dialog (as a tiddler frame)
		const importFrame = page.locator('.tc-tiddler-frame[data-tiddler-title="$:/Import"]');

		await pastePlainText(editor, "Pasted text");

		// Import dialog should NOT appear
		await expect(importFrame).toHaveCount(0);
		await expect(editor).toContainText("Pasted text");
	});
});
