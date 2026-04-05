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
 * ProseMirrorEngine constructor — implements the factory engine interface.
 */
function ProseMirrorEngine(options) {
	var self = this;
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

	var container = document.createElement("div");
	container.className = "tc-prosemirror-container";
	var mount = document.createElement("div");
	mount.className = "tc-prosemirror-mount";
	container.appendChild(mount);
	this.domNode.appendChild(container);

	// Insert into DOM
	this.parentNode.insertBefore(this.domNode, this.nextSibling);
	this.widget.domNodes.push(this.domNode);

	// Build schema
	this.schema = buildSchema();

	// Parse initial content
	var doc;
	try {
		var initialWikiAst = $tw.wiki.parseText(null, this.value || "").tree;
		doc = wikiAstToProseMirrorAst(initialWikiAst);
	} catch(e) {
		console.error("[ProseMirror] Error parsing initial content:", e);
		doc = { type: "doc", content: [{ type: "paragraph" }] };
	}

	// Build plugins — nodeViews receive `this` as their parentWidget context.
	// We bridge engine → factory widget so that sub-widgets render correctly.
	var listKeymapPlugin = keymap(listKeymap);
	var listPlugins = createListPlugins({ schema: this.schema });
	var allMenuElements = getAllMenuElements(this.widget.wiki, this.schema);

	// Debounced save — each engine instance gets its own.
	// Also keeps source textarea in sync if visible.
	this.debouncedSave = debounce(function() {
		var text = self.getText();
		self.widget.saveChanges(text);
		if(self._sourceShowing && self._sourceTextarea && document.activeElement !== self._sourceTextarea) {
			self._sourceTextarea.value = text;
		}
	}, 300);

	// nodeViewHost is what nodeview plugins receive as "parentWidget".
	// It provides wiki, variables, getPragmaPreamble, addEventListener, etc.
	// We use the engine itself since it already has wiki/variables, but delegate
	// addEventListener to the real factory widget for message dispatching.
	var nodeViewHost = this;

	// Bridge addEventListener so nodeViews can register TW message handlers
	this.addEventListener = function(type, handler) {
		if(self.widget && self.widget.addEventListener) {
			self.widget.addEventListener(type, handler);
		}
	};

	// Bridge Widget interface methods so nodeViews can create child widgets
	// that walk the parent chain correctly (getAncestorCount, getVariable, etc.)
	this.getAncestorCount = function() {
		if(self.widget && typeof self.widget.getAncestorCount === "function") {
			return self.widget.getAncestorCount();
		}
		return 0;
	};
	this.getVariable = function(name, options) {
		if(self.widget && typeof self.widget.getVariable === "function") {
			return self.widget.getVariable(name, options);
		}
		return undefined;
	};
	this.dispatchEvent = function(event) {
		if(self.widget && typeof self.widget.dispatchEvent === "function") {
			return self.widget.dispatchEvent(event);
		}
		return true;
	};
	this.makeChildWidgets = function() {};
	this.parentWidget = self.widget;

	// Create EditorView
	var tablePlugins = [];
	if(pmTables && this.schema.nodes.table) {
		tablePlugins.push(pmTables.columnResizing());
		tablePlugins.push(pmTables.tableEditing());
		tablePlugins.push(keymap({
			"Tab": pmTables.goToNextCell(1),
			"Shift-Tab": pmTables.goToNextCell(-1)
		}));
	}

	// Markdown-style input rules (optional, controlled by config tiddler)
	var mdRules = getMarkdownInputRules(this.widget.wiki, this.schema);
	var mdPlugin = mdRules.length > 0 ? [inputRules({ rules: mdRules })] : [];

	this.view = new EditorView(mount, {
		state: EditorState.create({
			doc: this.schema.nodeFromJSON(doc),
			plugins: [
				SlashMenuPlugin(allMenuElements, {
					triggerCodes: ["Slash", "Backslash"]
				}),
				createImageBlockPlugin(),
				createImageNodeViewPlugin(nodeViewHost),
				listKeymapPlugin,
				placeholderPlugin({
					text: this.widget.wiki.getTiddlerText("$:/config/prosemirror/placeholder", "Type / for commands")
				}),
				createWidgetBlockPlugin(),
				createWidgetBlockNodeViewPlugin(nodeViewHost),
				createPragmaBlockNodeViewPlugin(nodeViewHost),
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
		dispatchTransaction: function(transaction) {
			var newState = self.view.state.apply(transaction);
			self.view.updateState(newState);
			if(self.slashMenuUI) {
				self.slashMenuUI.checkState();
			}
			// Update bubble menu position/visibility on every state change
			if(self.bubbleMenu) {
				self.bubbleMenu.update(self.view);
			}
			// Only save when the document actually changed, not on pure selection moves
			if(transaction.docChanged) {
				self.debouncedSave();
			}
		}
	});

	// Mark events so TW handlers don't hijack them
	this.view.dom.addEventListener("paste", function(event) {
		event.twEditor = true;
		event.stopPropagation();
	});
	// For keydown: let ProseMirror handle the event first (via keymap plugins),
	// then forward unhandled events to the factory widget for toolbar shortcuts.
	// Finally stop propagation so TiddlyWiki/document handlers don't interfere.
	this.view.dom.addEventListener("keydown", function(event) {
		event.twEditor = true;
		// If ProseMirror already handled it, don't forward to factory toolbar
		if(!event.defaultPrevented && self.widget.handleKeydownEvent) {
			self.widget.handleKeydownEvent(event);
		}
		event.stopPropagation();
	});
	container.setAttribute("data-tw-prosemirror-keycapture", "yes");

	// SlashMenu UI
	this.slashMenuUI = new SlashMenuUI(this.view, { clickable: true });

	// Bubble Menu (floating toolbar on text selection)
	this.bubbleMenu = new BubbleMenu(this.view, this.schema);

	// "Add new line" button
	var addLineWrap = document.createElement("div");
	addLineWrap.className = "tc-prosemirror-addline";
	var addLineBtn = document.createElement("button");
	addLineBtn.type = "button";
	addLineBtn.className = "tc-prosemirror-addline-btn";
	addLineBtn.textContent = this.widget.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/AddNewLine", "+ new line");
	addLineBtn.setAttribute("contenteditable", "false");
	addLineBtn.addEventListener("mousedown", function(e) { e.preventDefault(); e.stopPropagation(); }, true);
	addLineBtn.addEventListener("click", function() {
		if(!self.view) return;
		var state = self.view.state;
		var endPos = state.doc.content.size;
		var para = state.schema.nodes.paragraph && state.schema.nodes.paragraph.createAndFill();
		if(!para) { self.view.focus(); return; }
		var tr = state.tr.insert(endPos, para);
		tr = tr.setSelection(TextSelection.atEnd(tr.doc));
		self.view.dispatch(tr.scrollIntoView());
		self.view.focus();
	});
	addLineWrap.appendChild(addLineBtn);

	// --- Source code panel (side-by-side wikitext source view) ---
	var SOURCE_STATE_TIDDLER = "$:/state/prosemirror/show-source";
	this._sourcePanel = null;
	this._sourceTextarea = null;
	this._sourceShowing = false;

	var sourcePanel = document.createElement("div");
	sourcePanel.className = "tc-prosemirror-source-panel";
	sourcePanel.style.display = "none";
	var sourceLabel = document.createElement("div");
	sourceLabel.className = "tc-prosemirror-source-label";
	sourceLabel.textContent = self.widget.wiki.getTiddlerText(
		"$:/plugins/tiddlywiki/prosemirror/language/SourcePanel/Title", "WikiText Source");
	var sourceTextarea = document.createElement("textarea");
	sourceTextarea.className = "tc-prosemirror-source-textarea tc-edit-texteditor";
	sourceTextarea.spellcheck = false;
	sourcePanel.appendChild(sourceLabel);
	sourcePanel.appendChild(sourceTextarea);
	this._sourcePanel = sourcePanel;
	this._sourceTextarea = sourceTextarea;

	// When source textarea changes, update PM (debounced)
	var debouncedSourceSync = debounce(function() {
		if(!self._sourceShowing || !self.view) return;
		self.updateDomNodeText(sourceTextarea.value);
	}, 500);
	sourceTextarea.addEventListener("input", function() {
		debouncedSourceSync();
	});

	// Public method to toggle source panel visibility
	this.toggleSourcePanel = function() {
		self._sourceShowing = !self._sourceShowing;
		if(self._sourceShowing) {
			// Sync current PM content to source textarea
			sourceTextarea.value = self.getText();
			sourcePanel.style.display = "";
			self.domNode.classList.add("tc-prosemirror-source-active");
		} else {
			// Sync source back to PM if modified
			if(self.view && sourceTextarea.value !== self.getText()) {
				self.updateDomNodeText(sourceTextarea.value);
				self.widget.saveChanges(sourceTextarea.value);
			}
			sourcePanel.style.display = "none";
			self.domNode.classList.remove("tc-prosemirror-source-active");
		}
		// Persist state
		self.widget.wiki.setText(SOURCE_STATE_TIDDLER, null, null,
			self._sourceShowing ? "yes" : "no");
	};

	// Check if source panel should be open on load
	if(self.widget.wiki.getTiddlerText(SOURCE_STATE_TIDDLER) === "yes") {
		self._sourceShowing = true;
		sourceTextarea.value = self.getText();
		sourcePanel.style.display = "";
		self.domNode.classList.add("tc-prosemirror-source-active");
	}

	// Append source panel to wrapper
	this.domNode.appendChild(sourcePanel);

	// Attach after ProseMirror-menu wraps the DOM
	setTimeout(function() {
		try {
			var host = self.view && self.view.dom && self.view.dom.parentNode;
			(host || self.domNode).appendChild(addLineWrap);
		} catch(e) { /* ignore */ }
	}, 0);

	// Register TW message handlers for image picking on the factory widget
	// Image nodeviews send tm-prosemirror-image-picked-nodeview via action widgets
	if(this.widget.addEventListener) {
		this.widget.addEventListener("tm-prosemirror-image-picked-nodeview", function(event) {
			return self.handleImagePickedNodeView(event);
		});
		this.widget.addEventListener("tm-prosemirror-toggle-source", function() {
			self.toggleSourcePanel();
			return true;
		});
	}
}

/*
Set the text of the engine if it doesn't currently have focus
*/
ProseMirrorEngine.prototype.setText = function(text, type) {
	// Only update for wikitext content; other types are not supported by ProseMirror
	if(type && type !== "text/vnd.tiddlywiki") {
		return;
	}
	if(this.view && !this.view.hasFocus()) {
		this.updateDomNodeText(text);
	}
};

/*
Update the DomNode with new text (re-parse and load into ProseMirror)
*/
ProseMirrorEngine.prototype.updateDomNodeText = function(text) {
	if(!this.view) return;
	try {
		var wikiAst = $tw.wiki.parseText(null, text || "").tree;
		var pmDoc = wikiAstToProseMirrorAst(wikiAst);
		var newDoc = this.schema.nodeFromJSON(pmDoc);
		var state = EditorState.create({
			doc: newDoc,
			plugins: this.view.state.plugins
		});
		this.view.updateState(state);
	} catch(e) {
		console.error("[ProseMirror] Error updating content:", e);
	}
};

/*
Get the text of the engine (serialize ProseMirror doc to wikitext)
*/
ProseMirrorEngine.prototype.getText = function() {
	if(!this.view) return "";
	try {
		var content = this.view.state.doc.toJSON();
		var wikiAst = wikiAstFromProseMirrorAst(content);
		return $tw.utils.serializeWikitextParseTree(wikiAst);
	} catch(e) {
		console.error("[ProseMirror] Error serializing content:", e);
		return this.value || "";
	}
};

/*
Fix the height of the editor to fit content
*/
ProseMirrorEngine.prototype.fixHeight = function() {
	if(!this.domNode) return;
	if(this.widget.editAutoHeight) {
		// Auto height — let ProseMirror grow naturally
		this.domNode.style.height = "";
		this.domNode.style.overflow = "";
	} else {
		var fixedHeight = parseInt(this.widget.wiki.getTiddlerText(HEIGHT_VALUE_TITLE, "400px"), 10);
		fixedHeight = Math.max(fixedHeight, 100);
		this.domNode.style.height = fixedHeight + "px";
		this.domNode.style.overflow = "auto";
	}
};

/*
Focus the engine node
*/
ProseMirrorEngine.prototype.focus = function() {
	if(this.view) {
		this.view.focus();
	}
};

/*
Create a blank structure representing a text operation.
ProseMirror operates on structured content, not raw text, so we bridge
by serializing the document and mapping the selection positions.
*/
ProseMirrorEngine.prototype.createTextOperation = function() {
	if(!this.view) return null;
	var text = this.getText();
	var sel = this.view.state.selection;
	// Map ProseMirror positions to approximate wikitext character positions
	// This is a rough approximation — structural editors don't have 1:1 char mapping
	var selStart = 0;
	var selEnd = text.length;
	// For simple text selections in a single paragraph, we can be more precise
	if(sel instanceof TextSelection && sel.$from.parent === sel.$to.parent) {
		// Get the text before the selection start by serializing up to that point
		try {
			var beforeSlice = this.view.state.doc.slice(0, sel.from);
			var beforeText = this._serializeSlice(beforeSlice);
			selStart = beforeText.length;
			selEnd = selStart + (sel.to - sel.from);
			if(selEnd > text.length) selEnd = text.length;
		} catch(e) {
			// Fallback to full selection
			selStart = 0;
			selEnd = text.length;
		}
	}
	return {
		text: text,
		selStart: selStart,
		selEnd: selEnd,
		selection: text.substring(selStart, selEnd),
		cutStart: null,
		cutEnd: null,
		replacement: null,
		newSelStart: null,
		newSelEnd: null
	};
};

/*
Execute a text operation.
Since ProseMirror is structural, we re-parse the modified text entirely.
*/
ProseMirrorEngine.prototype.executeTextOperation = function(operation) {
	var newText = operation.text;
	if(operation.replacement !== null) {
		newText = operation.text.substring(0, operation.cutStart) + operation.replacement + operation.text.substring(operation.cutEnd);
	}
	// Re-load the modified text into ProseMirror
	this.updateDomNodeText(newText);
	this.focus();
	return newText;
};

/*
Helper: serialize a ProseMirror Slice to wikitext (for position mapping).
*/
ProseMirrorEngine.prototype._serializeSlice = function(slice) {
	try {
		var fragment = slice.content;
		var tempDoc = this.schema.nodes.doc.create(null, fragment);
		var json = tempDoc.toJSON();
		var wikiAst = wikiAstFromProseMirrorAst(json);
		return $tw.utils.serializeWikitextParseTree(wikiAst);
	} catch(e) {
		return "";
	}
};

/**
 * Collect all pragma_block rawTexts from the current document.
 */
ProseMirrorEngine.prototype.getPragmaPreamble = function() {
	if(!this.view || !this.view.state) return "";
	var parts = [];
	this.view.state.doc.forEach(function(node) {
		if(node.type.name === "pragma_block" && node.attrs.rawText) {
			parts.push(node.attrs.rawText);
		}
	});
	return parts.length > 0 ? parts.join("\n") + "\n" : "";
};

/**
 * Handle image-picked-nodeview event from sub-widget message bubbling.
 */
ProseMirrorEngine.prototype.handleImagePickedNodeView = function(event) {
	var paramObj = event && event.paramObject;
	var nodeviewId = paramObj && (paramObj.nodeviewId || paramObj.nodeViewId);
	var pickedTitle = paramObj && paramObj.imageTitle;
	if(!nodeviewId || !pickedTitle || !this.view) return true;
	var imageNodeViewEls = this.view.dom.querySelectorAll(".pm-image-nodeview");
	for(var i = 0; i < imageNodeViewEls.length; i++) {
		var el = imageNodeViewEls[i];
		var nodeview = el._imageNodeView;
		if(nodeview && typeof nodeview._getNodeViewId === "function" && nodeview._getNodeViewId() === nodeviewId) {
			if(typeof nodeview.handleImagePicked === "function") {
				nodeview.handleImagePicked(pickedTitle);
				return false;
			}
		}
	}
	return true;
};

/*
Handle a toolbar operation natively using ProseMirror commands.
Returns true if the operation was handled, false to fall back to text-level operations.
This preserves PM undo history and structural editing.
*/
ProseMirrorEngine.prototype.handleTextOperationNatively = function(event) {
	if(!this.view) return false;
	var param = event.param;
	var paramObj = event.paramObject || {};
	var schema = this.schema;
	var view = this.view;
	var state = view.state;
	var dispatch = view.dispatch.bind(view);

	// --- wrap-selection: inline mark toggles ---
	if(param === "wrap-selection") {
		var markName = this._wrapSelectionToMark(paramObj.prefix, paramObj.suffix);
		if(markName && schema.marks[markName]) {
			pmCommands.toggleMark(schema.marks[markName])(state, dispatch);
			view.focus();
			return true;
		}
		// wrap-selection for link [[...]] → prompt for link target
		if(paramObj.prefix === "[[" && paramObj.suffix === "]]") {
			return this._handleMakeLink(event);
		}
		return false;
	}

	// --- prefix-lines: heading levels ---
	if(param === "prefix-lines" && paramObj.character === "!") {
		var level = parseInt(paramObj.count, 10) || 1;
		if(level >= 1 && level <= 6 && schema.nodes.heading) {
			// Toggle: if already this heading level, convert back to paragraph
			var currentNode = state.selection.$from.parent;
			if(currentNode.type === schema.nodes.heading && currentNode.attrs.level === level) {
				pmCommands.setBlockType(schema.nodes.paragraph)(state, dispatch);
			} else {
				pmCommands.setBlockType(schema.nodes.heading, { level: level })(state, dispatch);
			}
			view.focus();
			return true;
		}
	}

	// --- prefix-lines: bullet list ---
	if(param === "prefix-lines" && paramObj.character === "*") {
		if(schema.nodes.list) {
			var bulletCmd = flatListCommands.createWrapInListCommand({ kind: "bullet" });
			bulletCmd(state, dispatch);
			view.focus();
			return true;
		}
	}

	// --- prefix-lines: ordered list ---
	if(param === "prefix-lines" && paramObj.character === "#") {
		if(schema.nodes.list) {
			var orderedCmd = flatListCommands.createWrapInListCommand({ kind: "ordered" });
			orderedCmd(state, dispatch);
			view.focus();
			return true;
		}
	}

	// --- wrap-lines: code block ---
	if(param === "wrap-lines" && paramObj.prefix === "```" && paramObj.suffix === "```") {
		if(schema.nodes.code_block) {
			// Toggle: if already in code_block, convert to paragraph
			var currentNode = state.selection.$from.parent;
			if(currentNode.type === schema.nodes.code_block) {
				pmCommands.setBlockType(schema.nodes.paragraph)(state, dispatch);
			} else {
				pmCommands.setBlockType(schema.nodes.code_block)(state, dispatch);
			}
			view.focus();
			return true;
		}
	}

	// --- wrap-lines: blockquote ---
	if(param === "wrap-lines" && paramObj.prefix === "<<<" && paramObj.suffix === "<<<") {
		if(schema.nodes.blockquote) {
			// Toggle: if already in blockquote, lift out; otherwise wrap in
			var $from = state.selection.$from;
			for(var d = $from.depth; d > 0; d--) {
				if($from.node(d).type === schema.nodes.blockquote) {
					pmCommands.lift(state, dispatch);
					view.focus();
					return true;
				}
			}
			pmCommands.wrapIn(schema.nodes.blockquote)(state, dispatch);
			view.focus();
			return true;
		}
	}

	// --- make-link: create a wikitext link ---
	if(param === "make-link") {
		return this._handleMakeLink(event);
	}

	// --- insert-text ---
	if(param === "insert-text" && paramObj.text !== undefined) {
		var tr = state.tr.insertText(paramObj.text);
		view.dispatch(tr);
		view.focus();
		return true;
	}

	// --- replace-selection ---
	if(param === "replace-selection" && paramObj.text !== undefined) {
		var tr = state.tr.replaceSelectionWith(
			schema.text(paramObj.text),
			false
		);
		view.dispatch(tr);
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

	// --- toggle-source-panel ---
	if(param === "toggle-source") {
		if(this.toggleSourcePanel) {
			this.toggleSourcePanel();
		}
		return true;
	}

	// Not handled — fall back to text-level operation
	return false;
};

/*
Map TiddlyWiki wrap-selection prefix/suffix to ProseMirror mark names.
*/
ProseMirrorEngine.prototype._wrapSelectionToMark = function(prefix, suffix) {
	if(!prefix || !suffix || prefix !== suffix) return null;
	var markMap = {
		"''": "strong",
		"//": "em",
		"__": "underline",
		"~~": "strike",
		"^^": "superscript",
		",,": "subscript",
		"`": "code"
	};
	return markMap[prefix] || null;
};

/*
Handle make-link: add a link mark to the selection.
For ProseMirror, we add a link mark with the appropriate href.
*/
ProseMirrorEngine.prototype._handleMakeLink = function(event) {
	var paramObj = event.paramObject || {};
	var view = this.view;
	var state = view.state;
	var schema = this.schema;
	if(!schema.marks.link) return false;

	var linkTarget = paramObj.text || "";
	var sel = state.selection;

	// If there's selected text and a link target, wrap it in a link mark
	if(linkTarget && !sel.empty) {
		var linkMark = schema.marks.link.create({ href: linkTarget, title: linkTarget });
		var tr = state.tr.addMark(sel.from, sel.to, linkMark);
		view.dispatch(tr);
		view.focus();
		return true;
	}
	// If just a target but no selection, insert [[target]]
	if(linkTarget && sel.empty) {
		var linkMark = schema.marks.link.create({ href: linkTarget, title: linkTarget });
		var linkText = schema.text(linkTarget, [linkMark]);
		var tr = state.tr.replaceSelectionWith(linkText, false);
		view.dispatch(tr);
		view.focus();
		return true;
	}
	return false;
};

/*
Destroy the engine
*/
ProseMirrorEngine.prototype.destroy = function() {
	// Flush pending save
	if(this.debouncedSave && this.debouncedSave.flush) {
		this.debouncedSave.flush();
	}
	// BubbleMenu cleanup
	if(this.bubbleMenu) {
		this.bubbleMenu.destroy();
		this.bubbleMenu = null;
	}
	// SlashMenu cleanup
	if(this.slashMenuUI) {
		this.slashMenuUI.destroy();
		this.slashMenuUI = null;
	}
	// EditorView cleanup
	if(this.view) {
		this.view.destroy();
		this.view = null;
	}
};

exports.ProseMirrorEngine = $tw.browser ? ProseMirrorEngine : require("$:/core/modules/editor/engines/simple.js").SimpleEngine;
exports.buildSchema = buildSchema;
