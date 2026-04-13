/*\
title: $:/plugins/tiddlywiki/prosemirror/pragma-block/nodeview.js
type: application/javascript
module-type: library

NodeView for pragma_block and opaque_block atoms in ProseMirror.
Now uses the shared BaseSourceEditableNodeView for a consistent edit UI
with widget blocks (header toolbar, edit/save/cancel/delete buttons).

\*/

"use strict";

const BaseSourceEditableNodeView = require("$:/plugins/tiddlywiki/prosemirror/nodeview/base-source-editable.js").BaseSourceEditableNodeView;

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

		this._createDOM();
	}

	_createDOM() {
		const variant = this.blockType === "pragma" ? "pm-nodeview-pragma" : "pm-nodeview-opaque";
		const labelText = this.blockType === "pragma" ? "Pragma" : "Block";

		const container = document.createElement("div");
		container.className = "pm-nodeview " + variant;
		container.setAttribute("contenteditable", "false");

		const header = this.createHeader(labelText + ": " + (this.node.attrs.firstLine || ""));
		container.appendChild(header);

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

		const label = document.createElement("span");
		label.className = "pm-nodeview-label";
		label.textContent = this.node.attrs.firstLine || (this.blockType === "pragma" ? "(pragma)" : "(block)");
		this.contentEl.appendChild(label);
		this.labelEl = label;
	}

	renderEditMode() {
		if(!this.contentEl) return;
		while(this.contentEl.firstChild) this.contentEl.removeChild(this.contentEl.firstChild);

		const textarea = this.createEditTextarea(this.node.attrs.rawText || "", 2);
		textarea.rows = Math.max(2, (this.node.attrs.rawText || "").split("\n").length);
		this.contentEl.appendChild(textarea);

		setTimeout(() => { textarea.focus(); }, 0);
	}

	saveEdit(newText) {
		const newRawText = (newText != null) ? newText : (this.node.attrs.rawText || "");
		const newFirstLine = newRawText.split("\n")[0] || newRawText;

		const pos = this.getPos();
		if(typeof pos !== "number") return;
		const tr = this.view.state.tr.setNodeMarkup(pos, null, {
			rawText: newRawText,
			firstLine: newFirstLine.trim()
		});
		this.view.dispatch(tr);
	}

	updateTitle() {
		if(this._titleEl) {
			const labelText = this.blockType === "pragma" ? "Pragma" : "Block";
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
}

/**
 * Create a ProseMirror plugin that registers NodeViews for pragma_block and opaque_block.
 */
function createPragmaBlockNodeViewPlugin(hostWidget) {
	const Plugin = require("prosemirror-state").Plugin;
	return new Plugin({
		props: {
			nodeViews: {
				pragma_block: (node, view, getPos) => {
					return new SourceBlockNodeView(node, view, getPos, "pragma", hostWidget);
				},
				opaque_block: (node, view, getPos) => {
					return new SourceBlockNodeView(node, view, getPos, "opaque", hostWidget);
				}
			}
		}
	});
}

exports.createPragmaBlockNodeViewPlugin = createPragmaBlockNodeViewPlugin;
exports.SourceBlockNodeView = SourceBlockNodeView;
