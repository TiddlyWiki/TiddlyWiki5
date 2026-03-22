/*\
title: $:/plugins/tiddlywiki/prosemirror/pragma-block/nodeview.js
type: application/javascript
module-type: library

NodeView for pragma_block and opaque_block atoms in ProseMirror.
Now uses the shared BaseSourceEditableNodeView for a consistent edit UI
with widget blocks (header toolbar, edit/save/cancel/delete buttons).

\*/

"use strict";

var BaseSourceEditableNodeView = require("$:/plugins/tiddlywiki/prosemirror/base-source-editable-nodeview.js").BaseSourceEditableNodeView;

/**
 * SourceBlockNodeView — unified NodeView for pragma_block and opaque_block.
 * Extends BaseSourceEditableNodeView to get the same toolbar UI as widget blocks.
 */
class SourceBlockNodeView extends BaseSourceEditableNodeView {
	constructor(node, view, getPos, blockType, parentWidget) {
		super(node, view, getPos, parentWidget);

		this.blockType = blockType;
		this.labelEl = null;
		this.contentEl = null;

		this.createDOM();
	}

	createDOM() {
		var prefix = this.blockType === "pragma" ? "pm-pragma-block" : "pm-opaque-block";
		var labelText = this.blockType === "pragma" ? "Pragma" : "Block";

		var container = document.createElement("div");
		container.className = prefix;
		container.setAttribute("contenteditable", "false");

		// Header with title and buttons (Edit, Delete, Cancel)
		var header = this.createHeader(labelText + ": " + (this.node.attrs.firstLine || ""));
		header.contentEditable = "false";
		container.appendChild(header);

		// Content area — shows the first line summary in view mode, textarea in edit mode
		var content = document.createElement("div");
		content.className = prefix + "-content";
		container.appendChild(content);

		this.contentEl = content;
		this.contentContainer = content;
		this.dom = container;

		this.renderViewMode();
	}

	renderViewMode() {
		if(!this.contentEl) return;
		while(this.contentEl.firstChild) this.contentEl.removeChild(this.contentEl.firstChild);

		var prefix = this.blockType === "pragma" ? "pm-pragma-block" : "pm-opaque-block";
		this.dom.classList.remove(prefix + "-editing");

		var label = document.createElement("span");
		label.className = prefix + "-label";
		label.textContent = this.node.attrs.firstLine || (this.blockType === "pragma" ? "(pragma)" : "(block)");
		this.contentEl.appendChild(label);
		this.labelEl = label;
	}

	renderEditMode() {
		if(!this.contentEl) return;
		while(this.contentEl.firstChild) this.contentEl.removeChild(this.contentEl.firstChild);

		var prefix = this.blockType === "pragma" ? "pm-pragma-block" : "pm-opaque-block";
		this.dom.classList.add(prefix + "-editing");

		var textarea = this.createEditTextarea(this.node.attrs.rawText || "", 2);
		textarea.rows = Math.max(2, (this.node.attrs.rawText || "").split("\n").length);
		this.contentEl.appendChild(textarea);

		var ta = textarea;
		setTimeout(function() { ta.focus(); }, 0);
	}

	saveEdit(newText) {
		var newRawText = (newText != null) ? newText : (this.node.attrs.rawText || "");
		var newFirstLine = newRawText.split("\n")[0] || newRawText;

		// Exit edit mode before dispatching to avoid stale UI
		this.isEditMode = false;

		// Update the node attrs
		var pos = this.getPos();
		if(typeof pos !== "number") return;
		var tr = this.view.state.tr.setNodeMarkup(pos, null, {
			rawText: newRawText,
			firstLine: newFirstLine.trim()
		});
		this.view.dispatch(tr);
	}

	updateTitle() {
		if(this._titleEl) {
			var labelText = this.blockType === "pragma" ? "Pragma" : "Block";
			this._titleEl.textContent = labelText + ": " + (this.node.attrs.firstLine || "");
		}
	}

	update(node) {
		if(node.type.name !== this.node.type.name) return false;
		this.node = node;
		this.updateTitle();
		if(!this.isEditMode && this.labelEl) {
			this.labelEl.textContent = node.attrs.firstLine || (this.blockType === "pragma" ? "(pragma)" : "(block)");
		}
		return true;
	}

	// Class name overrides for pragma/opaque styling
	// eslint-disable-next-line class-methods-use-this
	getHeaderClass() { return "pm-source-block-header"; }

	// eslint-disable-next-line class-methods-use-this
	getTitleClass() { return "pm-source-block-title"; }

	// eslint-disable-next-line class-methods-use-this
	getButtonsClass() { return "pm-source-block-buttons"; }

	// eslint-disable-next-line class-methods-use-this
	getDeleteButtonClass() { return "pm-source-block-btn pm-source-block-delete"; }

	// eslint-disable-next-line class-methods-use-this
	getEditButtonClass() { return "pm-source-block-btn pm-source-block-edit"; }

	// eslint-disable-next-line class-methods-use-this
	getSaveButtonClass() { return "pm-source-block-btn pm-source-block-save"; }

	// eslint-disable-next-line class-methods-use-this
	getCancelButtonClass() { return "pm-source-block-btn pm-source-block-cancel"; }

	getEditorClass() {
		return this.blockType === "pragma" ? "pm-pragma-block-editor" : "pm-opaque-block-editor";
	}
}

/**
 * Create a ProseMirror plugin that registers NodeViews for pragma_block and opaque_block.
 */
function createPragmaBlockNodeViewPlugin(hostWidget) {
	var Plugin = require("prosemirror-state").Plugin;
	return new Plugin({
		props: {
			nodeViews: {
				pragma_block: function(node, view, getPos) {
					return new SourceBlockNodeView(node, view, getPos, "pragma", hostWidget);
				},
				opaque_block: function(node, view, getPos) {
					return new SourceBlockNodeView(node, view, getPos, "opaque", hostWidget);
				}
			}
		}
	});
}

exports.createPragmaBlockNodeViewPlugin = createPragmaBlockNodeViewPlugin;
exports.SourceBlockNodeView = SourceBlockNodeView;
