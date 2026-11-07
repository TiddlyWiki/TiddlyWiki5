/*\
title: $:/plugins/tiddlywiki/prosemirror/core/engine.js
type: application/javascript
module-type: library

ProseMirror text editor engine for the editTextWidgetFactory.
Implements the engine interface required by $:/core/modules/editor/factory.js.

\*/

"use strict";

const HEIGHT_VALUE_TITLE = "$:/config/TextEditor/EditorHeight/Height";

const { buildSchema } = require("$:/plugins/tiddlywiki/prosemirror/core/schema.js");
const { buildPlugins } = require("$:/plugins/tiddlywiki/prosemirror/core/plugin-list.js");
const { handleTextOperation } = require("$:/plugins/tiddlywiki/prosemirror/core/text-operations.js");
const {
	parseWikiTextToDoc,
	sourceTextToDoc,
	serializeDocJSON,
	getPragmaPreamble,
	applyExternalText: applySharedExternalText,
	rebuildEditorState
} = require("$:/plugins/tiddlywiki/prosemirror/core/editor-shared.js");
const { EditorState, TextSelection } = require("prosemirror-state");
const { EditorView } = require("prosemirror-view");

class ProseMirrorEngine {
	constructor(options) {
		this.widget = options.widget;
		this.value = options.value;
		this.type = options.type || "text/vnd.tiddlywiki";
		this.parentNode = options.parentNode;
		this.nextSibling = options.nextSibling;
		this.document = this.parentNode.ownerDocument || this.widget.document;
		this.wiki = this.widget.wiki;
		this.variables = this.widget.variables || {};
		this.pendingSavedText = null;
		this.pendingExternalText = null;
		this.pendingExternalType = null;
		this.lastSavedDocJSON = null;
		this.applyingExternalText = false;
		this.imagePickerOpen = false;
		this._pendingTimers = [];

		this._buildDOM();
		this.schema = buildSchema();

		const doc = this._parseInitialDoc();

		this._createEditorView(doc);
		this._attachEventHandlers();

		if(this.widget.addEventListener) {
			this._imagePickedHandler = (event) => this.handleImagePickedNodeView(event);
			this.widget.addEventListener("tm-prosemirror-image-picked-nodeview", this._imagePickedHandler);
		}
	}

	_buildDOM() {
		this.domNode = this.document.createElement("div");
		this.domNode.className = "tc-prosemirror-wrapper";
		if(this.widget.editClass) {
			this.domNode.className += " " + this.widget.editClass;
		}
		if(this.widget.editTabIndex) {
			this.domNode.setAttribute("tabindex", this.widget.editTabIndex);
		}

		const container = this.document.createElement("div");
		container.className = "tc-prosemirror-container";
		this._mount = this.document.createElement("div");
		this._mount.className = "tc-prosemirror-mount";
		container.appendChild(this._mount);
		this.domNode.appendChild(container);
		this._container = container;

		this.parentNode.insertBefore(this.domNode, this.nextSibling);
		this.widget.domNodes.push(this.domNode);

		// Delegate focus from the wrapper to the ProseMirror EditorView
		this._wrapperFocusHandler = (event) => {
			if(this.view && event.target === this.domNode) {
				this.view.focus();
			}
		};
		this.domNode.addEventListener("focus", this._wrapperFocusHandler);
	}

	_parseInitialDoc() {
		try {
			return parseWikiTextToDoc(this.wiki, this.type, this.value);
		} catch(e) {
			console.error("[ProseMirror] Error parsing initial content:", e);
			return sourceTextToDoc(this.value || "");
		}
	}

	_createEditorView(doc) {
		const plugins = buildPlugins(this.schema, this.widget.wiki, this, this.type);

		this.view = new EditorView(this._mount, {
			state: EditorState.create({
				doc: this.schema.nodeFromJSON(doc),
				plugins
			}),
			dispatchTransaction: (transaction) => {
				const newState = this.view.state.apply(transaction);
				this.view.updateState(newState);
				if(transaction.docChanged && !this.applyingExternalText && !this.handlingEditTextOperation) {
					this.clearPendingExternalText();
					this.saveCurrentText();
				}
			}
		});
	}

	_attachEventHandlers() {
		this._pasteHandler = (event) => {
			event.twEditor = true;
			event.stopPropagation();
		};
		this._keydownHandler = (event) => {
			event.twEditor = true;
			if(!event.defaultPrevented && this.widget.handleKeydownEvent) {
				this.widget.handleKeydownEvent(event);
			}
			event.stopPropagation();
		};
		this._blurHandler = () => this.scheduleApplyPendingExternalText();
		this._compositionEndHandler = () => this.scheduleApplyPendingExternalText();
		this.view.dom.addEventListener("paste", this._pasteHandler);
		this.view.dom.addEventListener("keydown", this._keydownHandler);
		this.view.dom.addEventListener("blur", this._blurHandler, true);
		this.view.dom.addEventListener("compositionend", this._compositionEndHandler, true);
		this._container.setAttribute("data-tw-prosemirror-keycapture", "yes");
	}

	scheduleApplyPendingExternalText() {
		const win = this.document.defaultView;
		if(!win) {
			this.applyPendingExternalText();
			return;
		}
		const id = win.setTimeout(() => {
			const index = this._pendingTimers.indexOf(id);
			if(index !== -1) {
				this._pendingTimers.splice(index, 1);
			}
			if(this.view) {
				this.applyPendingExternalText();
			}
		}, 0);
		this._pendingTimers.push(id);
	}

	saveCurrentText() {
		const text = this.getText();
		this.lastSavedDocJSON = this.view.state.doc.toJSON();
		if(text === (this.value || "")) {
			return;
		}
		this.clearPendingExternalText();
		this.pendingSavedText = text;
		this.value = text;
		this.widget.saveChanges(text);
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

	setText(text, type) {
		const previousType = this.type;
		const nextType = type || this.type;
		if(!this.view) {
			this.value = text;
			this.type = nextType;
			return;
		}
		const nextText = text || "";
		const previousText = this.value || "";
		const typeChanged = nextType !== previousType;
		const fromOwnSave = this.pendingSavedText !== null && nextText === this.pendingSavedText;
		this.pendingSavedText = null;

		// Skip if this is an echo of our own save or a metadata-only tiddler refresh
		if(fromOwnSave || (nextText === previousText && !typeChanged)) {
			this.value = nextText;
			this.type = nextType;
			return;
		}
		this.value = nextText;

		// Apply external changes immediately so all editor views share the same
		// wiki-backed document. Defer only while the browser is composing text.
		if(!this.view.composing) {
			this.type = nextType;
			this.applyExternalText(nextText);
		} else {
			this.pendingExternalText = nextText;
			this.pendingExternalType = nextType;
		}
	}

	clearPendingExternalText() {
		this.pendingExternalText = null;
		this.pendingExternalType = null;
	}

	applyPendingExternalText() {
		if(this.pendingExternalText === null || (this.view && this.view.composing)) {
			return;
		}
		let nextText = this.pendingExternalText;
		let nextType = this.pendingExternalType || this.type;
		if(this.widget && typeof this.widget.getEditInfo === "function") {
			const currentEditInfo = this.widget.getEditInfo();
			nextText = currentEditInfo.value;
			nextType = currentEditInfo.type;
		}
		this.clearPendingExternalText();
		this.type = nextType;
		this.applyExternalText(nextText);
	}

	/**
	 * Apply external text changes incrementally using ProseMirror's
	 * doc.replace(). Preserves undo history (one step), marks, and cursor.
	 */
	applyExternalText(text) {
		var self = this;
		applySharedExternalText(this, text, {
			onError: function() {
				self.updateDomNodeText(text);
			}
		});
	}

	/**
	 * Full rebuild from text. Used as fallback only (e.g. error recovery).
	 * WARNING: Loses undo history and empty paragraphs.
	 */
	updateDomNodeText(text) {
		rebuildEditorState(this, text);
	}

	getText() {
		if(!this.view) return "";
		try {
			return serializeDocJSON(this.view.state.doc.toJSON());
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
			this.domNode.style.minHeight = this.widget.editMinHeight || "";
		} else {
			let fixedHeight = parseInt(this.widget.wiki.getTiddlerText(HEIGHT_VALUE_TITLE, "400px"), 10);
			fixedHeight = Math.max(fixedHeight, 100);
			this.domNode.style.height = fixedHeight + "px";
			this.domNode.style.overflow = "auto";
		}
	}

	focus() {
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

	handleEditTextOperation(event) {
		this.handlingEditTextOperation = true;
		let result;
		try {
			result = handleTextOperation(this, event);
		} finally{
			this.handlingEditTextOperation = false;
		}
		if(result && this.view && this.view.state) {
			const text = this.getText();
			this.lastSavedDocJSON = this.view.state.doc.toJSON();
			this.pendingSavedText = text;
			this.value = text;
		}
		return result;
	}

	_serializeSlice(slice) {
		try {
			const fragment = slice.content;
			const tempDoc = this.schema.nodes.doc.create(null, fragment);
			return serializeDocJSON(tempDoc.toJSON());
		} catch(e) {
			return "";
		}
	}

	getPragmaPreamble() {
		return getPragmaPreamble(this.view);
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
		const win = this.document.defaultView;
		if(win) {
			this._pendingTimers.forEach((id) => win.clearTimeout(id));
		}
		this._pendingTimers.length = 0;
		if(this.widget && this._imagePickedHandler && typeof this.widget.removeEventListener === "function") {
			this.widget.removeEventListener("tm-prosemirror-image-picked-nodeview", this._imagePickedHandler);
		}
		if(this.domNode && this._wrapperFocusHandler) {
			this.domNode.removeEventListener("focus", this._wrapperFocusHandler);
		}
		if(this.view) {
			this.view.dom.removeEventListener("paste", this._pasteHandler);
			this.view.dom.removeEventListener("keydown", this._keydownHandler);
			this.view.dom.removeEventListener("blur", this._blurHandler, true);
			this.view.dom.removeEventListener("compositionend", this._compositionEndHandler, true);
			this.view.destroy();
			this.view = null;
		}
	}
}

exports.ProseMirrorEngine = ProseMirrorEngine;
exports.buildSchema = buildSchema;
