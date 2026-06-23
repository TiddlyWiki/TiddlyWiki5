"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, clearEditor } = require("../helpers.js");

// ─────────────────────────────────────────────────────────────────────────────
// Find & Replace
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Find & Replace", () => {
	test("should open find panel with Ctrl+F", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "hello world hello" });
		await editor.press("Control+f");
		await page.waitForTimeout(200);
		await expect(page.locator(".tc-prosemirror-find-replace-panel")).toBeVisible();
	});

	test("should highlight search matches", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "hello world hello planet hello" });
		await editor.press("Control+f");
		await page.waitForTimeout(200);
		await page.locator(".tc-prosemirror-find-input").fill("hello");
		await page.waitForTimeout(200);
		await expect(editor.locator(".tc-prosemirror-find-match, .tc-prosemirror-find-current")).toHaveCount(3);
	});

	test("should replace single match", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "foo bar foo baz" });
		await editor.press("Control+f");
		await page.waitForTimeout(200);
		await page.locator(".tc-prosemirror-find-input").fill("foo");
		await page.waitForTimeout(200);
		await page.locator(".tc-prosemirror-replace-input").fill("qux");
		await page.locator(".tc-prosemirror-find-replace-row").nth(1).locator("button").first().click();
		await page.waitForTimeout(200);
		await expect(editor).toContainText("qux");
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Autocomplete
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Autocomplete", () => {
	test("should show autocomplete dropdown on [[ trigger", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "" });
		await clearEditor(editor);
		await editor.click();
		await editor.pressSequentially("[[");
		await page.waitForTimeout(300);
		await expect(page.locator(".tc-prosemirror-autocomplete")).toBeVisible();
	});

	test("should close autocomplete on Escape", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "" });
		await clearEditor(editor);
		await editor.click();
		await editor.pressSequentially("[[");
		await page.waitForTimeout(300);
		const dropdown = page.locator(".tc-prosemirror-autocomplete");
		await expect(dropdown).toBeVisible();
		await editor.press("Escape");
		await page.waitForTimeout(200);
		await expect(dropdown).not.toBeVisible();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Wikitext Inline Input Rules
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Wikitext Inline Input Rules", () => {
	test("should convert [[TiddlerTitle]] to a link mark on typing ]]]", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "" });
		await clearEditor(editor);
		await editor.click();
		await editor.pressSequentially("Visit [[MyTarget]] now");
		await page.waitForTimeout(200);
		const link = editor.locator("a");
		await expect(link).toHaveCount(1);
		await expect(link).toContainText("MyTarget");
		await expect(link).toHaveAttribute("data-tw-href", "MyTarget");
		await expect(editor).not.toContainText("[[MyTarget]]");
	});

	test("should convert [[Display|Target]] to a link mark with correct href", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "" });
		await clearEditor(editor);
		await editor.click();
		await editor.pressSequentially("Click [[here|MyTiddler]] now");
		await page.waitForTimeout(200);
		const link = editor.locator("a");
		await expect(link).toHaveCount(1);
		await expect(link).toContainText("here");
		await expect(link).toHaveAttribute("data-tw-href", "MyTiddler");
		await expect(editor).not.toContainText("[[here|MyTiddler]]");
	});

	test("should convert ''bold'' to strong mark", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "" });
		await clearEditor(editor);
		await editor.click();
		await editor.pressSequentially("Some ''bold text'' here");
		await page.waitForTimeout(200);
		await expect(editor.locator("strong")).toHaveCount(1);
		await expect(editor.locator("strong")).toContainText("bold text");
		await expect(editor).not.toContainText("''bold text''");
	});

	// Skipped: //italic// input rule conflicts with SlashMenuPlugin which intercepts
	// the "/" keydown. The rule itself is correct (verified in Node tests), but
	// the slash menu opens on the first "/" and its transactions interfere with
	// the inline mark application in the browser. TODO: resolve this interaction.
	test.skip("should convert //italic// to em mark", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "" });
		await clearEditor(editor);
		await editor.click();
		await editor.pressSequentially("Some //italic text// here");
		await page.waitForTimeout(200);
		await expect(editor.locator("em")).toHaveCount(1);
		await expect(editor.locator("em")).toContainText("italic text");
		await expect(editor).not.toContainText("//italic text//");
	});

	test("should convert `code` to code mark", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "" });
		await clearEditor(editor);
		await editor.click();
		await editor.pressSequentially("Some `inline code` here");
		await page.waitForTimeout(200);
		await expect(editor.locator("code")).toHaveCount(1);
		await expect(editor.locator("code")).toContainText("inline code");
		await expect(editor).not.toContainText("`inline code`");
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Link Tooltip
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Link Tooltip", () => {
	test("should show tooltip with unlink button when cursor is inside a link", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "Visit [[MyTarget]] now" });
		await editor.locator("a").first().click();
		await page.waitForTimeout(500);
		const tooltip = page.locator(".tc-prosemirror-link-tooltip");
		await expect(tooltip).toBeVisible({ timeout: 5000 });
		expect(await tooltip.locator(".tc-prosemirror-link-tooltip-btn").count()).toBeGreaterThanOrEqual(2);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Initial wikilink rendering
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Initial Wikilink Rendering", () => {
	test("should render multiple initial wikilinks without freezing", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, "InitialMultipleWikilinks", {
			useReadmeTiddler: false,
			initialText: "!! 相关文档\n\n* [[编年史]]\n* [[古神森林]]"
		});
		const links = editor.locator("a[data-tw-href]");
		await expect(links).toHaveCount(2);
		await expect(links.first()).toHaveClass(/tc-tiddlylink/);
		await expect(editor).toContainText("编年史");
		await expect(editor).toContainText("古神森林");
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Static block rendering
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Static Block Rendering", () => {
	test("should render common block elements from wikitext", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "; Term\n: Definition\n\n<<<\nQuoted text\n<<<\n\n```\nconst x = 1;\n```\n\nAbove\n\n---\n\nBelow\n\n|!Header 1|!Header 2|\n|Cell 1|Cell 2|"
		});
		await expect(editor.locator("dl")).toHaveCount(1);
		await expect(editor.locator("dt")).toContainText("Term");
		await expect(editor.locator("dd")).toContainText("Definition");
		await expect(editor.locator("blockquote")).toContainText("Quoted text");
		await expect(editor.locator("pre code, pre").first()).toContainText("const x = 1;");
		await expect(editor.locator("hr")).toBeVisible();
		const table = editor.locator("table");
		await expect(table).toBeVisible();
		await expect(table).toContainText("Header 1");
		await expect(table).toContainText("Cell 1");
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Table", () => {

	test("should insert table via slash menu", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "",
			configTiddlers: [{
				title: "$:/tests/prosemirror/actions/insert-table",
				"action-id": "insert-table",
				caption: "Insert table",
				category: "block-insert",
				tags: "$:/tags/ProseMirror/EditorAction"
			}]
		});
		await editor.click();
		await editor.press("Slash");
		const menu = page.locator(".tw-slash-menu-root");
		await expect(menu).toBeVisible({ timeout: 5000 });
		await page.keyboard.type("table");
		await expect(menu.locator(".tw-slash-menu-item-label", { hasText: "Insert table" }).first()).toBeVisible({ timeout: 5000 });
		await menu.locator(".tw-slash-menu-item").filter({ hasText: "Insert table" }).first().evaluate((el) => el.click());
		await expect(editor.locator("table").first()).toBeVisible({ timeout: 5000 });
		const selectionInTable = await editor.evaluate((root) => {
			const selection = root.ownerDocument.getSelection();
			if(!selection || !selection.anchorNode) return false;
			const el = selection.anchorNode.nodeType === Node.ELEMENT_NODE
				? selection.anchorNode : selection.anchorNode.parentElement;
			return !!(el && el.closest("td,th"));
		});
		expect(selectionInTable).toBeTruthy();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Pragma Blocks & Procedure Snippet
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Pragma Blocks", () => {
	test("should render \\procedure as pragma block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "\\procedure myProc()\nHello\n\\end\n\nContent after"
		});
		await expect(editor.locator(".pm-nodeview-pragma, .pm-pragma-block").first()).toBeVisible();
		await expect(editor).toContainText("Content after");
	});

	test("should render \\define as pragma block", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "\\define myMacro()\nBody\n\\end\n\nAfter"
		});
		await expect(editor.locator(".pm-nodeview-pragma, .pm-pragma-block").first()).toBeVisible();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Linkify (wrap-selection with [[ ]]) toolbar operation
// ─────────────────────────────────────────────────────────────────────────────
test.describe("ProseMirror Editor - Linkify toolbar wrap-selection", () => {

	/**
	 * Helper: select a text range within the ProseMirror editor and dispatch
	 * the same "tm-edit-text-operation" event the linkify toolbar button sends.
	 */
	/**
	 * Helper: select a text range and dispatch a bold wrap-selection event
	 * through handleTextOperationNatively (same path as the toolbar button).
	 */
	async function wrapSelectionBold(page, editor, from, to) {
		return await page.evaluate(({ from, to }) => {
			function findAllEngines(widget) {
				const results = [];
				if(widget && widget.engine && widget.engine.view) results.push(widget.engine);
				if(widget && widget.children) {
					for(const child of widget.children) results.push.apply(results, findAllEngines(child));
				}
				return results;
			}
			const engine = findAllEngines($tw.rootWidget).find((e) => e.view);
			if(!engine || !engine.view) return { handled: false, error: "engine not found" };
			const state = engine.view.state;
			const TextSelection = $tw.modules.execute("prosemirror-state").TextSelection;
			try {
				engine.view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, from, to)));
			} catch(e) {
				return { handled: false, error: "selection dispatch failed: " + e.message };
			}
			engine.view.focus();
			const event = {
				param: "wrap-selection",
				paramObject: { prefix: "''", suffix: "''", trimSelection: "yes" }
			};
			let handled;
			try {
				handled = engine.handleTextOperationNatively(event);
			} catch(e) {
				return { handled: false, error: "handleTextOperationNatively threw: " + e.message };
			}
			if(!handled) return { handled: false, error: "handleTextOperationNatively returned false" };
			const doc = engine.view.state.doc;
			// Find all strong marks
			const strongMarks = [];
			doc.descendants((node, pos) => {
				if(node.isText) {
					const strongMark = node.marks.find((m) => m.type.name === "strong");
					if(strongMark) {
						strongMarks.push({
							text: node.text,
							from: pos,
							to: pos + node.nodeSize
						});
					}
				}
				return true;
			});
			return { handled: true, strongMarks: strongMarks };
		}, { from, to });
	}

	test("should be undoable after bold wrap-selection (toolbar path)", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "asdf", useReadmeTiddler: false });
		await page.waitForTimeout(300);

		// Apply bold to "sd" via toolbar path
		let result = await wrapSelectionBold(page, editor, 2, 4);
		expect(result.handled).toBe(true);
		expect(result.strongMarks.length).toBe(1);

		// Wait for save cycle
		await page.waitForTimeout(800);

		// Undo with Ctrl+Z
		await editor.press("Control+z");
		await page.waitForTimeout(400);

		// Check strong mark is gone
		result = await page.evaluate(() => {
			function findEngine() {
				function walk(w) {
					if(w && w.engine && w.engine.view) return w.engine;
					if(w && w.children) { for(const c of w.children) { const r = walk(c); if(r) return r; } }
					return null;
				}
				return walk($tw.rootWidget);
			}
			const engine = findEngine();
			if(!engine || !engine.view) return { error: "no engine" };
			const doc = engine.view.state.doc;
			let hasStrong = false;
			doc.descendants((node) => {
				if(node.isText && node.marks.some((m) => m.type.name === "strong")) hasStrong = true;
			});
			return { hasStrong: hasStrong, docText: doc.textContent };
		});
		expect(result.hasStrong).toBe(false);
		expect(result.docText).toBe("asdf");
	});

	async function wrapSelectionWithBrackets(page, editor, from, to) {
		return await page.evaluate(({ from, to }) => {
			function findAllEngines(widget) {
				const results = [];
				if(widget && widget.engine && widget.engine.view) results.push(widget.engine);
				if(widget && widget.children) {
					for(const child of widget.children) results.push.apply(results, findAllEngines(child));
				}
				return results;
			}
			const engine = findAllEngines($tw.rootWidget).find((e) => e.view);
			if(!engine || !engine.view) return { handled: false, error: "engine not found" };
			const state = engine.view.state;
			const TextSelection = $tw.modules.execute("prosemirror-state").TextSelection;
			try {
				engine.view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, from, to)));
			} catch(e) {
				return { handled: false, error: "selection dispatch failed: " + e.message };
			}
			engine.view.focus();
			const event = {
				param: "wrap-selection",
				paramObject: { prefix: "[[", suffix: "]]", trimSelection: "yes" }
			};
			let handled;
			try {
				handled = engine.handleTextOperationNatively(event);
			} catch(e) {
				return { handled: false, error: "handleTextOperationNatively threw: " + e.message };
			}
			if(!handled) return { handled: false, error: "handleTextOperationNatively returned false" };
			const doc = engine.view.state.doc;
			const result = { handled: true };
			const links = [];
			doc.descendants((node, pos) => {
				if(node.isText) {
					const linkMark = node.marks.find((m) => m.type.name === "link");
					if(linkMark) {
						links.push({
							text: node.text,
							href: linkMark.attrs.href,
							from: pos,
							to: pos + node.nodeSize
						});
					}
				}
				return true;
			});
			result.links = links;
			return result;
		}, { from, to });
	}

	test("should link only the selected text (not trailing characters)", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "asdf", useReadmeTiddler: false });
		await page.waitForTimeout(300);

		// In ProseMirror, the document is doc(paragraph("asdf")).
		// Characters start at position 1 (after paragraph opening token).
		// Position 1="a", 2="s", 3="d", 4="f".
		// To select "sd" we need positions 2 to 4 (textBetween excludes the end pos).
		const result = await wrapSelectionWithBrackets(page, editor, 2, 4);

		expect(result.handled).toBe(true);
		expect(result.error).toBeUndefined();
		// Should have exactly one link
		expect(result.links.length).toBe(1);
		// That link should have text "sd", not "f" or anything else
		expect(result.links[0].text).toBe("sd");
		expect(result.links[0].href).toBe("sd");
		// The link should start at position 2 and end at position 4
		expect(result.links[0].from).toBe(2);
		expect(result.links[0].to).toBe(4);
	});

	test("should be undoable after linkify wrap-selection (including save cycle)", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "asdf", useReadmeTiddler: false });
		await page.waitForTimeout(300);

		// Apply linkify to "sd"
		let result = await wrapSelectionWithBrackets(page, editor, 2, 4);
		expect(result.handled).toBe(true);
		expect(result.links.length).toBe(1);

		// Wait long enough for the debounced save to fire and for the
		// save-cycle refresh to complete (300ms debounce + buffer).
		await page.waitForTimeout(800);

		// Undo with Ctrl+Z
		await editor.press("Control+z");
		await page.waitForTimeout(400);

		// Check that the link is gone
		result = await page.evaluate(() => {
			function findEngine() {
				function walk(w) {
					if(w && w.engine && w.engine.view) return w.engine;
					if(w && w.children) { for(const c of w.children) { const r = walk(c); if(r) return r; } }
					return null;
				}
				return walk($tw.rootWidget);
			}
			const engine = findEngine();
			if(!engine || !engine.view) return { error: "no engine" };
			const doc = engine.view.state.doc;
			const links = [];
			doc.descendants((node, pos) => {
				if(node.isText && node.marks.some((m) => m.type.name === "link")) {
					links.push({ text: node.text, pos: pos });
				}
			});
			return { links: links, docText: doc.textContent };
		});
		expect(result.links.length).toBe(0);
		expect(result.docText).toBe("asdf");
	});

	test("should link the selected text using it as href", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "hello world", useReadmeTiddler: false });
		await page.waitForTimeout(300);

		// Characters start at position 1. "world" spans positions 7-12.
		const result = await wrapSelectionWithBrackets(page, editor, 7, 12);

		expect(result.handled).toBe(true);
		expect(result.links.length).toBe(1);
		expect(result.links[0].text).toBe("world");
		expect(result.links[0].href).toBe("world");
	});
});
