/*\
Shared helpers for ProseMirror Playwright specs.
Import with:
  const { setupProseMirrorTest, loadTestPage, clearEditor, ... } = require("../helpers.js");
\*/

"use strict";

const { resolve } = require("path");
const { pathToFileURL } = require("url");

// Track per-page external-route blocking (one WeakSet per module load)
const _externalRoutesInstalled = new WeakSet();

// ---------------------------------------------------------------------------
// Low-level editor helpers
// ---------------------------------------------------------------------------

async function clearEditor(editor) {
	await editor.click();
	await editor.press("Control+A");
	await editor.press("Backspace");
}

function dispatchEditorShortcut(editor, key, code, options = {}) {
	return editor.evaluate((el, { key, code, options }) => {
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
		const event = new KeyboardEvent("keydown", Object.assign({ key, code, bubbles: true, cancelable: true }, options));
		event.twEditor = true;
		let handled = false;
		engine.view.someProp("handleKeyDown", (handler) => {
			handled = handler(engine.view, event) || handled;
			return handled;
		});
		return handled;
	}, { key, code, options });
}

function selectAllEditorContent(editor) {
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
		const SelectionType = state.selection.constructor;
		const selection = SelectionType.create(state.doc, 1, state.doc.content.size);
		engine.view.dispatch(state.tr.setSelection(selection));
		engine.view.focus();
		const nextSelection = engine.view.state.selection;
		return nextSelection.from === 1 && nextSelection.to === engine.view.state.doc.content.size;
	});
}

async function pastePlainText(editor, text) {
	await editor.evaluate((el, t) => {
		const dt = new DataTransfer();
		dt.setData("text/plain", t);
		const evt = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
		el.dispatchEvent(evt);
		try { el.ownerDocument.execCommand("insertText", false, t); } catch(e) { /* ignore */ }
	}, text);
}

// ---------------------------------------------------------------------------
// Page setup
// ---------------------------------------------------------------------------

async function loadTestPage(page) {
	if(!_externalRoutesInstalled.has(page)) {
		await page.route("http://**/*", (route) => route.abort());
		await page.route("https://**/*", (route) => route.abort());
		_externalRoutesInstalled.add(page);
	}

	const repoRoot = resolve(__dirname, "../../../../");
	const indexPath = resolve(repoRoot, "editions/test/output", "test.html");
	const indexUrl = pathToFileURL(indexPath).href;

	try {
		await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
	} catch(e) {
		await page.waitForTimeout(1000);
		await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
	}
	await page.waitForSelector(".tc-site-title", { timeout: 30000 });
}

async function setupProseMirrorTest(page, tiddlerTitle = null, options = {}) {
	if(!tiddlerTitle) {
		tiddlerTitle = "ProseMirrorTestTiddler_" + Math.floor(Math.random() * 10000);
	}
	const initialText = options.initialText !== undefined ? options.initialText : "Start";
	const contentType = options.contentType || "text/vnd.tiddlywiki";
	const configTiddlers = Array.isArray(options.configTiddlers) ? options.configTiddlers : [];
	const useReadmeTiddler = options.useReadmeTiddler !== undefined ? !!options.useReadmeTiddler : true;

	page.on("pageerror", (err) => {
		console.log(`[Browser Error] ${err.message}`);
	});

	await loadTestPage(page);

	if(useReadmeTiddler) {
		const readmeTitle = "$:/plugins/tiddlywiki/prosemirror/readme";
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";
		await page.evaluate(({ readmeTitle, exampleTitle, initialText, configTiddlers, contentType }) => {
			for(const t of configTiddlers) $tw.wiki.addTiddler(t);
			$tw.wiki.addTiddler({ title: exampleTitle, text: initialText, type: contentType });
			const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
			if(storyList.indexOf(readmeTitle) === -1) {
				storyList.unshift(readmeTitle);
				$tw.wiki.addTiddler({ title: "$:/StoryList", list: storyList });
			}
		}, { readmeTitle, exampleTitle, initialText, configTiddlers, contentType });

		await page.waitForSelector(`.tc-tiddler-frame[data-tiddler-title="${readmeTitle}"]`, { timeout: 10000 });
		const editor = page.locator(`.tc-tiddler-frame[data-tiddler-title="${readmeTitle}"] .ProseMirror`).first();
		await editor.waitFor({ state: "visible", timeout: 10000 });
		return editor;
	}

	// Isolated harness tiddler
	const harnessTitle = `Harness_${tiddlerTitle}`;
	await page.evaluate(({ tiddlerTitle, harnessTitle, initialText, configTiddlers, contentType }) => {
		for(const t of configTiddlers) $tw.wiki.addTiddler(t);
		$tw.wiki.addTiddler({ title: tiddlerTitle, text: initialText, type: contentType });
		$tw.wiki.addTiddler({ title: harnessTitle, text: `<$edit-prosemirror tiddler="${tiddlerTitle}"/>` });
		const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
		if(storyList.indexOf(harnessTitle) === -1) {
			storyList.unshift(harnessTitle);
			$tw.wiki.addTiddler({ title: "$:/StoryList", list: storyList });
		}
	}, { tiddlerTitle, harnessTitle, initialText, configTiddlers, contentType });

	await page.waitForSelector(`.tc-tiddler-frame[data-tiddler-title="${harnessTitle}"]`, { timeout: 10000 });
	const editor = page.locator(`.tc-tiddler-frame[data-tiddler-title="${harnessTitle}"] .ProseMirror`).first();
	await editor.waitFor({ state: "visible", timeout: 10000 });
	return editor;
}

module.exports = {
	clearEditor,
	dispatchEditorShortcut,
	selectAllEditorContent,
	pastePlainText,
	loadTestPage,
	setupProseMirrorTest
};
