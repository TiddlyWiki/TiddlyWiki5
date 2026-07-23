/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/safe-nodeview.js
type: application/javascript
module-type: library
\*/

"use strict";


const BaseSourceEditableNodeView = require("$:/plugins/tiddlywiki/prosemirror/blocks/base-source-editable.js").BaseSourceEditableNodeView;

class FallbackNodeView extends BaseSourceEditableNodeView {
	constructor(node, view, getPos, error) {
		super(node, view, getPos, null);
		this.node = node;
		this.view = view;
		this.getPos = getPos;
		this.error = error;
		this.contentEl = null;
		this._sourceEl = null;

		const container = document.createElement("div");
		container.className = "pm-nodeview pm-nodeview-error-fallback";
		container.setAttribute("contenteditable", "false");
		container.appendChild(this.createHeader("Block source"));

		const content = document.createElement("div");
		content.className = "pm-nodeview-content";
		container.appendChild(content);
		this.contentEl = content;
		this.contentContainer = content;
		this.dom = container;
		this.renderViewMode();
	}

	renderViewMode() {
		if(!this.contentEl) return;
		while(this.contentEl.firstChild) this.contentEl.removeChild(this.contentEl.firstChild);
		const message = document.createElement("div");
		message.className = "pm-nodeview-error-message";
		message.textContent = "This block could not be rendered. Edit the source below to recover it.";
		this.contentEl.appendChild(message);
		const source = document.createElement("pre");
		source.className = "pm-nodeview-error-source";
		source.textContent = getNodeSource(this.node);
		this.contentEl.appendChild(source);
		this._sourceEl = source;
	}

	renderEditMode() {
		if(!this.contentEl) return;
		while(this.contentEl.firstChild) this.contentEl.removeChild(this.contentEl.firstChild);
		const textarea = this.createEditTextarea(getNodeSource(this.node), 4);
		this.contentEl.appendChild(textarea);
		setTimeout(() => { textarea.focus(); }, 0);
	}

	saveEdit(newText) {
		const pos = this.getPos();
		if(typeof pos !== "number") return;
		const attrs = getUpdatedAttrs(this.node, newText);
		let replacement = null;
		if(attrs) {
			replacement = this.node.type.create(attrs, this.node.content, this.node.marks);
		} else if(newText) {
			replacement = this.node.type.create(this.node.attrs, this.view.state.schema.text(newText), this.node.marks);
		} else {
			replacement = this.node.type.create(this.node.attrs, null, this.node.marks);
		}
		this.view.dispatch(this.view.state.tr.replaceRangeWith(pos, pos + this.node.nodeSize, replacement));
	}

	updateTitle() {
		if(this._titleEl) {
			this._titleEl.textContent = "Block source";
		}
	}

	update(node) {
		if(node.type !== this.node.type) return false;
		this.node = node;
		if(this._sourceEl && !this.isEditMode) {
			this._sourceEl.textContent = getNodeSource(node);
		}
		return true;
	}
}

function getNodeSource(node) {
	if(!node) return "";
	if(node.attrs) {
		if(typeof node.attrs.rawText === "string") return node.attrs.rawText;
		if(typeof node.attrs.twSource === "string") return node.attrs.twSource;
		if(typeof node.attrs.src === "string") return node.attrs.src;
	}
	return node.textContent || "";
}

function getUpdatedAttrs(node, text) {
	if(!node || !node.attrs) return null;
	const attrs = Object.assign({}, node.attrs);
	if(typeof attrs.rawText === "string") {
		attrs.rawText = text;
		if(typeof attrs.firstLine === "string") {
			attrs.firstLine = (text || "").split("\n")[0].trim();
		}
		return attrs;
	}
	if(typeof attrs.twSource === "string") {
		attrs.twSource = text;
		return attrs;
	}
	if(typeof attrs.src === "string") {
		attrs.src = text;
		return attrs;
	}
	return null;
}

function createSafeNodeView(createNodeView) {
	return function safeNodeView(node, view, getPos, decorations, innerDecorations) {
		try {
			if(typeof $tw !== "undefined" && typeof $tw.prosemirrorTestNodeViewFailure === "function") {
				$tw.prosemirrorTestNodeViewFailure(node);
			}
			return createNodeView(node, view, getPos, decorations, innerDecorations);
		} catch(e) {
			return new FallbackNodeView(node, view, getPos, e);
		}
	};
}

exports.createSafeNodeView = createSafeNodeView;
exports.FallbackNodeView = FallbackNodeView;
