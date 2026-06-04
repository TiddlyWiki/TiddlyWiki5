/*\
title: incremental-sync.spec.js
E2E tests for the incremental diff-based text synchronization.
Verifies that empty paragraphs survive save cycles, external changes
are applied incrementally, and toolbar operations don't destroy content.
\*/

"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, clearEditor, dispatchEditorShortcut, selectAllEditorContent, loadTestPage } = require("../helpers.js");

// Helper: get engine instance for a ProseMirror editor
function getEngine(editor) {
	return editor.evaluate((el) => {
		const viewEl = el.closest(".ProseMirror") || el;
		function findAllEngines(widget) {
			const results = [];
			if(widget && widget.engine && widget.engine.view) results.push(widget.engine);
			if(widget && widget.children) {
				for(const child of widget.children) results.push.apply(results, findAllEngines(child));
			}
			return results;
		}
		const engine = findAllEngines($tw.rootWidget).find((e) => e.view && e.view.dom === viewEl);
		if(!engine || !engine.view) return null;
		return {
			hasApplyExternalText: typeof engine.applyExternalText === "function",
			hasLastSavedDocJSON: engine.lastSavedDocJSON !== undefined,
			hasPendingSavedText: engine.pendingSavedText !== undefined
		};
	});
}

// Helper: wait for debounced save to complete
async function waitForSave(ms = 500) {
	await new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

// Helper: get tiddler text from wiki store
function getTiddlerText(page, title) {
	return page.evaluate((t) => $tw.wiki.getTiddlerText(t, ""), title);
}

// Helper: modify tiddler externally (simulating Agent change)
function modifyTiddlerExternally(page, title, newText) {
	return page.evaluate(({ t, text }) => {
		$tw.wiki.setText(t, "text", undefined, text);
	}, { t: title, text: newText });
}

// Helper: render the standalone <$prosemirror> widget path
async function setupStandaloneProseMirrorTest(page, tiddlerTitle, initialText) {
	const harnessTitle = `StandaloneHarness_${tiddlerTitle}`;
	await loadTestPage(page);
	await page.evaluate(({ tiddlerTitle, harnessTitle, initialText }) => {
		$tw.wiki.addTiddler({ title: tiddlerTitle, text: initialText, type: "text/vnd.tiddlywiki" });
		$tw.wiki.addTiddler({ title: harnessTitle, text: `<$prosemirror tiddler="${tiddlerTitle}"/>` });
		const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
		if(storyList.indexOf(harnessTitle) === -1) {
			storyList.unshift(harnessTitle);
			$tw.wiki.addTiddler({ title: "$:/StoryList", list: storyList });
		}
	}, { tiddlerTitle, harnessTitle, initialText });

	await page.waitForSelector(`.tc-tiddler-frame[data-tiddler-title="${harnessTitle}"]`, { timeout: 10000 });
	const editor = page.locator(`.tc-tiddler-frame[data-tiddler-title="${harnessTitle}"] .ProseMirror`).first();
	await editor.waitFor({ state: "visible", timeout: 10000 });
	return editor;
}

// Helper: dispatch a docChanged transaction whose serialized wiki text is unchanged
function dispatchNoopDocChange(editor) {
	return editor.evaluate((el) => {
		const viewEl = el.closest(".ProseMirror") || el;
		function findAllEngines(widget) {
			const results = [];
			if(widget && widget.engine && widget.engine.view) results.push(widget.engine);
			if(widget && widget.children) {
				for(const child of widget.children) results.push.apply(results, findAllEngines(child));
			}
			return results;
		}
		const engine = findAllEngines($tw.rootWidget).find((e) => e.view && e.view.dom === viewEl);
		if(!engine || !engine.view) throw new Error("ProseMirror engine not found");
		const state = engine.view.state;
		engine.view.dispatch(state.tr.insertText("x", 1).delete(1, 2));
		return engine.getText();
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty Paragraph Preservation
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Incremental Sync — Empty Paragraph Preservation", () => {

	test("should preserve empty paragraphs after Enter + save cycle", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "Hello World"
		});

		// Focus editor and place cursor at end
		await editor.click();
		await page.keyboard.press("End");
		await page.keyboard.press("Enter");
		await page.keyboard.press("Enter");

		// Wait for debounced save
		await waitForSave(500);

		// Verify empty paragraphs still exist in editor
		const text = await editor.evaluate((el) => el.closest(".ProseMirror").textContent);
		// After two Enters, there should be "Hello World" + two empty lines
		expect(text).toContain("Hello World");

		// Verify the editor DOM has multiple block elements
		const blockCount = await editor.evaluate((el) => {
			const viewEl = el.closest(".ProseMirror");
			return viewEl.children.length;
		});
		expect(blockCount).toBeGreaterThanOrEqual(3); // "Hello World" + 2 empty
	});

	test("should save empty paragraphs as blankline wikitext blocks", async ({ page }) => {
		const tiddlerTitle = "PersistedBlankLines_" + Date.now();
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Hello World"
		});

		await editor.click();
		await page.keyboard.press("End");
		await page.keyboard.press("Enter");
		await page.keyboard.press("Enter");
		await waitForSave(500);

		const savedInfo = await page.evaluate((title) => {
			const text = $tw.wiki.getTiddlerText(title, "");
			const tree = $tw.wiki.parseText("text/vnd.tiddlywiki", text, { preserveBlankLines: true }).tree;
			return {
				text: text,
				rules: tree.map((node) => node.rule)
			};
		}, tiddlerTitle);

		expect(savedInfo.text).toBe("Hello World\n\n\n\n");
		expect(savedInfo.rules).toEqual(["parseblock", "blankline", "blankline"]);
	});

	test("should preserve empty paragraphs after toolbar bold operation", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "Hello World"
		});

		await editor.click();
		// Move to end and add empty paragraphs
		await page.keyboard.press("End");
		await page.keyboard.press("Enter");
		await page.keyboard.press("Enter");
		await waitForSave(300);

		// Select all and bold using dispatchEditorShortcut (works cross-browser)
		const selectedAll = await selectAllEditorContent(editor);
		expect(selectedAll).toBeTruthy();
		const handled = await dispatchEditorShortcut(editor, "b", "KeyB", { ctrlKey: true });
		expect(handled).toBeTruthy();
		await waitForSave(500);

		// Verify empty paragraphs still exist
		const blockCount = await editor.evaluate((el) => {
			const viewEl = el.closest(".ProseMirror");
			return viewEl.children.length;
		});
		expect(blockCount).toBeGreaterThanOrEqual(3);

		// Verify bold was applied
		const hasBold = await editor.evaluate((el) => {
			const viewEl = el.closest(".ProseMirror");
			return !!viewEl.querySelector("strong");
		});
		expect(hasBold).toBeTruthy();
	});

	test("should preserve empty paragraphs in the middle of content", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "First"
		});

		await editor.click();
		await page.keyboard.press("End");
		await page.keyboard.press("Enter"); // empty line
		await page.keyboard.press("Enter"); // another empty line
		await page.keyboard.type("Third");
		await waitForSave(500);

		const text = await editor.evaluate((el) => el.closest(".ProseMirror").textContent);
		expect(text).toContain("First");
		expect(text).toContain("Third");

		// Check block count: at least First + empty(s) + Third = 3+
		// Note: ProseMirror may merge consecutive empty paragraphs
		const blockCount = await editor.evaluate((el) => {
			const viewEl = el.closest(".ProseMirror");
			return viewEl.children.length;
		});
		expect(blockCount).toBeGreaterThanOrEqual(3);
	});

	test("should ignore unchanged external text without collapsing local empty paragraphs", async ({ page }) => {
		const tiddlerTitle = "UnchangedTextRefresh_" + Date.now();
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Hello World"
		});

		await editor.click();
		await page.keyboard.press("End");
		await page.keyboard.press("Enter");
		await page.keyboard.press("Enter");
		await waitForSave(500);

		const blockCountAfterSave = await editor.evaluate((el) => el.closest(".ProseMirror").children.length);
		expect(blockCountAfterSave).toBeGreaterThanOrEqual(3);

		const savedText = await getTiddlerText(page, tiddlerTitle);
		await page.evaluate(() => document.activeElement.blur());
		await modifyTiddlerExternally(page, tiddlerTitle, savedText);
		await waitForSave(500);

		const blockCountAfterUnchangedRefresh = await editor.evaluate((el) => el.closest(".ProseMirror").children.length);
		expect(blockCountAfterUnchangedRefresh).toBe(blockCountAfterSave);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// External Changes (Agent Modifications)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Incremental Sync — External Changes", () => {

	test("should apply external text change incrementally", async ({ page }) => {
		const tiddlerTitle = "SyncTestTiddler_" + Date.now();
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Original content"
		});

		await waitForSave(500);

		// Blur editor so external changes are accepted
		await page.evaluate(() => document.activeElement.blur());

		// Modify tiddler externally
		await modifyTiddlerExternally(page, tiddlerTitle, "Modified by agent");

		// Wait for sync
		await waitForSave(500);

		// Verify editor shows updated content
		await expect(editor).toContainText("Modified by agent");
	});

	test("should queue focused external change and apply it after blur", async ({ page }) => {
		const tiddlerTitle = "FocusedExternalChange_" + Date.now();
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Focused original"
		});

		await waitForSave(500);
		await editor.click();
		await modifyTiddlerExternally(page, tiddlerTitle, "Changed while focused");
		await waitForSave(500);

		await expect(editor).toContainText("Focused original");
		await expect(editor).not.toContainText("Changed while focused");

		await page.evaluate(() => document.activeElement.blur());
		await waitForSave(500);
		await expect(editor).toContainText("Changed while focused");
	});

	test("should preserve editor state when external change matches roundtrip echo", async ({ page }) => {
		const tiddlerTitle = "EchoTestTiddler_" + Date.now();
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Hello World"
		});

		await waitForSave(500);

		// Record the tiddler text (which may differ slightly from input due to roundtrip)
		const savedText = await getTiddlerText(page, tiddlerTitle);

		// Blur and re-set the same text (simulating a roundtrip echo)
		await page.evaluate(() => document.activeElement.blur());
		await modifyTiddlerExternally(page, tiddlerTitle, savedText);
		await waitForSave(500);

		// Editor should still show the original content
		await expect(editor).toContainText("Hello World");
	});

	test("should apply agent change that appends content", async ({ page }) => {
		const tiddlerTitle = "AppendTestTiddler_" + Date.now();
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Line one"
		});

		await waitForSave(500);
		await page.evaluate(() => document.activeElement.blur());

		// Agent appends a new line
		await modifyTiddlerExternally(page, tiddlerTitle, "Line one\n\nLine two");

		await waitForSave(500);
		await expect(editor).toContainText("Line one");
		await expect(editor).toContainText("Line two");
	});

	test("should apply agent change that modifies existing content", async ({ page }) => {
		const tiddlerTitle = "ModifyTestTiddler_" + Date.now();
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Hello World"
		});

		await waitForSave(500);
		await page.evaluate(() => document.activeElement.blur());

		// Agent changes "World" to "Earth"
		await modifyTiddlerExternally(page, tiddlerTitle, "Hello Earth");

		await waitForSave(500);
		await expect(editor).toContainText("Hello Earth");
		await expect(editor).not.toContainText("Hello World");
	});

	test("should apply external change after an unchanged-text save attempt", async ({ page }) => {
		const tiddlerTitle = "NoopSaveThenExternal_" + Date.now();
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Original content"
		});

		await waitForSave(500);
		const textAfterNoop = await dispatchNoopDocChange(editor);
		await waitForSave(500);
		expect(textAfterNoop).toBe(await getTiddlerText(page, tiddlerTitle));

		await page.evaluate(() => document.activeElement.blur());
		await modifyTiddlerExternally(page, tiddlerTitle, "Changed after noop save");
		await waitForSave(500);

		await expect(editor).toContainText("Changed after noop save");
		await expect(editor).not.toContainText("Original content");
	});

	test("should sync external changes through standalone prosemirror widget", async ({ page }) => {
		const tiddlerTitle = "StandaloneSync_" + Date.now();
		const editor = await setupStandaloneProseMirrorTest(page, tiddlerTitle, "Standalone original");

		await page.evaluate(() => document.activeElement.blur());
		await modifyTiddlerExternally(page, tiddlerTitle, "Standalone blurred update");
		await waitForSave(500);
		await expect(editor).toContainText("Standalone blurred update");

		await editor.click();
		await modifyTiddlerExternally(page, tiddlerTitle, "Standalone focused update");
		await waitForSave(500);
		await expect(editor).toContainText("Standalone blurred update");
		await expect(editor).not.toContainText("Standalone focused update");

		await page.evaluate(() => document.activeElement.blur());
		await waitForSave(500);
		await expect(editor).toContainText("Standalone focused update");
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Engine API Verification
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Incremental Sync — Engine API", () => {

	test("engine should have applyExternalText method", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);

		const info = await getEngine(editor);
		expect(info).not.toBeNull();
		expect(info.hasApplyExternalText).toBe(true);
		expect(info.hasLastSavedDocJSON).toBe(true);
		expect(info.hasPendingSavedText).toBe(true);
	});

	test("engine.lastSavedDocJSON should be set after save", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "Test content"
		});

		await editor.click();
		await page.keyboard.type(" more");
		await waitForSave(500);

		const info = await getEngine(editor);
		expect(info).not.toBeNull();
		expect(info.hasLastSavedDocJSON).toBe(true);
	});

	test("should not rebuild editor after own save (echo prevention)", async ({ page }) => {
		const tiddlerTitle = "EchoTestTiddler2_" + Date.now();
		const editor = await setupProseMirrorTest(page, tiddlerTitle, {
			useReadmeTiddler: false,
			initialText: "Hello World"
		});

		await editor.click();
		// Add empty paragraphs
		await page.keyboard.press("End");
		await page.keyboard.press("Enter");
		await page.keyboard.press("Enter");
		await waitForSave(500);

		// Record block count after save cycle
		const blockCountAfterSave = await editor.evaluate((el) => {
			const viewEl = el.closest(".ProseMirror");
			return viewEl.children.length;
		});
		expect(blockCountAfterSave).toBeGreaterThanOrEqual(3);

		// Wait much longer — block count should NOT decrease
		await waitForSave(1500);
		const blockCountLater = await editor.evaluate((el) => {
			const viewEl = el.closest(".ProseMirror");
			return viewEl.children.length;
		});
		expect(blockCountLater).toBe(blockCountAfterSave);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Undo History Preservation
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Incremental Sync — Undo History", () => {

	test("should preserve undo history across save cycles", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, {
			initialText: "Start"
		});

		await editor.click();
		await clearEditor(editor);
		await page.keyboard.type("First edit");
		await waitForSave(500);

		await page.keyboard.type(" Second edit");
		await waitForSave(500);

		// Undo should remove " Second edit"
		await page.keyboard.press("Control+z");
		await expect(editor).toContainText("First edit");

		// Redo should restore it
		await page.keyboard.press("Control+Shift+z");
		await expect(editor).toContainText("Second edit");
	});
});
