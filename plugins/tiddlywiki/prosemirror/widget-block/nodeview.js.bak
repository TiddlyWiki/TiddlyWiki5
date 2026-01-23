/*\
title: $:/plugins/tiddlywiki/prosemirror/widget-block/nodeview.js
type: application/javascript
module-type: library

Node view for rendering widget blocks in ProseMirror

\*/

"use strict";

const utils = require("$:/plugins/tiddlywiki/prosemirror/widget-block/utils.js");
const parseWidget = utils.parseWidget;

const DEBUG = typeof window !== "undefined" && !!window.__TW_PROSEMIRROR_DEBUG__;

/**
 * Custom node view for widget blocks
 * This renders the paragraph node as a widget block if it contains widget syntax
 */
class WidgetBlockNodeView {
	constructor(node, view, getPos, parentWidget) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;
		this.parentWidget = parentWidget; // Store parent widget for context
		this.dom = null;
		this.contentDOM = null; // Keep this for ProseMirror, but won't use it for widgets
		this.widgetContent = null; // Our custom content container
		this.selectedNode = null;
		this.isEditMode = false; // Track edit mode state
		this.editTextarea = null; // Store reference to edit textarea

		this.createDOM();
		this.updateContent();
	}

	createDOM() {
		// Create outer container
		const container = document.createElement("div");
		container.className = "pm-widget-block-nodeview";
		// Don't set contentEditable="false" on the container
		// This allows ProseMirror to handle deletion

		const text = this.node.textContent.trim();
		
		if(DEBUG && console && console.log) {
			console.log("[WidgetBlockNodeView] Creating DOM for text:", text);
		}
		
		const widget = parseWidget(text);
		
		if(DEBUG && console && console.log) {
			console.log("[WidgetBlockNodeView] Parsed widget:", widget);
		}

		if(widget) {
			// Create header
			const header = document.createElement("div");
			header.className = "pm-widget-block-nodeview-header";
			header.contentEditable = "false"; // Prevent ProseMirror from capturing events

			const title = document.createElement("span");
			title.className = "pm-widget-block-nodeview-title";
			title.textContent = "Widget: " + widget.widgetName;

			// Button container
			const buttonContainer = document.createElement("span");
			buttonContainer.className = "pm-widget-block-nodeview-buttons";

			// Edit/Save button
			const settingsBtn = document.createElement("button");
			settingsBtn.className = "pm-widget-block-nodeview-btn pm-widget-block-nodeview-edit";
			settingsBtn.title = "Edit widget";
			settingsBtn.contentEditable = "false";
			
			// Get TiddlyWiki icon
			const editIconTiddler = $tw.wiki.getTiddler("$:/core/images/edit-button");
			if(editIconTiddler) {
				const iconText = editIconTiddler.fields.text;
				// Parse the parameters and get the SVG
				const svgMatch = iconText.match(/<svg[\s\S]*<\/svg>/);
				if(svgMatch) {
					settingsBtn.innerHTML = svgMatch[0].replace(/<<size>>/g, "16pt");
				}
			} else {
				settingsBtn.innerHTML = "✏️";
			}

			const self = this;
			settingsBtn.addEventListener("click", function(e) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				if(console && console.log) {
					console.log("[WidgetBlockNodeView] Settings button clicked!");
				}
				self.toggleEditMode();
				return false;
			}, true);
			
			// Also add mousedown handler to prevent ProseMirror selection
			settingsBtn.addEventListener("mousedown", function(e) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				return false;
			}, true);

			// Delete button
			const deleteBtn = document.createElement("button");
			deleteBtn.className = "pm-widget-block-nodeview-btn pm-widget-block-nodeview-delete";
			deleteBtn.title = "Delete widget";
			deleteBtn.contentEditable = "false";
			
			// Get TiddlyWiki delete icon
			const deleteIconTiddler = $tw.wiki.getTiddler("$:/core/images/delete-button");
			if(deleteIconTiddler) {
				const iconText = deleteIconTiddler.fields.text;
				const svgMatch = iconText.match(/<svg[\s\S]*<\/svg>/);
				if(svgMatch) {
					deleteBtn.innerHTML = svgMatch[0].replace(/<<size>>/g, "16pt");
				}
			} else {
				deleteBtn.innerHTML = "🗑️";
			}

			deleteBtn.addEventListener("click", function(e) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				self.deleteWidget();
				return false;
			}, true);
			
			deleteBtn.addEventListener("mousedown", function(e) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				return false;
			}, true);

			// Put delete first and edit/save last so edit/save stays rightmost
			// when the delete button becomes visible in edit mode.
			buttonContainer.appendChild(deleteBtn);
			buttonContainer.appendChild(settingsBtn);
			header.appendChild(title);
			header.appendChild(buttonContainer);
			container.appendChild(header);

			// Create content area
			const content = document.createElement("div");
			content.className = "pm-widget-block-nodeview-content";
			content.contentEditable = "false"; // Prevent ProseMirror from editing widget content
			container.appendChild(content);
			container.classList.add("pm-widget-block-nodeview-widget");

			this.widgetInfo = widget;
			this.widgetContent = content; // Use a different property name, not contentDOM
			this.header = header;
			this.settingsBtn = settingsBtn;
			this.deleteBtn = deleteBtn; // Save reference to delete button
			
			// Hide delete button initially (only show in edit mode)
			deleteBtn.style.display = "none";
			
			// Important: DO NOT set this.contentDOM
			// Setting contentDOM tells ProseMirror to manage the content,
			// but we want full control over rendering
		} else {
			// Not a widget: render as a normal paragraph.
			// Important: this must be a <p> to match the schema and preserve editor behavior
			// (marks, input rules like lists, etc).
			const p = document.createElement("p");
			p.className = "pm-paragraph-normal";
			this.dom = p;
			this.contentDOM = p;
			this.widgetInfo = null;
			this.widgetContent = null;
			this.header = null;
			this.settingsBtn = null;
			this.deleteBtn = null;
			return;
		}

		this.dom = container;
	}

	updateContent() {
		if(!this.widgetContent || !this.widgetInfo) {
			return;
		}

		// Clear previous content safely
		try {
			while(this.widgetContent.firstChild) {
				this.widgetContent.removeChild(this.widgetContent.firstChild);
			}
		} catch(e) {
			// If removeChild fails, the DOM was already modified elsewhere
			// This can happen during blur events, just log and continue
			if(console && console.warn) {
				console.warn("[WidgetBlockNodeView] Error clearing content:", e);
			}
		}

		if(this.isEditMode) {
			// Show edit mode - textarea with widget source
			this.renderEditMode();
		} else {
			// Show render mode - rendered widget output
			this.renderViewMode();
		}
	}

	renderViewMode() {
		try {
			// Try to render the widget
			const widgetText = this.widgetInfo.rawText;
			
			if(console && console.log) {
				console.log("[WidgetBlockNodeView] Rendering widget:", widgetText);
			}
			
			const parseTree = $tw.wiki.parseText("text/vnd.tiddlywiki", widgetText).tree;
			
			if(console && console.log) {
				console.log("[WidgetBlockNodeView] Parse tree:", parseTree);
			}
			
			// Create a temporary widget to render
			const Widget = require("$:/core/modules/widgets/widget.js").widget;
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

			// Render it
			tempWidget.render(this.widgetContent, null);
			
			if(console && console.log) {
				console.log("[WidgetBlockNodeView] Rendered successfully, children count:", this.widgetContent.children.length);
			}
		} catch(e) {
			if(console && console.error) {
				console.error("[WidgetBlockNodeView] Render error:", e);
			}
			const errorDiv = document.createElement("div");
			errorDiv.className = "pm-widget-block-nodeview-error";
			errorDiv.textContent = "Error: " + e.message;
			this.widgetContent.appendChild(errorDiv);
		}
	}

	renderEditMode() {
		// Create textarea for editing widget source
		const textarea = document.createElement("textarea");
		textarea.className = "pm-widget-block-nodeview-editor";
		textarea.value = this.widgetInfo.rawText;
		textarea.rows = 3;
		
		const self = this;
		
		// Create blur handler and save reference
		this.boundBlurHandler = function() {
			// Only save if still in edit mode
			// (if toggleEditMode was called, isEditMode will be false)
			if(self.isEditMode) {
				self.saveEdit(textarea.value);
			}
		};
		
		// Handle textarea blur - save changes
		textarea.addEventListener("blur", this.boundBlurHandler);
		
		// Handle Escape key - cancel edit
		textarea.addEventListener("keydown", function(e) {
			if(e.key === "Escape") {
				e.preventDefault();
				// Remove blur handler before changing mode
				textarea.removeEventListener("blur", self.boundBlurHandler);
				self.isEditMode = false;
				self.updateContent();
			} else if(e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				// Ctrl+Enter or Cmd+Enter to save
				e.preventDefault();
				// Remove blur handler before saving
				textarea.removeEventListener("blur", self.boundBlurHandler);
				self.saveEdit(textarea.value);
			}
		});
		
		this.widgetContent.appendChild(textarea);
		this.editTextarea = textarea;
		
		// Focus the textarea
		setTimeout(function() {
			textarea.focus();
			textarea.select();
		}, 0);
	}

	toggleEditMode() {
		if(console && console.log) {
			console.log("[WidgetBlockNodeView] toggleEditMode called, current mode:", this.isEditMode);
		}
		
		this.isEditMode = !this.isEditMode;
		if(this.dom) {
			this.dom.classList.toggle("pm-widget-block-editing", !!this.isEditMode);
		}
		
		if(console && console.log) {
			console.log("[WidgetBlockNodeView] New mode:", this.isEditMode);
		}
		
		// Update button icon
		if(this.settingsBtn) {
			if(this.isEditMode) {
				// Show done/save icon
				const doneIconTiddler = $tw.wiki.getTiddler("$:/core/images/done-button");
				if(doneIconTiddler) {
					const iconText = doneIconTiddler.fields.text;
					const svgMatch = iconText.match(/<svg[\s\S]*<\/svg>/);
					if(svgMatch) {
						this.settingsBtn.innerHTML = svgMatch[0].replace(/<<size>>/g, "16pt");
					}
				} else {
					this.settingsBtn.innerHTML = "✓";
				}
				this.settingsBtn.title = "Save and view";
			} else {
				// Show edit icon
				const editIconTiddler = $tw.wiki.getTiddler("$:/core/images/edit-button");
				if(editIconTiddler) {
					const iconText = editIconTiddler.fields.text;
					const svgMatch = iconText.match(/<svg[\s\S]*<\/svg>/);
					if(svgMatch) {
						this.settingsBtn.innerHTML = svgMatch[0].replace(/<<size>>/g, "16pt");
					}
				} else {
					this.settingsBtn.innerHTML = "✏️";
				}
				this.settingsBtn.title = "Edit widget";
			}
		}
		
		// Show/hide delete button based on edit mode
		if(this.deleteBtn) {
			this.deleteBtn.style.display = this.isEditMode ? "inline-flex" : "none";
		}
		
		if(!this.isEditMode && this.editTextarea) {
			// Switching from edit to view - save if needed
			// Remove blur listener to prevent double save
			const textarea = this.editTextarea;
			if(textarea && textarea.parentNode) {
				textarea.removeEventListener("blur", this.boundBlurHandler);
			}
			this.saveEdit(this.editTextarea.value);
		} else {
			// Just update the content display
			this.updateContent();
		}
	}

	deleteWidget() {
		if(console && console.log) {
			console.log("[WidgetBlockNodeView] Deleting widget");
		}
		
		// Get position and delete the node
		const pos = this.getPos();
		if(pos === undefined || pos === null) {
			return;
		}
		
		const tr = this.view.state.tr;
		tr.delete(pos, pos + this.node.nodeSize);
		this.view.dispatch(tr);
	}

	saveEdit(newText) {
		const trimmedText = newText.trim();
		
		// Parse the new text
		const newWidget = parseWidget(trimmedText);
		
		if(!newWidget) {
			// Not a valid widget anymore, convert back to plain paragraph
			this.replaceNodeText(trimmedText);
			return;
		}
		
		// Check if text changed
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
			// Restore edit icon
			const editIconTiddler = $tw.wiki.getTiddler("$:/core/images/edit-button");
			if(editIconTiddler) {
				const iconText = editIconTiddler.fields.text;
				const svgMatch = iconText.match(/<svg[\s\S]*<\/svg>/);
				if(svgMatch) {
					this.settingsBtn.innerHTML = svgMatch[0].replace(/<<size>>/g, "16pt");
				}
			} else {
				this.settingsBtn.innerHTML = "✏️";
			}
			this.settingsBtn.title = "Edit widget";
		}
		this.updateContent();
	}

	replaceNodeText(newText) {
		// Update the ProseMirror document
		const pos = this.getPos();
		if(pos === undefined || pos === null) {
			return;
		}
		
		const tr = this.view.state.tr;
		const from = pos;
		const to = pos + this.node.nodeSize;
		
		// Create new paragraph with the updated text
		const newPara = this.view.state.schema.nodes.paragraph.create(null, 
			this.view.state.schema.text(newText));
		
		tr.replaceRangeWith(from, to, newPara);
		this.view.dispatch(tr);
	}

	selectNode() {
		this.dom.classList.add("selected");
		this.selectedNode = true;
	}

	deselectNode() {
		this.dom.classList.remove("selected");
		this.selectedNode = false;
	}

	update(node) {
		if(node.type !== this.node.type) {
			return false;
		}
		
		const oldText = this.node.textContent.trim();
		const newText = node.textContent.trim();
		
		// Update node reference
		this.node = node;
		
		const newWidget = parseWidget(newText);
		const oldWidget = this.widgetInfo; // Rely on property set in createDOM/update
		
		const isOldWidget = !!oldWidget;
		const isNewWidget = !!newWidget;

		// Mode change: return false to force re-creation
		if(isOldWidget !== isNewWidget) {
			return false;
		}

		// Widget -> Widget update
		if(isNewWidget) {
			// If text changed, update our internal model
			// Note: ProseMirror handles valid updates to contentDOM if exposed
			if(newText !== oldText) {
				this.widgetInfo = newWidget;
				this.updateContent();
			}
			return true;
		}

		// Text -> Text update
		// ProseMirror handles contentDOM update
		return true;
	}

	destroy() {
		// Clean up event listeners
		if(this.editTextarea && this.boundBlurHandler) {
			this.editTextarea.removeEventListener("blur", this.boundBlurHandler);
		}
		
		// Clean up DOM
		if(this.widgetContent) {
			try {
				while(this.widgetContent.firstChild) {
					this.widgetContent.removeChild(this.widgetContent.firstChild);
				}
			} catch(e) {
				// Ignore errors during cleanup
				if(console && console.warn) {
					console.warn("[WidgetBlockNodeView] Error during destroy:", e);
				}
			}
		}
	}
}

exports.WidgetBlockNodeView = WidgetBlockNodeView;
