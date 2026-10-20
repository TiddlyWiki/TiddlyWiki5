/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/pragma/nodeview.js
type: application/javascript
module-type: library

NodeView for pragma_block and opaque_block atoms in ProseMirror.
Now uses the shared BaseSourceEditableNodeView for a consistent edit UI
with widget blocks (header toolbar, edit/save/cancel/delete buttons).

\*/

"use strict";

const BaseSourceEditableNodeView = require("$:/plugins/tiddlywiki/prosemirror/blocks/base-source-editable.js").BaseSourceEditableNodeView;
const createSafeNodeView = require("$:/plugins/tiddlywiki/prosemirror/blocks/safe-nodeview.js").createSafeNodeView;
const parseWikiTextToDoc = require("$:/plugins/tiddlywiki/prosemirror/core/editor-shared.js").parseWikiTextToDoc;
const OpaqueSourceSandbox = require("$:/plugins/tiddlywiki/prosemirror/blocks/opaque-sandbox.js").OpaqueSourceSandbox;
const closeHistory = require("prosemirror-history").closeHistory;
const restoreSourceBoundary = require("$:/plugins/tiddlywiki/prosemirror/ast/source-preservation.js").restoreSourceBoundary;

class SourceBlockNodeView extends BaseSourceEditableNodeView {
	constructor(node, view, getPos, blockType, parentWidget) {
		super(node, view, getPos, parentWidget);

		this.blockType = blockType;
		this.labelEl = null;
		this.contentEl = null;
		this.renderedWidget = null;
		this.wiki = (parentWidget && parentWidget.wiki) || $tw.wiki;
		const sourceTitle = parentWidget && parentWidget.widget && parentWidget.widget.editTitle;
		this.opaqueSandbox = this.blockType === "opaque" ? new OpaqueSourceSandbox(this.wiki, (nextText) => {
			if(!this._destroyed && this.view && !this.view.isDestroyed &&
				nextText !== (this.node.attrs.rawText || "")) {
				this.saveEdit(nextText, { closeHistory: true });
			}
		}, { sourceTitle: sourceTitle }) : null;

		this._createDOM();
	}

	_createDOM() {
		const variant = this.blockType === "pragma" ? "pm-nodeview-pragma" : "pm-nodeview-opaque";
		const labelText = this.blockType === "pragma" ? "Pragma" : "Block";

		const container = this.document.createElement("div");
		container.className = "pm-nodeview " + variant;
		container.setAttribute("contenteditable", "false");

		const header = this.createHeader(labelText + ": " + (this.node.attrs.firstLine || ""));
		container.appendChild(header);

		const content = this.document.createElement("div");
		content.className = "pm-nodeview-content";
		container.appendChild(content);

		this.contentEl = content;
		this.contentContainer = content;
		if(this.blockType !== "opaque") {
			this.installRenderedContentSelectionGuards();
		}
		this.dom = container;

		this.renderViewMode();
		if(this.blockType === "opaque" && this.node.attrs.autoEdit) {
			this.scheduleTimeout(() => this.enterEditMode());
		}
	}

	renderViewMode() {
		if(!this.contentEl) return;
		this._destroyRenderedWidget();
		while(this.contentEl.firstChild) this.contentEl.removeChild(this.contentEl.firstChild);

		const rawText = this.node.attrs.rawText || "";
		const sourceType = this.parentWidget && (this.parentWidget.type || this.parentWidget.editType);
		if(this.blockType === "opaque" && sourceType && sourceType !== "text/vnd.tiddlywiki") {
			// An explicitly requested, unsupported MIME type is source-only. Do not
			// interpret its text as WikiText merely to display a misleading preview.
			const source = this.document.createElement("pre");
			source.textContent = rawText;
			this.contentEl.appendChild(source);
			return;
		}
		if(!rawText) {
			const placeholder = this.document.createElement("div");
			placeholder.className = "pm-nodeview-empty-placeholder";
			placeholder.textContent = "(empty)";
			this.contentEl.appendChild(placeholder);
			return;
		}

		try {
			const parser = this.wiki.parseText("text/vnd.tiddlywiki", rawText);
			const variables = {};
			if(this.blockType === "opaque") {
				// Unknown rules may store absolute source offsets and write directly to
				// currentTiddler. Reparse against a block-local temporary tiddler so
				// those offsets cannot corrupt text outside this ProseMirror node.
				this.opaqueSandbox.ensure(rawText);
				Object.assign(variables, this.opaqueSandbox.getVariables());
			}
			const renderWidget = this.wiki.makeWidget(parser, {
				wiki: this.wiki,
				parentWidget: this.parentWidget || null,
				document: this.document,
				variables: variables
			});
			renderWidget.render(this.contentEl, null);
			this.renderedWidget = renderWidget;
			return;
		} catch(e) {
			// fall through to label fallback
		}

		// Fallback: show first line as plain text
		const label = this.document.createElement("span");
		label.className = "pm-nodeview-label";
		label.textContent = this.node.attrs.firstLine || (this.blockType === "pragma" ? "(pragma)" : "(block)");
		this.contentEl.appendChild(label);
		this.labelEl = label;
	}

	renderEditMode() {
		if(!this.contentEl) return;
		this._destroyRenderedWidget();
		this.labelEl = null;
		while(this.contentEl.firstChild) this.contentEl.removeChild(this.contentEl.firstChild);

		const textarea = this.createEditTextarea(this.node.attrs.rawText || "", 2);
		textarea.rows = Math.max(2, (this.node.attrs.rawText || "").split("\n").length);
		this.contentEl.appendChild(textarea);

		this.scheduleTimeout(() => { textarea.focus(); });
	}

	_destroyRenderedWidget() {
		if(this.renderedWidget) {
			try { this.renderedWidget.destroy(); } catch(e) { /* ignore */ }
			this.renderedWidget = null;
		}
	}

	saveEdit(newText, options) {
		options = options || {};
		const newRawText = (newText != null) ? newText : (this.node.attrs.rawText || "");
		const newFirstLine = newRawText.split("\n")[0] || newRawText;
		const sourceType = this.parentWidget && (this.parentWidget.type || this.parentWidget.editType);

		const pos = this.getPos();
		if(typeof pos !== "number") return;
		if(this.blockType === "opaque" && (!sourceType || sourceType === "text/vnd.tiddlywiki")) {
			try {
				const docJson = parseWikiTextToDoc(this.wiki, "text/vnd.tiddlywiki", restoreSourceBoundary(this.node, newRawText));
				const replacement = this.view.state.schema.nodeFromJSON(docJson).content;
				if(replacement && replacement.size > 0) {
					let tr = this.view.state.tr.replaceWith(pos, pos + this.node.nodeSize, replacement);
					if(options.closeHistory) tr = closeHistory(tr);
					this.view.dispatch(tr);
					return;
				}
			} catch(e) {
				// Keep the source in the opaque block if reparsing cannot produce a valid ProseMirror fragment.
			}
		}
		let tr = this.view.state.tr.setNodeMarkup(pos, null, {
			rawText: newRawText,
			firstLine: newFirstLine.trim(),
			parseTreeJson: null,
			autoEdit: false
		});
		if(options.closeHistory) tr = closeHistory(tr);
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
		const oldRawText = this.node.attrs.rawText;
		const shouldAutoEdit = this.blockType === "opaque" && node.attrs.autoEdit && !this.isEditMode;
		this.node = node;
		this.updateTitle();
		if(!this.isEditMode) {
			const newRawText = node.attrs.rawText;
			if(newRawText !== oldRawText) {
				this.renderViewMode();
			} else if(this.labelEl) {
				this.labelEl.textContent = node.attrs.firstLine || (this.blockType === "pragma" ? "(pragma)" : "(block)");
			}
		}
		if(shouldAutoEdit) {
			this.scheduleTimeout(() => this.enterEditMode());
		}
		return true;
	}

	destroy() {
		this._destroyRenderedWidget();
		if(this.opaqueSandbox) {
			this.opaqueSandbox.destroy();
		}
		super.destroy();
	}

	usesExternalRenderedContent() {
		return this.blockType !== "opaque" && !this.isEditMode;
	}

	stopEvent(event) {
		if(this.blockType === "opaque" && !this.isEditMode && event && event.target && this.contentEl && this.contentEl.contains(event.target)) {
			return true;
		}
		return super.stopEvent(event);
	}
}

function createPragmaBlockNodeViewPlugin(hostWidget) {
	const Plugin = require("prosemirror-state").Plugin;
	return new Plugin({
		props: {
			nodeViews: {
				pragma_block: createSafeNodeView((node, view, getPos) => new SourceBlockNodeView(node, view, getPos, "pragma", hostWidget)),
				opaque_block: createSafeNodeView((node, view, getPos) => new SourceBlockNodeView(node, view, getPos, "opaque", hostWidget))
			}
		}
	});
}

exports.createPragmaBlockNodeViewPlugin = createPragmaBlockNodeViewPlugin;
exports.SourceBlockNodeView = SourceBlockNodeView;
