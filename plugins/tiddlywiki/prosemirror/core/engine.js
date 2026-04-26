/*\
title: $:/plugins/tiddlywiki/prosemirror/core/engine.js
type: application/javascript
module-type: library

ProseMirror text editor engine for the editTextWidgetFactory.
Implements the engine interface required by $:/core/modules/editor/factory.js.

\*/

"use strict";

const HEIGHT_VALUE_TITLE = "$:/config/TextEditor/EditorHeight/Height";

const wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;
const wikiAstToProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js").to;
const { buildSchema } = require("$:/plugins/tiddlywiki/prosemirror/core/schema.js");
const { buildPlugins, SlashMenuUI } = require("$:/plugins/tiddlywiki/prosemirror/core/plugin-list.js");
const { handleTextOperation } = require("$:/plugins/tiddlywiki/prosemirror/core/text-operations.js");
const { SourcePanel } = require("$:/plugins/tiddlywiki/prosemirror/core/source-panel.js");

const { EditorState, TextSelection } = require("prosemirror-state");
const { EditorView } = require("prosemirror-view");
const { debounce } = require("$:/core/modules/utils/debounce.js");

class ProseMirrorEngine {
	constructor(options) {
		this.widget = options.widget;
		this.value = options.value;
		this.type = options.type || "text/vnd.tiddlywiki";
		this.parentNode = options.parentNode;
		this.nextSibling = options.nextSibling;
		this.wiki = this.widget.wiki;
		this.variables = this.widget.variables || {};
		this.saveLock = false;
		this.imagePickerOpen = false;

		this._buildDOM();
		this.schema = buildSchema();

		const doc = this._parseInitialDoc();

		this.debouncedSave = debounce(() => {
			const text = this.getText();
			this.widget.saveChanges(text);
			this.sourcePanel.syncFromEditor();
		}, 300);

		this._createEditorView(doc);
		this._attachEventHandlers();

		this.slashMenuUI = new SlashMenuUI(this.view, { clickable: true });

		this.sourcePanel = new SourcePanel(this);

		if(this.widget.addEventListener) {
			this.widget.addEventListener("tm-prosemirror-image-picked-nodeview", (event) => this.handleImagePickedNodeView(event));
			this.widget.addEventListener("tm-prosemirror-toggle-source", () => {
				this.toggleSourcePanel();
				return true;
			});
		}
	}

	_buildDOM() {
		this.domNode = document.createElement("div");
		this.domNode.className = "tc-prosemirror-wrapper";
		if(this.widget.editClass) {
			this.domNode.className += " " + this.widget.editClass;
		}

		const container = document.createElement("div");
		container.className = "tc-prosemirror-container";
		this._mount = document.createElement("div");
		this._mount.className = "tc-prosemirror-mount";
		container.appendChild(this._mount);
		this.domNode.appendChild(container);
		this._container = container;

		this.parentNode.insertBefore(this.domNode, this.nextSibling);
		this.widget.domNodes.push(this.domNode);
	}

	_parseInitialDoc() {
		try {
			const initialWikiAst = this.wiki.parseText(this.type, this.value || "", {
				defaultType: "text/vnd.tiddlywiki"
			}).tree;
			return wikiAstToProseMirrorAst(initialWikiAst);
		} catch(e) {
			console.error("[ProseMirror] Error parsing initial content:", e);
			return { type: "doc", content: [{ type: "paragraph" }] };
		}
	}

	_createEditorView(doc) {
		const plugins = buildPlugins(this.schema, this.widget.wiki, this);

		this.view = new EditorView(this._mount, {
			state: EditorState.create({
				doc: this.schema.nodeFromJSON(doc),
				plugins
			}),
			dispatchTransaction: (transaction) => {
				const newState = this.view.state.apply(transaction);
				this.view.updateState(newState);
				if(this.slashMenuUI) this.slashMenuUI.checkState();
				if(transaction.docChanged) this.debouncedSave();
			}
		});
	}

	_attachEventHandlers() {
		this.view.dom.addEventListener("paste", (event) => {
			event.twEditor = true;
			event.stopPropagation();
		});
		this.view.dom.addEventListener("keydown", (event) => {
			event.twEditor = true;
			if(!event.defaultPrevented && this.widget.handleKeydownEvent) {
				this.widget.handleKeydownEvent(event);
			}
			event.stopPropagation();
		});
		this._container.setAttribute("data-tw-prosemirror-keycapture", "yes");
	}

	get parentWidget() { return this.widget; }

	addEventListener(type, handler) {
		if(this.widget && this.widget.addEventListener) {
			this.widget.addEventListener(type, handler);
		}
	}

	getAncestorCount() {
		return (this.widget && typeof this.widget.getAncestorCount === "function")
			? this.widget.getAncestorCount() : 0;
	}

	getVariable(name, options) {
		return (this.widget && typeof this.widget.getVariable === "function")
			? this.widget.getVariable(name, options) : undefined;
	}

	dispatchEvent(event) {
		return (this.widget && typeof this.widget.dispatchEvent === "function")
			? this.widget.dispatchEvent(event) : true;
	}

	// eslint-disable-next-line class-methods-use-this
	makeChildWidgets() {}

	toggleSourcePanel() {
		this.sourcePanel.toggle();
	}

	setText(text, type) {
		if(type && type !== "text/vnd.tiddlywiki") return;
		if(this.view && !this.view.hasFocus()) {
			this.updateDomNodeText(text);
		}
	}

	updateDomNodeText(text) {
		if(!this.view) return;
		try {
			const wikiAst = this.wiki.parseText(this.type, text || "", {
				defaultType: "text/vnd.tiddlywiki"
			}).tree;
			const pmDoc = wikiAstToProseMirrorAst(wikiAst);
			const newDoc = this.schema.nodeFromJSON(pmDoc);
			const state = EditorState.create({ doc: newDoc, plugins: this.view.state.plugins });
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
		if(this.sourcePanel && this.sourcePanel.syncWithPreviewState) {
			this.sourcePanel.syncWithPreviewState();
		}
		if(this.view) this.view.focus();
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
		return { text, selStart, selEnd, selection: text.substring(selStart, selEnd),
			cutStart: null, cutEnd: null, replacement: null, newSelStart: null, newSelEnd: null };
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

	handleTextOperationNatively(event) {
		return handleTextOperation(this, event);
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
		for(const el of this.view.dom.querySelectorAll(".pm-nodeview-image")) {
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

	destroy() {
		if(this.sourcePanel && this.sourcePanel.flushPendingSync) this.sourcePanel.flushPendingSync();
		if(this.sourcePanel && this.sourcePanel.destroy) this.sourcePanel.destroy();
		if(this.debouncedSave && this.debouncedSave.flush) this.debouncedSave.flush();
		if(this.slashMenuUI) { this.slashMenuUI.destroy(); this.slashMenuUI = null; }
		if(this.view) { this.view.destroy(); this.view = null; }
	}
}

exports.ProseMirrorEngine = $tw.browser ? ProseMirrorEngine : require("$:/core/modules/editor/engines/simple.js").SimpleEngine;
exports.buildSchema = buildSchema;
