/*\
title: $:/plugins/tiddlywiki/prosemirror/engine.js
type: application/javascript
module-type: library

ProseMirror text editor engine for the editTextWidgetFactory.
Implements the engine interface required by $:/core/modules/editor/factory.js.

\*/

"use strict";

var HEIGHT_VALUE_TITLE = "$:/config/TextEditor/EditorHeight/Height";

var wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;
var wikiAstToProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js").to;

var EditorState = require("prosemirror-state").EditorState;
var EditorView = require("prosemirror-view").EditorView;
var Schema = require("prosemirror-model").Schema;
var TextSelection = require("prosemirror-state").TextSelection;
var basicSchema = require("prosemirror-schema-basic").schema;
var createListPlugins = require("prosemirror-flat-list").createListPlugins;
var createListSpec = require("prosemirror-flat-list").createListSpec;
var listKeymap = require("prosemirror-flat-list").listKeymap;
var exampleSetup = require("$:/plugins/tiddlywiki/prosemirror/setup/setup.js").exampleSetup;
var keymap = require("prosemirror-keymap").keymap;
var placeholderPlugin = require("$:/plugins/tiddlywiki/prosemirror/setup/placeholder.js").placeholderPlugin;
var SlashMenuPlugin = require("$:/plugins/tiddlywiki/prosemirror/slash-menu.js").SlashMenuPlugin;
var SlashMenuUI = require("$:/plugins/tiddlywiki/prosemirror/slash-menu-ui.js").SlashMenuUI;
var getAllMenuElements = require("$:/plugins/tiddlywiki/prosemirror/menu-elements.js").getAllMenuElements;
var createWidgetBlockPlugin = require("$:/plugins/tiddlywiki/prosemirror/widget-block/plugin.js").createWidgetBlockPlugin;
var createWidgetBlockNodeViewPlugin = require("$:/plugins/tiddlywiki/prosemirror/widget-block/plugin.js").createWidgetBlockNodeViewPlugin;
var createImageBlockPlugin = require("$:/plugins/tiddlywiki/prosemirror/image-block/plugin.js").createImageBlockPlugin;
var createImageNodeViewPlugin = require("$:/plugins/tiddlywiki/prosemirror/image/plugin.js").createImageNodeViewPlugin;
var createPragmaBlockNodeViewPlugin = require("$:/plugins/tiddlywiki/prosemirror/pragma-block/nodeview.js").createPragmaBlockNodeViewPlugin;
var createHardLineBreaksNodeViewPlugin = require("$:/plugins/tiddlywiki/prosemirror/hard-line-breaks-block/nodeview.js").createHardLineBreaksNodeViewPlugin;
var debounce = require("$:/core/modules/utils/debounce.js").debounce;
var pmCommands = require("prosemirror-commands");
var flatListCommands = require("prosemirror-flat-list");
var BubbleMenu = require("$:/plugins/tiddlywiki/prosemirror/bubble-menu.js").BubbleMenu;
var createDragHandlePlugin = require("$:/plugins/tiddlywiki/prosemirror/drag-handle.js").createDragHandlePlugin;
var getMarkdownInputRules = require("$:/plugins/tiddlywiki/prosemirror/markdown-shortcuts.js").getMarkdownInputRules;
var inputRules = require("prosemirror-inputrules").inputRules;
var createAutocompletePlugin = require("$:/plugins/tiddlywiki/prosemirror/autocomplete/autocomplete-plugin.js").createAutocompletePlugin;
var createFindReplacePlugin = require("$:/plugins/tiddlywiki/prosemirror/find-replace/find-replace-plugin.js").createFindReplacePlugin;

// prosemirror-tables — conditional require (not available in Node tests)
var pmTables;
try {
	pmTables = require("prosemirror-tables");
} catch(e) {
	pmTables = null;
}

/**
 * Build the ProseMirror schema (shared between engine and standalone widget).
 */
function buildSchema() {
	var baseNodes = basicSchema.spec.nodes.append({ list: createListSpec() });
	// Override blockquote to add cite attr for preserving <<<...<<<cite text
	var baseBqSpec = basicSchema.spec.nodes.get("blockquote");
	baseNodes = baseNodes.update("blockquote", Object.assign({}, baseBqSpec, {
		attrs: { cite: { default: null } },
		toDOM: function(node) {
			return ["blockquote", 0];
		},
		parseDOM: [{ tag: "blockquote" }]
	}));
	var baseImageSpec = basicSchema.spec.nodes.get("image");
	var nodes = baseNodes.update("image", Object.assign({}, baseImageSpec, {
		attrs: Object.assign({}, baseImageSpec && baseImageSpec.attrs, {
			width: { default: null },
			height: { default: null },
			twSource: { default: null },
			twKind: { default: "shortcut" },
			twTooltip: { default: null }
		}),
		toDOM: function(node) {
			var attrs = {
				src: node.attrs.src,
				alt: node.attrs.alt,
				title: node.attrs.title
			};
			if(node.attrs.width) attrs.width = node.attrs.width;
			if(node.attrs.height) attrs.height = node.attrs.height;
			if(node.attrs.twSource) attrs["data-tw-source"] = node.attrs.twSource;
			if(node.attrs.twKind) attrs["data-tw-kind"] = node.attrs.twKind;
			if(node.attrs.twTooltip) attrs["data-tw-tooltip"] = node.attrs.twTooltip;
			return ["img", attrs];
		},
		parseDOM: [{
			tag: "img[src]",
			getAttrs: function(dom) {
				return {
					src: dom.getAttribute("src"),
					title: dom.getAttribute("title"),
					alt: dom.getAttribute("alt"),
					width: dom.getAttribute("width") || null,
					height: dom.getAttribute("height") || null,
					twSource: dom.getAttribute("data-tw-source") || null,
					twKind: dom.getAttribute("data-tw-kind") || "shortcut",
					twTooltip: dom.getAttribute("data-tw-tooltip") || null
				};
			}
		}]
	})).append({
		pragma_block: {
			attrs: { rawText: { default: "" }, firstLine: { default: "" } },
			group: "block", atom: true, selectable: true, draggable: true,
			toDOM: function(node) {
				var wrapper = document.createElement("div");
				wrapper.className = "pm-pragma-block";
				wrapper.setAttribute("data-raw-text", node.attrs.rawText);
				wrapper.setAttribute("data-first-line", node.attrs.firstLine);
				wrapper.setAttribute("contenteditable", "false");
				var label = document.createElement("span");
				label.className = "pm-pragma-block-label";
				label.textContent = node.attrs.firstLine || "(pragma)";
				wrapper.appendChild(label);
				return wrapper;
			},
			parseDOM: [{
				tag: "div.pm-pragma-block",
				getAttrs: function(dom) {
					return {
						rawText: dom.getAttribute("data-raw-text") || "",
						firstLine: dom.getAttribute("data-first-line") || ""
					};
				}
			}]
		},
		opaque_block: {
			attrs: { rawText: { default: "" }, firstLine: { default: "" } },
			group: "block", atom: true, selectable: true, draggable: true,
			toDOM: function(node) {
				var wrapper = document.createElement("div");
				wrapper.className = "pm-opaque-block";
				wrapper.setAttribute("data-raw-text", node.attrs.rawText);
				wrapper.setAttribute("data-first-line", node.attrs.firstLine);
				wrapper.setAttribute("contenteditable", "false");
				var label = document.createElement("span");
				label.className = "pm-opaque-block-label";
				label.textContent = node.attrs.firstLine || "(unsupported block)";
				wrapper.appendChild(label);
				return wrapper;
			},
			parseDOM: [{
				tag: "div.pm-opaque-block",
				getAttrs: function(dom) {
					return {
						rawText: dom.getAttribute("data-raw-text") || "",
						firstLine: dom.getAttribute("data-first-line") || ""
					};
				}
			}]
		},
		definition_list: {
			group: "block",
			content: "(definition_term | definition_description)+",
			toDOM: function() { return ["dl", { class: "pm-definition-list" }, 0]; },
			parseDOM: [{ tag: "dl" }]
		},
		definition_term: {
			content: "inline*",
			toDOM: function() { return ["dt", 0]; },
			parseDOM: [{ tag: "dt" }],
			defining: true
		},
		definition_description: {
			content: "inline*",
			toDOM: function() { return ["dd", 0]; },
			parseDOM: [{ tag: "dd" }],
			defining: true
		},
		hard_line_breaks_block: {
			group: "block",
			content: "inline*",
			toDOM: function() { return ["div", { class: "pm-hard-line-breaks-block-wrapper" }, 0]; },
			parseDOM: [{ tag: "div.pm-hard-line-breaks-block-wrapper" }]
		}
	});

	// Add table nodes if prosemirror-tables is available
	if(pmTables) {
		var tableNodeSpecs = pmTables.tableNodes({
			tableGroup: "block",
			cellContent: "block+",
			cellAttributes: {
				background: {
					default: null,
					getFromDOM: function(dom) { return dom.style.backgroundColor || null; },
					setDOMAttr: function(value, attrs) { if(value) attrs.style = (attrs.style || "") + "background-color: " + value + ";"; }
				}
			}
		});
		// Merge table node specs into nodes
		nodes = nodes.append(tableNodeSpecs);
	}

	var extendedMarks = basicSchema.spec.marks.append({
		underline: {
			parseDOM: [{ tag: "u" }, { style: "text-decoration=underline" }],
			toDOM: function() { return ["u", 0]; }
		},
		strike: {
			parseDOM: [{ tag: "strike" }, { tag: "s" }, { tag: "del" }, { style: "text-decoration=line-through" }],
			toDOM: function() { return ["strike", 0]; }
		},
		superscript: {
			parseDOM: [{ tag: "sup" }],
			toDOM: function() { return ["sup", 0]; },
			excludes: "subscript"
		},
		subscript: {
			parseDOM: [{ tag: "sub" }],
			toDOM: function() { return ["sub", 0]; },
			excludes: "superscript"
		}
	});

	return new Schema({ nodes: nodes, marks: extendedMarks });
}

/**
 * ProseMirrorEngine — implements the factory engine interface required by
 * $:/core/modules/editor/factory.js.
 */
class ProseMirrorEngine {
	constructor(options) {
		this.widget = options.widget;
		this.value = options.value;
		this.parentNode = options.parentNode;
		this.nextSibling = options.nextSibling;

		// Expose wiki and variables so nodeviews (which receive `this` as parentWidget) can use them
		this.wiki = this.widget.wiki;
		this.variables = this.widget.variables || {};

		// Flags
		this.saveLock = false;
		this.imagePickerOpen = false;

		// Build DOM structure
		this.domNode = document.createElement("div");
		this.domNode.className = "tc-prosemirror-wrapper";
		if(this.widget.editClass) {
			this.domNode.className += " " + this.widget.editClass;
		}

		const container = document.createElement("div");
		container.className = "tc-prosemirror-container";
		const mount = document.createElement("div");
		mount.className = "tc-prosemirror-mount";
		container.appendChild(mount);
		this.domNode.appendChild(container);

		// Insert into DOM
		this.parentNode.insertBefore(this.domNode, this.nextSibling);
		this.widget.domNodes.push(this.domNode);

		// Build schema
		this.schema = buildSchema();

		// Parse initial content
		let doc;
		try {
			const initialWikiAst = $tw.wiki.parseText(null, this.value || "").tree;
			doc = wikiAstToProseMirrorAst(initialWikiAst);
		} catch(e) {
			console.error("[ProseMirror] Error parsing initial content:", e);
			doc = { type: "doc", content: [{ type: "paragraph" }] };
		}

		// Build plugins — this engine instance acts as nodeViewHost so nodeviews
		// can call getPragmaPreamble, addEventListener, getVariable, etc.
		const listKeymapPlugin = keymap(listKeymap);
		const listPlugins = createListPlugins({ schema: this.schema });
		const allMenuElements = getAllMenuElements(this.widget.wiki, this.schema);

		// Debounced save — flushes getText() → widget.saveChanges() after idle.
		// Also keeps the source textarea in sync when it is visible.
		this.debouncedSave = debounce(() => {
			const text = this.getText();
			this.widget.saveChanges(text);
			if(this._sourceShowing && this._sourceTextarea && document.activeElement !== this._sourceTextarea) {
				this._sourceTextarea.value = text;
			}
		}, 300);

		// Create EditorView
		const tablePlugins = [];
		if(pmTables && this.schema.nodes.table) {
			tablePlugins.push(pmTables.columnResizing());
			tablePlugins.push(pmTables.tableEditing());
			tablePlugins.push(keymap({
				"Tab": pmTables.goToNextCell(1),
				"Shift-Tab": pmTables.goToNextCell(-1)
			}));
		}

		// Markdown-style input rules (optional, controlled by config tiddler)
		const mdRules = getMarkdownInputRules(this.widget.wiki, this.schema);
		const mdPlugin = mdRules.length > 0 ? [inputRules({ rules: mdRules })] : [];

		this.view = new EditorView(mount, {
			state: EditorState.create({
				doc: this.schema.nodeFromJSON(doc),
				plugins: [
					SlashMenuPlugin(allMenuElements, {
						triggerCodes: ["Slash", "Backslash"]
					}),
					createImageBlockPlugin(),
					createImageNodeViewPlugin(this),
					listKeymapPlugin,
					placeholderPlugin({
						text: this.widget.wiki.getTiddlerText("$:/config/prosemirror/placeholder", "Type / for commands")
					}),
					createWidgetBlockPlugin(),
					createWidgetBlockNodeViewPlugin(this),
					createPragmaBlockNodeViewPlugin(this),
					createHardLineBreaksNodeViewPlugin(),
					createDragHandlePlugin(),
					createAutocompletePlugin(this.widget.wiki),
					createFindReplacePlugin(this.widget.wiki)
				]
				.concat(mdPlugin)
				.concat(listPlugins)
				.concat(tablePlugins)
				.concat(exampleSetup({ schema: this.schema }))
			}),
			dispatchTransaction: (transaction) => {
				const newState = this.view.state.apply(transaction);
				this.view.updateState(newState);
				if(this.slashMenuUI) {
					this.slashMenuUI.checkState();
				}
				if(this.bubbleMenu) {
					this.bubbleMenu.update(this.view);
				}
				if(transaction.docChanged) {
					this.debouncedSave();
				}
			}
		});

		// Mark events so TW handlers don't hijack them
		this.view.dom.addEventListener("paste", (event) => {
			event.twEditor = true;
			event.stopPropagation();
		});
		// For keydown: let ProseMirror handle first, then forward unhandled events
		// to the factory widget for toolbar shortcuts.
		this.view.dom.addEventListener("keydown", (event) => {
			event.twEditor = true;
			if(!event.defaultPrevented && this.widget.handleKeydownEvent) {
				this.widget.handleKeydownEvent(event);
			}
			event.stopPropagation();
		});
		container.setAttribute("data-tw-prosemirror-keycapture", "yes");

		// SlashMenu UI
		this.slashMenuUI = new SlashMenuUI(this.view, { clickable: true });

		// Bubble Menu (floating toolbar on text selection)
		this.bubbleMenu = new BubbleMenu(this.view, this.schema);

		// "Add new line" button
		const addLineWrap = document.createElement("div");
		addLineWrap.className = "tc-prosemirror-addline";
		const addLineBtn = document.createElement("button");
		addLineBtn.type = "button";
		addLineBtn.className = "tc-prosemirror-addline-btn";
		addLineBtn.textContent = this.widget.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/AddNewLine", "+ new line");
		addLineBtn.setAttribute("contenteditable", "false");
		addLineBtn.addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); }, true);
		addLineBtn.addEventListener("click", () => {
			if(!this.view) return;
			const state = this.view.state;
			const endPos = state.doc.content.size;
			const para = state.schema.nodes.paragraph && state.schema.nodes.paragraph.createAndFill();
			if(!para) { this.view.focus(); return; }
			let tr = state.tr.insert(endPos, para);
			tr = tr.setSelection(TextSelection.atEnd(tr.doc));
			this.view.dispatch(tr.scrollIntoView());
			this.view.focus();
		});
		addLineWrap.appendChild(addLineBtn);

		// --- Source code panel (side-by-side wikitext source view) ---
		const SOURCE_STATE_TIDDLER = "$:/state/prosemirror/show-source";
		this._sourcePanel = null;
		this._sourceTextarea = null;
		this._sourceShowing = false;

		const sourcePanel = document.createElement("div");
		sourcePanel.className = "tc-prosemirror-source-panel";
		sourcePanel.style.display = "none";
		const sourceLabel = document.createElement("div");
		sourceLabel.className = "tc-prosemirror-source-label";
		sourceLabel.textContent = this.widget.wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/SourcePanel/Title", "WikiText Source");
		const sourceTextarea = document.createElement("textarea");
		sourceTextarea.className = "tc-prosemirror-source-textarea tc-edit-texteditor";
		sourceTextarea.spellcheck = false;
		sourcePanel.appendChild(sourceLabel);
		sourcePanel.appendChild(sourceTextarea);
		this._sourcePanel = sourcePanel;
		this._sourceTextarea = sourceTextarea;

		// When source textarea changes, update PM (debounced)
		const debouncedSourceSync = debounce(() => {
			if(!this._sourceShowing || !this.view) return;
			this.updateDomNodeText(sourceTextarea.value);
		}, 500);
		sourceTextarea.addEventListener("input", () => debouncedSourceSync());

		// Check if source panel should be open on load
		if(this.widget.wiki.getTiddlerText(SOURCE_STATE_TIDDLER) === "yes") {
			this._sourceShowing = true;
			sourceTextarea.value = this.getText();
			sourcePanel.style.display = "";
			this.domNode.classList.add("tc-prosemirror-source-active");
		}

		// Append source panel to wrapper
		this.domNode.appendChild(sourcePanel);

		// Attach add-line button after ProseMirror-menu wraps the DOM
		setTimeout(() => {
			try {
				const host = this.view && this.view.dom && this.view.dom.parentNode;
				(host || this.domNode).appendChild(addLineWrap);
			} catch(e) { /* ignore */ }
		}, 0);

		// Register TW message handlers on the factory widget
		if(this.widget.addEventListener) {
			this.widget.addEventListener("tm-prosemirror-image-picked-nodeview", (event) => this.handleImagePickedNodeView(event));
			this.widget.addEventListener("tm-prosemirror-toggle-source", () => {
				this.toggleSourcePanel();
				return true;
			});
		}
	}

	// Bridge Widget interface methods so nodeViews can create child widgets
	// that walk the parent chain correctly (getAncestorCount, getVariable, etc.)
	get parentWidget() { return this.widget; }

	addEventListener(type, handler) {
		if(this.widget && this.widget.addEventListener) {
			this.widget.addEventListener(type, handler);
		}
	}

	getAncestorCount() {
		return (this.widget && typeof this.widget.getAncestorCount === "function")
			? this.widget.getAncestorCount()
			: 0;
	}

	getVariable(name, options) {
		return (this.widget && typeof this.widget.getVariable === "function")
			? this.widget.getVariable(name, options)
			: undefined;
	}

	dispatchEvent(event) {
		return (this.widget && typeof this.widget.dispatchEvent === "function")
			? this.widget.dispatchEvent(event)
			: true;
	}

	// eslint-disable-next-line class-methods-use-this
	makeChildWidgets() {}

	toggleSourcePanel() {
		const SOURCE_STATE_TIDDLER = "$:/state/prosemirror/show-source";
		this._sourceShowing = !this._sourceShowing;
		if(this._sourceShowing) {
			this._sourceTextarea.value = this.getText();
			this._sourcePanel.style.display = "";
			this.domNode.classList.add("tc-prosemirror-source-active");
		} else {
			if(this.view && this._sourceTextarea.value !== this.getText()) {
				this.updateDomNodeText(this._sourceTextarea.value);
				this.widget.saveChanges(this._sourceTextarea.value);
			}
			this._sourcePanel.style.display = "none";
			this.domNode.classList.remove("tc-prosemirror-source-active");
		}
		this.widget.wiki.setText(SOURCE_STATE_TIDDLER, null, null,
			this._sourceShowing ? "yes" : "no");
	}

	setText(text, type) {
		// Only update for wikitext content; other types are not supported by ProseMirror
		if(type && type !== "text/vnd.tiddlywiki") {
			return;
		}
		if(this.view && !this.view.hasFocus()) {
			this.updateDomNodeText(text);
		}
	}

	updateDomNodeText(text) {
		if(!this.view) return;
		try {
			const wikiAst = $tw.wiki.parseText(null, text || "").tree;
			const pmDoc = wikiAstToProseMirrorAst(wikiAst);
			const newDoc = this.schema.nodeFromJSON(pmDoc);
			const state = EditorState.create({
				doc: newDoc,
				plugins: this.view.state.plugins
			});
			this.view.updateState(state);
		} catch(e) {
			console.error("[ProseMirror] Error updating content:", e);
		}
	}

	getText() {
		if(!this.view) return "";
		try {
			const content = this.view.state.doc.toJSON();
			const wikiAst = wikiAstFromProseMirrorAst(content);
			return $tw.utils.serializeWikitextParseTree(wikiAst);
		} catch(e) {
			console.error("[ProseMirror] Error serializing content:", e);
			return this.value || "";
		}
	}

	fixHeight() {
		if(!this.domNode) return;
		if(this.widget.editAutoHeight) {
			this.domNode.style.height = "";
			this.domNode.style.overflow = "";
		} else {
			let fixedHeight = parseInt(this.widget.wiki.getTiddlerText(HEIGHT_VALUE_TITLE, "400px"), 10);
			fixedHeight = Math.max(fixedHeight, 100);
			this.domNode.style.height = fixedHeight + "px";
			this.domNode.style.overflow = "auto";
		}
	}

	focus() {
		if(this.view) {
			this.view.focus();
		}
	}

	createTextOperation() {
		if(!this.view) return null;
		const text = this.getText();
		const sel = this.view.state.selection;
		let selStart = 0;
		let selEnd = text.length;
		if(sel instanceof TextSelection && sel.$from.parent === sel.$to.parent) {
			try {
				const beforeSlice = this.view.state.doc.slice(0, sel.from);
				const beforeText = this._serializeSlice(beforeSlice);
				selStart = beforeText.length;
				selEnd = selStart + (sel.to - sel.from);
				if(selEnd > text.length) selEnd = text.length;
			} catch(e) {
				selStart = 0;
				selEnd = text.length;
			}
		}
		return {
			text,
			selStart,
			selEnd,
			selection: text.substring(selStart, selEnd),
			cutStart: null,
			cutEnd: null,
			replacement: null,
			newSelStart: null,
			newSelEnd: null
		};
	}

	executeTextOperation(operation) {
		let newText = operation.text;
		if(operation.replacement !== null) {
			newText = operation.text.substring(0, operation.cutStart) + operation.replacement + operation.text.substring(operation.cutEnd);
		}
		this.updateDomNodeText(newText);
		this.focus();
		return newText;
	}

	_serializeSlice(slice) {
		try {
			const fragment = slice.content;
			const tempDoc = this.schema.nodes.doc.create(null, fragment);
			const json = tempDoc.toJSON();
			const wikiAst = wikiAstFromProseMirrorAst(json);
			return $tw.utils.serializeWikitextParseTree(wikiAst);
		} catch(e) {
			return "";
		}
	}

	getPragmaPreamble() {
		if(!this.view || !this.view.state) return "";
		const parts = [];
		this.view.state.doc.forEach((node) => {
			if(node.type.name === "pragma_block" && node.attrs.rawText) {
				parts.push(node.attrs.rawText);
			}
		});
		return parts.length > 0 ? parts.join("\n") + "\n" : "";
	}

	handleImagePickedNodeView(event) {
		const paramObj = event && event.paramObject;
		const nodeviewId = paramObj && (paramObj.nodeviewId || paramObj.nodeViewId);
		const pickedTitle = paramObj && paramObj.imageTitle;
		if(!nodeviewId || !pickedTitle || !this.view) return true;
		for(const el of this.view.dom.querySelectorAll(".pm-image-nodeview")) {
			const nodeview = el._imageNodeView;
			if(nodeview && typeof nodeview._getNodeViewId === "function" && nodeview._getNodeViewId() === nodeviewId) {
				if(typeof nodeview.handleImagePicked === "function") {
					nodeview.handleImagePicked(pickedTitle);
					return false;
				}
			}
		}
		return true;
	}

	handleTextOperationNatively(event) {
		if(!this.view) return false;
		const { param, paramObject: paramObj = {} } = event;
		const { schema, view } = this;
		const { state } = view;
		const dispatch = view.dispatch.bind(view);

		// --- wrap-selection: inline mark toggles ---
		if(param === "wrap-selection") {
			const markName = this._wrapSelectionToMark(paramObj.prefix, paramObj.suffix);
			if(markName && schema.marks[markName]) {
				pmCommands.toggleMark(schema.marks[markName])(state, dispatch);
				view.focus();
				return true;
			}
			if(paramObj.prefix === "[[" && paramObj.suffix === "]]") {
				return this._handleMakeLink(event);
			}
			return false;
		}

		// --- prefix-lines: heading levels ---
		if(param === "prefix-lines" && paramObj.character === "!") {
			const level = parseInt(paramObj.count, 10) || 1;
			if(level >= 1 && level <= 6 && schema.nodes.heading) {
				const currentNode = state.selection.$from.parent;
				if(currentNode.type === schema.nodes.heading && currentNode.attrs.level === level) {
					pmCommands.setBlockType(schema.nodes.paragraph)(state, dispatch);
				} else {
					pmCommands.setBlockType(schema.nodes.heading, { level })(state, dispatch);
				}
				view.focus();
				return true;
			}
		}

		// --- prefix-lines: bullet list ---
		if(param === "prefix-lines" && paramObj.character === "*" && schema.nodes.list) {
			flatListCommands.createWrapInListCommand({ kind: "bullet" })(state, dispatch);
			view.focus();
			return true;
		}

		// --- prefix-lines: ordered list ---
		if(param === "prefix-lines" && paramObj.character === "#" && schema.nodes.list) {
			flatListCommands.createWrapInListCommand({ kind: "ordered" })(state, dispatch);
			view.focus();
			return true;
		}

		// --- wrap-lines: code block ---
		if(param === "wrap-lines" && paramObj.prefix === "```" && paramObj.suffix === "```" && schema.nodes.code_block) {
			const currentNode = state.selection.$from.parent;
			if(currentNode.type === schema.nodes.code_block) {
				pmCommands.setBlockType(schema.nodes.paragraph)(state, dispatch);
			} else {
				pmCommands.setBlockType(schema.nodes.code_block)(state, dispatch);
			}
			view.focus();
			return true;
		}

		// --- wrap-lines: blockquote ---
		if(param === "wrap-lines" && paramObj.prefix === "<<<" && paramObj.suffix === "<<<" && schema.nodes.blockquote) {
			const $from = state.selection.$from;
			let insideBlockquote = false;
			for(let d = $from.depth; d > 0; d--) {
				if($from.node(d).type === schema.nodes.blockquote) {
					pmCommands.lift(state, dispatch);
					view.focus();
					insideBlockquote = true;
					break;
				}
			}
			if(!insideBlockquote) {
				pmCommands.wrapIn(schema.nodes.blockquote)(state, dispatch);
				view.focus();
			}
			return true;
		}

		// --- make-link ---
		if(param === "make-link") return this._handleMakeLink(event);

		// --- insert-text ---
		if(param === "insert-text" && paramObj.text !== undefined) {
			view.dispatch(state.tr.insertText(paramObj.text));
			view.focus();
			return true;
		}

		// --- replace-selection ---
		if(param === "replace-selection" && paramObj.text !== undefined) {
			view.dispatch(state.tr.replaceSelectionWith(schema.text(paramObj.text), false));
			view.focus();
			return true;
		}

		// --- replace-all ---
		if(param === "replace-all" && paramObj.text !== undefined) {
			this.updateDomNodeText(paramObj.text);
			view.focus();
			return true;
		}

		// --- focus-editor ---
		if(param === "focus-editor") {
			view.focus();
			return true;
		}

		// --- toggle-source ---
		if(param === "toggle-source") {
			this.toggleSourcePanel();
			return true;
		}

		return false;
	}

	_wrapSelectionToMark(prefix, suffix) {
		if(!prefix || !suffix || prefix !== suffix) return null;
		const markMap = {
			"''": "strong",
			"//": "em",
			"__": "underline",
			"~~": "strike",
			"^^": "superscript",
			",,": "subscript",
			"`": "code"
		};
		return markMap[prefix] || null;
	}

	_handleMakeLink(event) {
		const paramObj = event.paramObject || {};
		const { view, schema } = this;
		const { state } = view;
		if(!schema.marks.link) return false;

		const linkTarget = paramObj.text || "";
		const sel = state.selection;

		if(linkTarget && !sel.empty) {
			const linkMark = schema.marks.link.create({ href: linkTarget, title: linkTarget });
			view.dispatch(state.tr.addMark(sel.from, sel.to, linkMark));
			view.focus();
			return true;
		}
		if(linkTarget && sel.empty) {
			const linkMark = schema.marks.link.create({ href: linkTarget, title: linkTarget });
			const linkText = schema.text(linkTarget, [linkMark]);
			view.dispatch(state.tr.replaceSelectionWith(linkText, false));
			view.focus();
			return true;
		}
		return false;
	}

	destroy() {
		if(this.debouncedSave && this.debouncedSave.flush) {
			this.debouncedSave.flush();
		}
		if(this.bubbleMenu) {
			this.bubbleMenu.destroy();
			this.bubbleMenu = null;
		}
		if(this.slashMenuUI) {
			this.slashMenuUI.destroy();
			this.slashMenuUI = null;
		}
		if(this.view) {
			this.view.destroy();
			this.view = null;
		}
	}
}

exports.ProseMirrorEngine = $tw.browser ? ProseMirrorEngine : require("$:/core/modules/editor/engines/simple.js").SimpleEngine;
exports.buildSchema = buildSchema;
