/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/widget/nodeview.js
type: application/javascript
module-type: library

Node view for rendering widget blocks in ProseMirror

\*/

"use strict";

const BaseSourceEditableNodeView = require("$:/plugins/tiddlywiki/prosemirror/blocks/base-source-editable.js").BaseSourceEditableNodeView;
const parseWidget = require("$:/plugins/tiddlywiki/prosemirror/blocks/widget/utils.js").parseWidget;

class WidgetBlockNodeView extends BaseSourceEditableNodeView {
	constructor(node, view, getPos, parentWidget) {
		super(node, view, getPos, parentWidget);
		
		this.widgetContent = null;
		this.widgetInfo = null;
		this.renderedTWWidget = null;
		
		this._createDOM();
		this._updateContent();
	}

	_createDOM() {
		const container = document.createElement("div");
		container.className = "pm-nodeview pm-nodeview-widget";

		const text = this.node.textContent.trim();
		const widget = parseWidget(text);

		if(widget) {
			const header = this.createHeader("Widget: " + widget.widgetName);
			container.appendChild(header);

			const content = document.createElement("div");
			content.className = "pm-nodeview-content";
			content.contentEditable = "false";
			container.appendChild(content);

			this.widgetInfo = widget;
			this.widgetContent = content;
			this.contentContainer = content;
		} else {
			const p = document.createElement("p");
			p.className = "pm-paragraph-normal";
			this.dom = p;
			this.contentDOM = p;
			this.widgetInfo = null;
			this.widgetContent = null;
			this.contentContainer = null;
			return;
		}

		this.dom = container;
	}

	_updateContent() {
		if(!this.widgetContent || !this.widgetInfo) return;

		try {
			while(this.widgetContent.firstChild) {
				this.widgetContent.removeChild(this.widgetContent.firstChild);
			}
		} catch(e) {
			// ignore
		}

		if(this.isEditMode) {
			this.renderEditMode();
		} else {
			this.renderViewMode();
		}
	}

	renderViewMode() {
		if(!this.widgetContent) return;
		try {
			const widgetText = this.widgetInfo.rawText;
			let preamble = "";
			if(this.parentWidget && typeof this.parentWidget.getPragmaPreamble === "function") {
				preamble = this.parentWidget.getPragmaPreamble();
			}
			const fullText = preamble + widgetText;
			const parseTree = $tw.wiki.parseText("text/vnd.tiddlywiki", fullText).tree;

			const Widget = require("$:/core/modules/widgets/widget.js").widget;
			if(this.renderedTWWidget) {
				try { this.renderedTWWidget.destroy(); } catch(e) { /* ignore */ }
				this.renderedTWWidget = null;
			}
			const tempWidget = new Widget({
				type: "element",
				tag: "div",
				children: parseTree
			}, {
				wiki: $tw.wiki,
				parentWidget: this.parentWidget || null,
				document: document,
				variables: this.parentWidget ? this.parentWidget.variables : {}
			});

			tempWidget.render(this.widgetContent, null);
			this.renderedTWWidget = tempWidget;

			// If the widget rendered nothing visible, show a placeholder
			const self = this;
			requestAnimationFrame(() => {
				if(!self.widgetContent || self.isEditMode) return;
				const hasContent = self.widgetContent.offsetHeight > 4 &&
					self.widgetContent.textContent.trim().length > 0;
				if(!hasContent && !self.widgetContent.querySelector(".pm-widget-block-empty-placeholder")) {
					const placeholder = document.createElement("div");
					placeholder.className = "pm-widget-block-empty-placeholder";
					placeholder.textContent = widgetText.length > 60 ? widgetText.substring(0, 60) + "…" : widgetText;
					self.widgetContent.appendChild(placeholder);
				}
			});
		} catch(e) {
			const errorDiv = document.createElement("div");
			errorDiv.className = "pm-widget-block-nodeview-error";
			errorDiv.textContent = "Error: " + e.message;
			this.widgetContent.appendChild(errorDiv);
		}
	}

	renderEditMode() {
		if(!this.widgetContent) return;
		while(this.widgetContent.firstChild) this.widgetContent.removeChild(this.widgetContent.firstChild);

		const textarea = this.createEditTextarea(this.widgetInfo.rawText, 3);
		this.widgetContent.appendChild(textarea);

		setTimeout(() => { textarea.focus(); }, 0);
	}

	saveEdit(newText) {
		const trimmedText = (typeof newText === "string") ? newText.trim() : "";
		const newWidget = parseWidget(trimmedText);

		if(!newWidget) {
			this._replaceNodeText(trimmedText);
			return;
		}

		if(trimmedText !== this.widgetInfo.rawText) {
			this.widgetInfo = newWidget;
			this._replaceNodeText(trimmedText);
		}

		this._updateContent();
	}

	_replaceNodeText(newText) {
		const pos = this.getPos();
		if(typeof pos !== "number") return;

		const newPara = this.view.state.schema.nodes.paragraph.create(null,
			this.view.state.schema.text(newText));

		const tr = this.view.state.tr.replaceRangeWith(pos, pos + this.node.nodeSize, newPara);
		this.view.dispatch(tr);
	}

	update(node) {
		if(node.type !== this.node.type) return false;

		const oldText = this.node.textContent.trim();
		const newText = node.textContent.trim();
		this.node = node;

		const newWidget = parseWidget(newText);
		const isOldWidget = !!this.widgetInfo;
		const isNewWidget = !!newWidget;

		if(isOldWidget !== isNewWidget) return false;

		if(isNewWidget && newText !== oldText) {
			this.widgetInfo = newWidget;
			this._updateContent();
		}

		return true;
	}

	destroy() {
		if(this.renderedTWWidget) {
			try { this.renderedTWWidget.destroy(); } catch(e) { /* ignore */ }
			this.renderedTWWidget = null;
		}
		super.destroy();
	}
}

exports.WidgetBlockNodeView = WidgetBlockNodeView;
