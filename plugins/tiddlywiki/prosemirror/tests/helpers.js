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
	await selectAllEditorContent(editor);
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

async function installCustomSyntaxTestModules(page) {
	await page.evaluate(() => {
		if($tw.__pmCustomSyntaxTestModulesInstalled) {
			return;
		}
		$tw.__pmCustomSyntaxTestModulesInstalled = true;

		const BaseWidget = Object.getPrototypeOf($tw.rootWidget).constructor;

		function TestSyntaxWidget(parseTreeNode, options) {
			this.initialise(parseTreeNode, options);
		}
		TestSyntaxWidget.prototype = new BaseWidget();
		TestSyntaxWidget.prototype.render = function(parent, nextSibling) {
			this.parentDomNode = parent;
			this.computeAttributes();
			this.execute();

			const wrapper = this.document.createElement("div");
			wrapper.className = "pmtest-custom-syntax-box";
			wrapper.setAttribute("data-syntax-kind", this.getAttribute("kind", "unknown"));

			const heading = this.document.createElement("div");
			heading.className = "pmtest-custom-syntax-heading";
			heading.textContent = this.getAttribute("renderLabel", "Custom syntax preserved");
			wrapper.appendChild(heading);

			const list = this.document.createElement("ul");
			list.className = "pmtest-custom-syntax-items";
			wrapper.appendChild(list);

			this.renderChildren(list, null);
			parent.insertBefore(wrapper, nextSibling);
			this.domNodes.push(wrapper);
		};
		TestSyntaxWidget.prototype.execute = function() {
			this.makeChildWidgets();
		};

		function makeChecklistRule(options) {
			return {
				name: options.name,
				types: { inline: true },
				init: function(parser) {
					this.parser = parser;
					this.matchRegExp = options.matchRegExp;
				},
				parse: function() {
					const listItems = [];
					const listStartPos = this.parser.pos;
					let match = this.match;
					do {
						const lineStartPos = match.index;
						this.parser.pos = this.matchRegExp.lastIndex;
						const bodyText = this.parser.source.substring(lineStartPos + 5, this.parser.pos);
						const parseResults = this.parser.wiki.parseText("text/vnd.tiddlywiki", bodyText, {
							parseAsInline: true
						});
						listItems.push({
							type: "element",
							tag: "li",
							children: [{
								type: "element",
								tag: "label",
								children: parseResults.tree
							}]
						});
						match = this.matchRegExp.exec(this.parser.source);
					} while(match != null && match.index === 1 + this.parser.pos);

					const node = {
						type: options.widgetType,
						attributes: {
							kind: { type: "string", value: options.kind },
							renderLabel: { type: "string", value: options.renderLabel }
						},
						children: listItems
					};

					if(options.includeNodeOffsets) {
						node.start = listStartPos;
						node.end = this.parser.pos;
					} else {
						node.attributes.listStartPos = { type: "string", value: String(listStartPos) };
						node.attributes.listStopPos = { type: "string", value: String(this.parser.pos) };
					}

					return [node];
				}
			};
		}

		$tw.modules.define("$:/temp/prosemirror/tests/custom-syntax-widget.js", "widget", {
			"pmtest-legacy-task-list": TestSyntaxWidget,
			"pmtest-modern-task-list": TestSyntaxWidget
		});
		$tw.modules.define("$:/temp/prosemirror/tests/custom-syntax-legacy-rule.js", "wikirule", makeChecklistRule({
			name: "pmtest-legacy-task",
			matchRegExp: /^\[@([ xX])\] .*$/mg,
			widgetType: "pmtest-legacy-task-list",
			kind: "legacy",
			renderLabel: "Legacy custom syntax preserved",
			includeNodeOffsets: false
		}));
		$tw.modules.define("$:/temp/prosemirror/tests/custom-syntax-modern-rule.js", "wikirule", makeChecklistRule({
			name: "pmtest-modern-task",
			matchRegExp: /^\[%([ xX])\] .*$/mg,
			widgetType: "pmtest-modern-task-list",
			kind: "modern",
			renderLabel: "Modern custom syntax preserved",
			includeNodeOffsets: true
		}));

		const WikitextParser = $tw.Wiki.parsers["text/vnd.tiddlywiki"];
		if(WikitextParser && WikitextParser.prototype) {
			delete WikitextParser.prototype.pragmaRuleClasses;
			delete WikitextParser.prototype.blockRuleClasses;
			delete WikitextParser.prototype.inlineRuleClasses;
		}

		delete BaseWidget.prototype.widgetClasses;
		if($tw.rootWidget && Object.prototype.hasOwnProperty.call($tw.rootWidget, "widgetClasses")) {
			delete $tw.rootWidget.widgetClasses;
		}
		if($tw.wiki && typeof $tw.wiki.clearCache === "function") {
			$tw.wiki.clearCache();
		}
	});
}

async function installInteractiveChecklistTestModules(page) {
	await page.evaluate(() => {
		if($tw.__pmInteractiveChecklistTestModulesInstalled) {
			return;
		}
		$tw.__pmInteractiveChecklistTestModulesInstalled = true;

		const BaseWidget = Object.getPrototypeOf($tw.rootWidget).constructor;

		function InteractiveChecklistWidget(parseTreeNode, options) {
			this.initialise(parseTreeNode, options);
		}
		InteractiveChecklistWidget.prototype = new BaseWidget();
		InteractiveChecklistWidget.prototype.execute = function() {};
		InteractiveChecklistWidget.prototype.render = function(parent, nextSibling) {
			this.parentDomNode = parent;
			this.computeAttributes();
			this.execute();

			const wrapper = this.document.createElement("div");
			wrapper.className = "pmtest-interactive-checklist";

			const list = this.document.createElement("ul");
			list.className = "pmtest-interactive-checklist-list";
			wrapper.appendChild(list);

			const input = this.document.createElement("input");
			input.type = "text";
			input.className = "pmtest-interactive-checklist-newitem";
			input.placeholder = "New item";

			const tiddlerTitle = (this.parentWidget && this.parentWidget.editTitle) || this.getVariable("currentTiddler");
			const startPos = parseInt(this.getAttribute("listStartPos", "0"), 10);
			const stopPos = parseInt(this.getAttribute("listStopPos", "0"), 10);

			const getLines = () => {
				const tiddlerText = $tw.wiki.getTiddlerText(tiddlerTitle, "");
				return tiddlerText.substring(startPos, stopPos).split("\n").filter(Boolean);
			};

			const writeLines = (lines) => {
				const tiddlerText = $tw.wiki.getTiddlerText(tiddlerTitle, "");
				const newBody = tiddlerText.substring(0, startPos) + lines.join("\n") + tiddlerText.substring(stopPos);
				$tw.wiki.setText(tiddlerTitle, "text", null, newBody);
			};

			getLines().forEach((line, index) => {
				const match = /^\[\?([ xX])\]\s?(.*)$/.exec(line);
				if(!match) {
					return;
				}
				const item = this.document.createElement("li");
				item.className = "pmtest-interactive-checklist-item";

				const checkbox = this.document.createElement("input");
				checkbox.type = "checkbox";
				checkbox.className = "pmtest-interactive-checklist-checkbox";
				checkbox.checked = match[1].toLowerCase() === "x";
				checkbox.addEventListener("change", () => {
					const lines = getLines();
					lines[index] = lines[index].replace(/^\[\?[ xX]\]/, checkbox.checked ? "[?x]" : "[? ]");
					writeLines(lines);
				});

				const label = this.document.createElement("span");
				label.className = "pmtest-interactive-checklist-label";
				label.textContent = match[2];

				item.appendChild(checkbox);
				item.appendChild(label);
				list.appendChild(item);
			});

			const saveNewItem = () => {
				const value = input.value.trim();
				if(!value) {
					return;
				}
				const lines = getLines();
				lines.push("[? ] " + value);
				input.value = "";
				writeLines(lines);
			};

			input.addEventListener("keyup", (event) => {
				if(event.key === "Enter") {
					saveNewItem();
				}
			});

			wrapper.appendChild(input);
			parent.insertBefore(wrapper, nextSibling);
			this.domNodes.push(wrapper);
		};

		$tw.modules.define("$:/temp/prosemirror/tests/interactive-checklist-widget.js", "widget", {
			"pmtest-interactive-checklist": InteractiveChecklistWidget
		});

		$tw.modules.define("$:/temp/prosemirror/tests/interactive-checklist-rule.js", "wikirule", {
			name: "pmtest-interactive-checklist-rule",
			types: { inline: true },
			init: function(parser) {
				this.parser = parser;
				this.matchRegExp = /^\[\?([ xX])\] .*$/mg;
			},
			parse: function() {
				const listStartPos = this.parser.pos;
				let match = this.match;
				do {
					this.parser.pos = this.matchRegExp.lastIndex;
					match = this.matchRegExp.exec(this.parser.source);
				} while(match != null && match.index === 1 + this.parser.pos);

				return [{
					type: "pmtest-interactive-checklist",
					attributes: {
						listStartPos: { type: "string", value: String(listStartPos) },
						listStopPos: { type: "string", value: String(this.parser.pos) }
					},
					children: []
				}];
			}
		});

		const WikitextParser = $tw.Wiki.parsers["text/vnd.tiddlywiki"];
		if(WikitextParser && WikitextParser.prototype) {
			delete WikitextParser.prototype.pragmaRuleClasses;
			delete WikitextParser.prototype.blockRuleClasses;
			delete WikitextParser.prototype.inlineRuleClasses;
		}

		const BaseWidgetProto = BaseWidget.prototype;
		delete BaseWidgetProto.widgetClasses;
		if($tw.rootWidget && Object.prototype.hasOwnProperty.call($tw.rootWidget, "widgetClasses")) {
			delete $tw.rootWidget.widgetClasses;
		}
		if($tw.wiki && typeof $tw.wiki.clearCache === "function") {
			$tw.wiki.clearCache();
		}
	});
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
	installCustomSyntaxTestModules,
	installInteractiveChecklistTestModules,
	selectAllEditorContent,
	pastePlainText,
	loadTestPage,
	setupProseMirrorTest
};
