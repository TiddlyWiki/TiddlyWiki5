/*\
title: $:/plugins/tiddlywiki/prosemirror/widget-block/nodeview.js
type: application/javascript
module-type: library

Node view for rendering widget blocks in ProseMirror

\*/

"use strict";

const BaseSourceEditableNodeView = require("$:/plugins/tiddlywiki/prosemirror/base-source-editable-nodeview.js").BaseSourceEditableNodeView;
const parseWidget = require("$:/plugins/tiddlywiki/prosemirror/widget-block/utils.js").parseWidget;

const DEBUG = typeof window !== "undefined" && !!window.__TW_PROSEMIRROR_DEBUG__;

class WidgetBlockNodeView extends BaseSourceEditableNodeView {
	constructor(node, view, getPos, parentWidget) {
		super(node, view, getPos, parentWidget);
		
		this.widgetContent = null;
		this.widgetInfo = null;
		this.settingsBtn = null;
		
		this.createDOM();
		this.updateContent();
	}

	createDOM() {
		const container = document.createElement("div");
		container.className = "pm-widget-block-nodeview";

		const text = this.node.textContent.trim();
		
		if(DEBUG) console.log("[WidgetBlockNodeView] Creating DOM for text:", text);
		
		const widget = parseWidget(text);
		
		if(DEBUG) console.log("[WidgetBlockNodeView] Parsed widget:", widget);

		if(widget) {
			// Widget mode: create header and content
			const header = this.createHeader("Widget: " + widget.widgetName);
			header.contentEditable = "false";
			container.appendChild(header);

			const content = document.createElement("div");
			content.className = "pm-widget-block-nodeview-content";
			content.contentEditable = "false";
			container.appendChild(content);
			container.classList.add("pm-widget-block-nodeview-widget");

			this.widgetInfo = widget;
			this.widgetContent = content;
			this.contentContainer = content;
			this.settingsBtn = this.editBtn;
			
			// Rename for compatibility
			this.settingsBtn.classList.add("pm-widget-block-nodeview-edit");
			this.deleteBtn.classList.add("pm-widget-block-nodeview-delete");
		} else {
			// Not a widget: render as normal paragraph
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

	updateContent() {
		if(!this.widgetContent || !this.widgetInfo) {
			return;
		}

		// Clear previous content
		try {
			while(this.widgetContent.firstChild) {
				this.widgetContent.removeChild(this.widgetContent.firstChild);
			}
		} catch(e) {
			if(console) console.warn("[WidgetBlockNodeView] Error clearing content:", e);
		}

		if(this.isEditMode) {
			this.renderEditMode();
		} else {
			this.renderViewMode();
		}
	}

	renderViewMode() {
		try {
			const widgetText = this.widgetInfo.rawText;
			
			if(DEBUG) console.log("[WidgetBlockNodeView] Rendering widget:", widgetText);
			
			// Collect pragma definitions from the document so \define/\procedure etc. are available
			var preamble = "";
			if(this.parentWidget && typeof this.parentWidget.getPragmaPreamble === "function") {
				preamble = this.parentWidget.getPragmaPreamble();
			}
			var fullText = preamble + widgetText;
			const parseTree = $tw.wiki.parseText("text/vnd.tiddlywiki", fullText).tree;
			
			const Widget = require("$:/core/modules/widgets/widget.js").widget;
			// Destroy previous TW widget if any
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
			
			if(DEBUG) console.log("[WidgetBlockNodeView] Rendered successfully");

			// If the widget rendered nothing visible, show a placeholder
			// so the user can still click to edit it
			var self = this;
			requestAnimationFrame(function() {
				if(!self.widgetContent) return;
				if(self.isEditMode) return;
				var hasContent = self.widgetContent.offsetHeight > 4 &&
					self.widgetContent.textContent.trim().length > 0;
				if(!hasContent) {
					// Only add placeholder if one doesn't exist yet
					if(!self.widgetContent.querySelector(".pm-widget-block-empty-placeholder")) {
						var placeholder = document.createElement("div");
						placeholder.className = "pm-widget-block-empty-placeholder";
						placeholder.textContent = widgetText.length > 60
							? widgetText.substring(0, 60) + "…"
							: widgetText;
						self.widgetContent.appendChild(placeholder);
					}
				}
			});
		} catch(e) {
			if(console) console.error("[WidgetBlockNodeView] Render error:", e);
			const errorDiv = document.createElement("div");
			errorDiv.className = "pm-widget-block-nodeview-error";
			errorDiv.textContent = "Error: " + e.message;
			this.widgetContent.appendChild(errorDiv);
		}
	}

	renderEditMode() {
		const textarea = this.createEditTextarea(this.widgetInfo.rawText, 3);
		this.widgetContent.appendChild(textarea);
		
		setTimeout(() => {
			textarea.focus();
			textarea.select();
		}, 0);
	}

	cancelEdit() {
		if(DEBUG) console.log("[WidgetBlockNodeView] cancelEdit");
		if(!this.isEditMode) return;
		this.isEditMode = false;
		if(this.dom) {
			this.dom.classList.remove("pm-widget-block-editing");
		}
		// Reset settings button icon
		if(this.settingsBtn) {
			this.setButtonIcon(this.settingsBtn, "$:/core/images/edit-button", "E");
			this.settingsBtn.title = this.getLanguageString("Buttons/Edit", "Edit widget");
		}
		// Hide delete and cancel buttons
		if(this.deleteBtn) {
			this.deleteBtn.style.display = "none";
		}
		if(this.cancelBtn) {
			this.cancelBtn.style.display = "none";
		}
		// Clean up textarea blur handler
		if(this.editTextarea && this.boundBlurHandler) {
			this.editTextarea.removeEventListener("blur", this.boundBlurHandler);
		}
		// Refresh view without saving
		this.updateContent();
	}

	toggleEditMode() {
		if(DEBUG) console.log("[WidgetBlockNodeView] toggleEditMode, current:", this.isEditMode);
		
		this.isEditMode = !this.isEditMode;
		if(this.dom) {
			this.dom.classList.toggle("pm-widget-block-editing", !!this.isEditMode);
		}
		
		// Update button icon
		if(this.settingsBtn) {
			if(this.isEditMode) {
				this.setButtonIcon(this.settingsBtn, "$:/core/images/done-button", "\u2713");
				this.settingsBtn.title = this.getLanguageString("Buttons/SaveChanges", "Save and view");
			} else {
				this.setButtonIcon(this.settingsBtn, "$:/core/images/edit-button", "E");
				this.settingsBtn.title = this.getLanguageString("Buttons/Edit", "Edit widget");
			}
		}
		
		// Show/hide delete and cancel buttons
		if(this.deleteBtn) {
			this.deleteBtn.style.display = this.isEditMode ? "inline-flex" : "none";
		}
		if(this.cancelBtn) {
			this.cancelBtn.style.display = this.isEditMode ? "inline-flex" : "none";
		}
		
		if(!this.isEditMode && this.editTextarea) {
			// Switching from edit to view - save
			const textarea = this.editTextarea;
			if(textarea && textarea.parentNode) {
				textarea.removeEventListener("blur", this.boundBlurHandler);
			}
			this.saveEdit(this.editTextarea.value);
		} else {
			this.updateContent();
		}
	}

	saveEdit(newText) {
		const trimmedText = newText.trim();
		const newWidget = parseWidget(trimmedText);
		
		if(!newWidget) {
			// Not a valid widget anymore
			this.replaceNodeText(trimmedText);
			return;
		}
		
		// Update if text changed
		if(trimmedText !== this.widgetInfo.rawText) {
			this.widgetInfo = newWidget;
			this.replaceNodeText(trimmedText);
		}
		
		// Switch back to view mode
		this.isEditMode = false;
		if(this.dom) {
			this.dom.classList.remove("pm-widget-block-editing");
		}
		if(this.settingsBtn) {
			this.setButtonIcon(this.settingsBtn, "$:/core/images/edit-button", "E");
			this.settingsBtn.title = "Edit widget";
		}
		this.updateContent();
	}

	replaceNodeText(newText) {
		const pos = this.getPos();
		if(typeof pos !== "number") return;
		
		const tr = this.view.state.tr;
		const from = pos;
		const to = pos + this.node.nodeSize;
		
		const newPara = this.view.state.schema.nodes.paragraph.create(null, 
			this.view.state.schema.text(newText));
		
		tr.replaceRangeWith(from, to, newPara);
		this.view.dispatch(tr);
	}

	selectNode() {
		this.dom.classList.add("selected");
		this.selected = true;
	}

	deselectNode() {
		this.dom.classList.remove("selected");
		this.selected = false;
	}

	update(node) {
		if(node.type !== this.node.type) {
			return false;
		}
		
		const oldText = this.node.textContent.trim();
		const newText = node.textContent.trim();
		
		this.node = node;
		
		const newWidget = parseWidget(newText);
		const oldWidget = this.widgetInfo;
		
		const isOldWidget = !!oldWidget;
		const isNewWidget = !!newWidget;

		// Mode change: force re-creation
		if(isOldWidget !== isNewWidget) {
			return false;
		}

		// Widget -> Widget update
		if(isNewWidget && newText !== oldText) {
			this.widgetInfo = newWidget;
			this.updateContent();
		}

		return true;
	}

	destroy() {
		// Destroy TW widget before removing DOM
		if(this.renderedTWWidget) {
			try { this.renderedTWWidget.destroy(); } catch(e) { /* ignore */ }
			this.renderedTWWidget = null;
		}
		
		super.destroy();
		
		if(this.widgetContent) {
			try {
				while(this.widgetContent.firstChild) {
					this.widgetContent.removeChild(this.widgetContent.firstChild);
				}
			} catch(e) {
				if(console) console.warn("[WidgetBlockNodeView] Error during destroy:", e);
			}
		}
	}

	// Override class names
	// eslint-disable-next-line class-methods-use-this
	getHeaderClass() { return "pm-widget-block-nodeview-header"; }

	// eslint-disable-next-line class-methods-use-this
	getTitleClass() { return "pm-widget-block-nodeview-title"; }

	// eslint-disable-next-line class-methods-use-this
	getButtonsClass() { return "pm-widget-block-nodeview-buttons"; }

	// eslint-disable-next-line class-methods-use-this
	getDeleteButtonClass() { return "pm-widget-block-nodeview-btn pm-widget-block-nodeview-delete"; }

	// eslint-disable-next-line class-methods-use-this
	getEditButtonClass() { return "pm-widget-block-nodeview-btn pm-widget-block-nodeview-edit"; }

	// eslint-disable-next-line class-methods-use-this
	getSaveButtonClass() { return "pm-widget-block-nodeview-btn pm-widget-block-nodeview-save"; }

	// eslint-disable-next-line class-methods-use-this
	getCancelButtonClass() { return "pm-widget-block-nodeview-btn pm-widget-block-nodeview-cancel"; }

	// eslint-disable-next-line class-methods-use-this
	getEditorClass() { return "pm-widget-block-nodeview-editor"; }
}

exports.WidgetBlockNodeView = WidgetBlockNodeView;
