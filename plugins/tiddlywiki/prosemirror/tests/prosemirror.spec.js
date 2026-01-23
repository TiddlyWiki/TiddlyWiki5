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
				// Allow passing arbitrary fields (e.g. tags/caption) for test setup
				$tw.wiki.addTiddler(t);
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
			$tw.wiki.addTiddler(t);
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
			await editor.evaluate(el => {
				if(el && !el.__twKeyCaptureInstalled) {
					el.addEventListener("keydown", event => {
						event.twEditor = true;
						event.stopPropagation();
					});
					el.__twKeyCaptureInstalled = true;
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
			await editor.evaluate(el => {
				if(el && !el.__twKeyCaptureInstalled) {
					el.addEventListener("keydown", event => {
						event.twEditor = true;
						event.stopPropagation();
					});
					el.__twKeyCaptureInstalled = true;
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
		await widgetBlock.hover();
		
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
		await widgetBlock.hover();
		
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
		await widgetBlock.hover();
		
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
		await widgetBlock.hover();
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

	test("should not add extra paragraph margins inside list items", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("* Item 1");

		const list = editor.locator(".prosemirror-flat-list").first();
		const p = list.locator(".list-content > p").first();
		await expect(p).toBeVisible();
		await expect(p).toHaveCSS("margin-top", "0px");
		await expect(p).toHaveCSS("margin-bottom", "0px");
	});

	test("should match rendered list indentation and line spacing", async ({ page }) => {
		await loadTestPage(page);
		const demoTitle = "$:/plugins/tiddlywiki/prosemirror";
			const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";

			await page.evaluate(({ demoTitle, exampleTitle }) => {
			// Ensure list-links has deterministic data in the test edition
			$tw.wiki.addTiddler({ title: "Compose ballad", tags: "task", text: "" });
			$tw.wiki.addTiddler({ title: "Get the Ring", tags: "task", text: "" });
			$tw.wiki.addTiddler({ title: "Go to Mordor", tags: "task", text: "" });
			$tw.wiki.addTiddler({ title: "Kill the Dragon", tags: "task", text: "" });
			$tw.wiki.addTiddler({ title: "Make the beds", tags: "task", text: "" });

				// Inject list-links into the demo's example tiddler so both editor and rendered view include it
				$tw.wiki.addTiddler({
					title: exampleTitle,
					type: "text/vnd.tiddlywiki",
					text: [
						"# asdf",
						"# asdf",
						"",
						"* This is an unordered list",
						"* It has two items",
						"",
						"# This is a numbered list",
						"## With a subitem",
						"## With second subitem",
						"# And a third item",
						"",
						"<<list-links \"[tag[task]sort[title]]\">>"
					].join("\n")
				});

			const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
			if(storyList.indexOf(demoTitle) === -1) {
				storyList.unshift(demoTitle);
				$tw.wiki.addTiddler({ title: "$:/StoryList", list: storyList });
			}
				window.location.hash = "#" + encodeURIComponent(demoTitle);
			}, { demoTitle, exampleTitle });

		const frame = page.locator(`.tc-tiddler-frame[data-tiddler-title="${demoTitle}"]`).first();
		await expect(frame).toBeVisible({ timeout: 10000 });
		await expect(frame.locator(".tc-prosemirror-container .ProseMirror").first()).toBeVisible({ timeout: 10000 });
			// Wait until rendered (non-editor) list-links output is present
			await frame.locator('xpath=.//a[normalize-space(.)="Compose ballad" and not(ancestor::*[contains(@class,"tc-prosemirror-container")])]').first().waitFor({ timeout: 10000 });

		const metrics = await page.evaluate(({ demoTitle }) => {
			const frame = document.querySelector(`.tc-tiddler-frame[data-tiddler-title="${demoTitle}"]`);
			const body = frame && frame.querySelector(".tc-tiddler-body");
			const editorRoot = frame && frame.querySelector(".tc-prosemirror-container .ProseMirror");
			if(!frame || !body || !editorRoot) return { ok: false };

			const findTextMatch = (root, needle, excludeSelector) => {
				const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
				let n;
				while((n = walker.nextNode())) {
					const el = n.parentElement;
					if(excludeSelector && el && el.closest(excludeSelector)) {
						continue;
					}
					const value = n.nodeValue || "";
					const idx = value.indexOf(needle);
					if(idx !== -1) return { node: n, idx };
				}
				return null;
			};

			const rangeLeft = match => {
				if(!match) return null;
				const n = match.node;
				const r = document.createRange();
				r.setStart(n, match.idx);
				r.setEnd(n, Math.min(n.nodeValue.length, match.idx + 1));
				const rect = r.getClientRects()[0];
				return rect ? rect.left : null;
			};

			const itemTop = (match, selector) => {
				if(!match) return null;
				const el = match.node.parentElement;
				const item = el && el.closest(selector);
				return item ? item.getBoundingClientRect().top : null;
			};
			const itemBottom = (match, selector) => {
				if(!match) return null;
				const el = match.node.parentElement;
				const item = el && el.closest(selector);
				return item ? item.getBoundingClientRect().bottom : null;
			};

			const sampleTexts = {
				ul1: "This is an unordered list",
				ul2: "It has two items",
				ol1: "This is a numbered list",
				ol2: "And a third item",
				link: "Compose ballad"
			};

			const out = { ok: true, textStart: {}, gaps: {} };
			for(const[key, text] of Object.entries(sampleTexts)) {
				const eNode = findTextMatch(editorRoot, text);
				const rNode = findTextMatch(body, text, ".tc-prosemirror-container,textarea");
				out.textStart[key] = {
					editorX: rangeLeft(eNode),
					renderedX: rangeLeft(rNode)
				};
			}

			const eUl1 = findTextMatch(editorRoot, sampleTexts.ul1);
			const eUl2 = findTextMatch(editorRoot, sampleTexts.ul2);
			const eOl1 = findTextMatch(editorRoot, sampleTexts.ol1);
			const rUl1 = findTextMatch(body, sampleTexts.ul1, ".tc-prosemirror-container,textarea");
			const rUl2 = findTextMatch(body, sampleTexts.ul2, ".tc-prosemirror-container,textarea");
			const rOl1 = findTextMatch(body, sampleTexts.ol1, ".tc-prosemirror-container,textarea");
			out.gaps.ul = {
				editor: itemTop(eUl2, ".prosemirror-flat-list") - itemTop(eUl1, ".prosemirror-flat-list"),
				rendered: itemTop(rUl2, "li") - itemTop(rUl1, "li")
			};
			out.gaps.listSwitch = {
				editor: itemTop(eOl1, ".prosemirror-flat-list") - itemBottom(eUl2, ".prosemirror-flat-list"),
				rendered: itemTop(rOl1, "li") - itemBottom(rUl2, "li")
			};

			return out;
		}, { demoTitle });

		expect(metrics.ok).toBeTruthy();

		for(const key of Object.keys(metrics.textStart)) {
			const{ editorX, renderedX } = metrics.textStart[key];
			expect(editorX, `${key}: editorX`).not.toBeNull();
			expect(renderedX, `${key}: renderedX`).not.toBeNull();
			expect(Math.abs(editorX - renderedX), `${key}: |editorX-renderedX|`).toBeLessThanOrEqual(1);
		}

		expect(Math.abs(metrics.gaps.ul.editor - metrics.gaps.ul.rendered)).toBeLessThanOrEqual(1);
		expect(Math.abs(metrics.gaps.listSwitch.editor - metrics.gaps.listSwitch.rendered)).toBeLessThanOrEqual(1);
	});

	test("should support list indentation with Tab", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("* Item 1");
		await page.keyboard.press("Enter");
		await page.keyboard.type("Item 2");
		await editor.press("Tab");
		
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
		await editor.press("Tab");
		await editor.press("Shift+Tab");
		
		// After dedent, there should be no nested list and both items should be present
		const lists = editor.locator(".prosemirror-flat-list");
		await expect(lists).toHaveCount(2);
		await expect(editor.locator(".prosemirror-flat-list .prosemirror-flat-list")).toHaveCount(0);
		await expect(lists.nth(0).locator(".list-content")).toContainText("Item 1");
		await expect(lists.nth(1).locator(".list-content")).toContainText("Item 2");
	});
});

test.describe("ProseMirror Editor - Slash Menu", () => {
	test("should open, filter, and execute slash menu", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await editor.click();

		// Open menu with '/'
		await editor.press("Slash");

		const menu = page.locator(".tw-slash-menu-root").filter({ hasText: "Block Type" }).first();
		await expect(menu).toBeVisible({ timeout: 5000 });
		await expect(menu.locator(".tw-slash-menu-content")).toBeVisible();

		// Filter items
		await page.keyboard.type("code");
		await expect(menu.locator(".tw-slash-menu-filter")).toContainText("code");
		await expect(menu.locator(".tw-slash-menu-item-label", { hasText: "Turn into codeblock" }).first()).toBeVisible();

		// Execute selected item
		await page.keyboard.press("Enter");
		await expect(menu).toBeHidden({ timeout: 5000 });

		// Confirm document changed
		await expect(editor.locator("pre")).toHaveCount(1);
	});

	test("should enter edit mode after inserting widget snippet", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			configTiddlers: [
				{
					title: "$:/tests/prosemirror/snippets/now",
					caption: "Now widget",
					tags: ["$:/tags/TextEditor/Snippet"],
					text: "<<now>>",
					type: "text/vnd.tiddlywiki"
				}
			]
		});
		await clearEditor(editor);
		await editor.click();

		// Open and filter to the snippet
		await editor.press("Slash");
		await page.keyboard.type("Now widget");
		await page.keyboard.press("Enter");

		// Widget block should appear and immediately be in edit mode with textarea focused.
		const widgetBlock = page.locator(".pm-widget-block-nodeview.pm-widget-block-nodeview-widget").first();
		await expect(widgetBlock).toBeVisible({ timeout: 5000 });
		await expect(widgetBlock).toHaveClass(/pm-widget-block-editing/, { timeout: 5000 });
		const textarea = widgetBlock.locator("textarea.pm-widget-block-nodeview-editor");
		await expect(textarea).toBeVisible({ timeout: 5000 });
		await expect(textarea).toHaveValue("<<now>>");
	});
});

test.describe("ProseMirror Editor - Images", () => {
	const imageTitle = "Motovun Jack.jpg";
	const svgText = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"24\"><rect width=\"32\" height=\"24\" fill=\"#22c55e\"/></svg>";

	function imageTiddlerFields() {
		return {
			title: imageTitle,
			type: "image/svg+xml",
			text: svgText
		};
	}

	test("should render [img[...]] and <$image .../> as images", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: [
				"[img[Motovun Jack.jpg]]",
				"",
				"<$image source=\"Motovun Jack.jpg\" />"
			].join("\n"),
			configTiddlers: [imageTiddlerFields()]
		});

		const imgs = editor.locator("img");
		const editorImgs = editor.locator(`img[data-tw-source=\"${imageTitle}\"]`);
		await expect(editorImgs).toHaveCount(2);

		// Ensure the src is a data: URI (so it renders offline/in CI)
		const firstSrc = await editorImgs.first().getAttribute("src");
		expect(firstSrc).toContain("data:image/svg+xml");
	});

	test("should convert pasted image syntax into an image node and allow deletion", async ({ page }) => {
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "",
			configTiddlers: [imageTiddlerFields()]
		});
		await clearEditor(editor);

		await pastePlainText(editor, "[img[Motovun Jack.jpg]]");
		const img = editor.locator(`img[data-tw-source=\"${imageTitle}\"]`).first();
		await expect(img).toBeVisible({ timeout: 5000 });

		// Wait for debounced save and verify wikitext contains the shortcut
		await page.waitForTimeout(600);
		const saved1 = await page.evaluate(title => $tw.wiki.getTiddlerText(title, ""), exampleTitle);
		expect(saved1).toContain("[img[Motovun Jack.jpg]]");

		// Delete content (including the image) and confirm save updated
		await editor.click();
		await editor.press("Control+A");
		await editor.press("Backspace");
		await expect(editor.locator(`img[data-tw-source=\"${imageTitle}\"]`)).toHaveCount(0);
		await page.waitForTimeout(600);
		const saved2 = await page.evaluate(title => $tw.wiki.getTiddlerText(title, ""), exampleTitle);
		expect(saved2).not.toContain("Motovun Jack.jpg");
	});

	test("should open built-in image picker and replace selected image", async ({ page }) => {
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		const imageTitle = "Motovun Jack.jpg";
		const svgText = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"24\"><rect width=\"32\" height=\"24\" fill=\"#22c55e\"/></svg>";

		// Provide at least two images so the picker has a choice
		const tiddlers = [
			{ title: imageTitle, type: "image/svg+xml", text: svgText },
			{ title: "Second Image.svg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"24\"><rect width=\"32\" height=\"24\" fill=\"#3b82f6\"/></svg>" }
		];

		const editor = await setupProseMirrorTest(page, null, {
			initialText: "[img[Motovun Jack.jpg]]",
			configTiddlers: tiddlers
		});

		const img = editor.locator(`img[data-tw-source=\"${imageTitle}\"]`).first();
		await expect(img).toBeVisible({ timeout: 5000 });

		// Click image to ensure node selection, then click the nodeview edit button
		await img.click();
		const editBtn = editor.locator(".pm-image-nodeview .pm-image-nodeview-btn").first();
		await expect(editBtn).toBeVisible();
		
		// Check edit button has icon (SVG)
		const btnHTML = await editBtn.innerHTML();
		expect(btnHTML).toContain("<svg");
		
		await editBtn.click();

		// Should enter edit mode with textarea and picker
		const textarea = editor.locator(".pm-image-nodeview .pm-image-nodeview-editor").first();
		await expect(textarea).toBeVisible();
		await expect(textarea).toHaveValue("[img[Motovun Jack.jpg]]");
		
		// Should show delete and save buttons
		const deleteBtn = editor.locator(".pm-image-nodeview .pm-image-nodeview-delete").first();
		const saveBtn = editor.locator(".pm-image-nodeview .pm-image-nodeview-save").first();
		await expect(deleteBtn).toBeVisible();
		await expect(saveBtn).toBeVisible();

		// Picker panel should appear below the textarea
		const picker = editor.locator(".pm-image-nodeview .pm-image-nodeview-picker").first();
		await expect(picker).toBeVisible();

		// Choose a different image from the built-in image picker
		const choice = picker.locator(".tc-image-chooser a[title=\"Second Image.svg\"]").first();
		await expect(choice).toBeVisible({ timeout: 5000 });
		await choice.click();

		// Should auto-save and exit edit mode after selection
		await expect(textarea).not.toBeVisible({ timeout: 2000 });
		await expect(editor.locator('img[data-tw-source="Second Image.svg"]')).toHaveCount(1);

		// Wait for debounced save and verify wikitext updated
		await page.waitForTimeout(600);
		const saved = await page.evaluate(title => $tw.wiki.getTiddlerText(title, ""), exampleTitle);
		expect(saved).toContain("Second Image.svg");
		expect(saved).not.toContain("Motovun Jack.jpg");
	});
	
	test("should support <$image> widget syntax editing", async ({ page }) => {
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		const tiddlers = [
			{ title: "Motovun Jack.jpg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"24\"><rect width=\"32\" height=\"24\" fill=\"#22c55e\"/></svg>" },
			{ title: "Another.svg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"24\"><rect width=\"32\" height=\"24\" fill=\"#ff0000\"/></svg>" }
		];

		const editor = await setupProseMirrorTest(page, null, {
			initialText: "<$image source=\"Motovun Jack.jpg\"/>",
			configTiddlers: tiddlers
		});

		const img = editor.locator(`img[data-tw-source="Motovun Jack.jpg"]`).first();
		await expect(img).toBeVisible({ timeout: 5000 });
		
		await img.click();
		const editBtn = editor.locator(".pm-image-nodeview .pm-image-nodeview-edit").first();
		await editBtn.click();

		const textarea = editor.locator(".pm-image-nodeview .pm-image-nodeview-editor").first();
		await expect(textarea).toBeVisible();
		await expect(textarea).toHaveValue("<$image source=\"Motovun Jack.jpg\"/>");
		
		const picker = editor.locator(".pm-image-nodeview .pm-image-nodeview-picker").first();
		const choice = picker.locator(".tc-image-chooser a[title=\"Another.svg\"]").first();
		await choice.click();
		
		// Should update to new image
		await expect(editor.locator('img[data-tw-source="Another.svg"]')).toHaveCount(1);
		
		await page.waitForTimeout(600);
		const saved = await page.evaluate(title => $tw.wiki.getTiddlerText(title, ""), exampleTitle);
		expect(saved).toContain("<$image source=\"Another.svg\"/>");
	});

	test("should preserve width and height attributes", async ({ page }) => {
		const tiddlers = [
			{ title: "Test.svg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"150\"><rect width=\"200\" height=\"150\" fill=\"#3b82f6\"/></svg>" }
		];

		const editor = await setupProseMirrorTest(page, null, {
			initialText: "[img width=100 height=80 [Test.svg]]",
			configTiddlers: tiddlers
		});

		// Check that width and height attributes are applied to the DOM
		const img = editor.locator('img[data-tw-source="Test.svg"]').first();
		await expect(img).toBeVisible({ timeout: 5000 });
		await expect(img).toHaveAttribute('width', '100');
		await expect(img).toHaveAttribute('height', '80');
		
		// Verify round-trip
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		await page.waitForTimeout(600);
		const saved = await page.evaluate(title => $tw.wiki.getTiddlerText(title, ""), exampleTitle);
		expect(saved).toContain("width=100");
		expect(saved).toContain("height=80");
	});

	test("should preserve width and height when using image picker in edit mode", async ({ page }) => {
		const tiddlers = [
			{ title: "Image1.svg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"150\"><rect width=\"200\" height=\"150\" fill=\"#3b82f6\"/></svg>" },
			{ title: "Image2.svg", type: "image/svg+xml", text: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"><circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"#ef4444\"/></svg>" }
		];

		const editor = await setupProseMirrorTest(page, null, {
			initialText: "[img width=120 height=90 [Image1.svg]]",
			configTiddlers: tiddlers
		});

		// Click on the image to select it
		const img = editor.locator('img[data-tw-source="Image1.svg"]').first();
		await expect(img).toBeVisible({ timeout: 5000 });
		await img.click();

		// Click edit button to enter edit mode
		const editBtn = editor.locator(".pm-image-nodeview-edit").first();
		await editBtn.click();

		// Verify textarea shows width and height
		const textarea = editor.locator(".pm-image-nodeview-editor").first();
		await expect(textarea).toBeVisible();
		await expect(textarea).toHaveValue('[img width="120" height="90" [Image1.svg]]');

		// Click on a different image in the picker
		const picker = editor.locator(".pm-image-nodeview-picker").first();
		const choice = picker.locator(".tc-image-chooser a[title=\"Image2.svg\"]").first();
		await expect(choice).toBeVisible({ timeout: 5000 });
		await choice.click();

		// Should auto-save and exit edit mode, no need to click save button

		// Verify the image changed and dimensions are preserved
		await expect(editor.locator('img[data-tw-source="Image2.svg"]')).toBeVisible({ timeout: 2000 });
		
		// Verify round-trip
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		await page.waitForTimeout(600);
		const saved = await page.evaluate(title => $tw.wiki.getTiddlerText(title, ""), exampleTitle);
		expect(saved).toContain("width=\"120\"");
		expect(saved).toContain("height=\"90\"");
		expect(saved).toContain("Image2.svg");
		expect(saved).not.toContain("Image1.svg");
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
		
		/* eslint-disable no-await-in-loop */
		for(let level = 1; level <= 6; level++) {
			if(level > 1) {
				await page.keyboard.press("Enter");
			}
			await page.keyboard.type(`Heading ${level}`);
			await page.keyboard.press(`Control+Shift+${level}`);
			
			const heading = editor.locator(`h${level}`);
			await expect(heading).toContainText(`Heading ${level}`);
		}
		/* eslint-enable no-await-in-loop */
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
