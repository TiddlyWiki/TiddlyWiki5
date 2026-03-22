/*\
title: $:/plugins/tiddlywiki/prosemirror/base-source-editable-nodeview.js
type: application/javascript
module-type: library

Base class for node views that edit source text (images, widgets, etc.)

\*/

"use strict";

const NodeSelection = require("prosemirror-state").NodeSelection;

/**
 * Base class for node views that allow editing source text
 */
class BaseSourceEditableNodeView {
	constructor(node, view, getPos, parentWidget) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;
		this.parentWidget = parentWidget;
		
		this.dom = null;
		this.header = null;
		this.editBtn = null;
		this.deleteBtn = null;
		this.contentContainer = null;
		this.selected = false;
		this.isEditMode = false;
		this.editTextarea = null;
		this.boundBlurHandler = null;
	}

	/**
	 * Get a translatable string from a language tiddler.
	 * Falls back to the provided default if the tiddler is missing.
	 */
	// eslint-disable-next-line class-methods-use-this
	getLanguageString(suffix, fallback) {
		return $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/" + suffix, fallback);
	}

	/**
	 * Get SVG icon from a TW image tiddler.
	 * Uses TW's rendering pipeline so wikitext macros (<<size>> etc.) are resolved.
	 * Returns a sanitized SVG DOM element or null.
	 */
	// eslint-disable-next-line class-methods-use-this
	getSvgIcon(tiddlerTitle, size) {
		size = size || "1em";
		try {
			var htmlStr = $tw.wiki.renderTiddler("text/html", tiddlerTitle, {
				variables: { size: size }
			});
			if(!htmlStr) return null;
			var container = document.createElement("div");
			container.innerHTML = htmlStr;
			var svgEl = container.querySelector("svg");
			if(svgEl) return svgEl;
		} catch(e) {
			// Fallback: return null
		}
		return null;
	}

	/**
	 * Set icon on a button element safely (avoids innerHTML).
	 */
	setButtonIcon(button, tiddlerTitle, fallbackEmoji) {
		var svgEl = this.getSvgIcon(tiddlerTitle);
		if(svgEl) {
			// Clear existing content and append the parsed SVG node
			while(button.firstChild) { button.removeChild(button.firstChild); }
			button.appendChild(document.importNode(svgEl, true));
		} else {
			button.textContent = fallbackEmoji || "•";
		}
	}

	/**
	 * Create header with title and buttons
	 */
	createHeader(titleText) {
		const header = document.createElement("span");
		header.className = this.getHeaderClass();

		const title = document.createElement("span");
		title.className = this.getTitleClass();
		title.textContent = titleText;

		const buttons = document.createElement("span");
		buttons.className = this.getButtonsClass();

		// Create all buttons
		const editBtn = this.createEditButton();
		const deleteBtn = this.createDeleteButton();
		const cancelBtn = this.createCancelButton();

		// Order: Edit, Delete, Cancel, Save (Save button is created when switching to edit mode)
		buttons.appendChild(editBtn);
		buttons.appendChild(deleteBtn);
		buttons.appendChild(cancelBtn);
		header.appendChild(title);
		header.appendChild(buttons);

		this.header = header;
		this.editBtn = editBtn;
		this.deleteBtn = deleteBtn;
		this.cancelBtn = cancelBtn;
		this._titleEl = title;

		return header;
	}

	/**
	 * Create delete button
	 */
	createDeleteButton() {
		const deleteBtn = document.createElement("button");
		const deleteClasses = this.getDeleteButtonClass().split(" ");
		for(let i = 0; i < deleteClasses.length; i++) {
			deleteBtn.classList.add(deleteClasses[i]);
		}
		deleteBtn.title = this.getLanguageString("Buttons/Delete", "Delete");
		deleteBtn.type = "button";
		deleteBtn.style.display = "none";

		this.setButtonIcon(deleteBtn, "$:/core/images/delete-button", "\u00D7");

		const self = this;
		deleteBtn.addEventListener("click", e => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			self.handleDelete();
			return false;
		}, true);

		deleteBtn.addEventListener("mousedown", e => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			return false;
		}, true);

		return deleteBtn;
	}

	/**
	 * Create cancel button
	 */
	createCancelButton() {
		const cancelBtn = document.createElement("button");
		const cancelClasses = this.getCancelButtonClass().split(" ");
		for(let i = 0; i < cancelClasses.length; i++) {
			cancelBtn.classList.add(cancelClasses[i]);
		}
		cancelBtn.title = this.getLanguageString("Buttons/Cancel", "Cancel");
		cancelBtn.type = "button";
		cancelBtn.style.display = "none"; // Hidden by default, shown in edit mode
		cancelBtn.contentEditable = "false";

		// Get SVG icon
		this.setButtonIcon(cancelBtn, "$:/core/images/cancel-button", "\u00D7");

		const self = this;
		cancelBtn.addEventListener("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
			if(self.isEditMode) {
				self.cancelEdit(); // Exit edit mode without saving
			}
			return false;
		}, true);

		return cancelBtn;
	}

	/**
	 * Create edit/save button
	 */
	createEditButton() {
		const editBtn = document.createElement("button");
		const editClasses = this.getEditButtonClass().split(" ");
		for(let i = 0; i < editClasses.length; i++) {
			editBtn.classList.add(editClasses[i]);
		}
		editBtn.title = this.getLanguageString("Buttons/Edit", "Edit");
		editBtn.type = "button";

		this.setButtonIcon(editBtn, "$:/core/images/edit-button", "E");

		const self = this;
		editBtn.addEventListener("click", e => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			
			// If in edit mode, save before toggling
			if(self.isEditMode) {
				// Get textarea value
				const textarea = self.dom.querySelector("." + self.getEditorClass());
				if(textarea && textarea.value) {
					self.saveEdit(textarea.value);
				} else {
					// No textarea or empty, just toggle
					self.toggleEditMode();
				}
			} else {
				self.toggleEditMode();
			}
			return false;
		}, true);

		editBtn.addEventListener("mousedown", e => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			return false;
		}, true);

		return editBtn;
	}

	/**
	 * Cancel editing — exit edit mode without saving.
	 * Subclasses can override to add cleanup.
	 */
	cancelEdit() {
		if(!this.isEditMode) return;
		this.isEditMode = false;
		
		// Reset button states (same as the "else" branch in toggleEditMode)
		this.setButtonIcon(this.editBtn, "$:/core/images/edit-button", "E");
		this.editBtn.title = this.getLanguageString("Buttons/Edit", "Edit");
		const editClasses = this.getEditButtonClass().split(" ");
		for(let i = 0; i < editClasses.length; i++) {
			this.editBtn.classList.add(editClasses[i]);
		}
		const saveClasses = this.getSaveButtonClass().split(" ");
		for(let i = 0; i < saveClasses.length; i++) {
			this.editBtn.classList.remove(saveClasses[i]);
		}
		
		if(this.deleteBtn) {
			this.deleteBtn.style.display = "none";
		}
		if(this.cancelBtn) {
			this.cancelBtn.style.display = "none";
		}
		
		this.renderViewMode();
	}

	/**
	 * Toggle between edit and view mode
	 */
	toggleEditMode() {
		this.isEditMode = !this.isEditMode;
		
		if(this.isEditMode) {
			// Switch to save icon
			this.setButtonIcon(this.editBtn, "$:/core/images/done-button", "\u2713");
					this.editBtn.title = this.getLanguageString("Buttons/SaveChanges", "Save changes");
			const saveClasses = this.getSaveButtonClass().split(" ");
			for(let i = 0; i < saveClasses.length; i++) {
				this.editBtn.classList.add(saveClasses[i]);
			}
			const editClasses = this.getEditButtonClass().split(" ");
			for(let i = 0; i < editClasses.length; i++) {
				this.editBtn.classList.remove(editClasses[i]);
			}
			
			// Show delete and cancel buttons
			if(this.deleteBtn) {
				this.deleteBtn.style.display = "";
			}
			if(this.cancelBtn) {
				this.cancelBtn.style.display = "";
			}
			
			// Move save button to the end (after cancel) to prevent accidental delete
			if(this.editBtn.parentNode) {
				this.editBtn.parentNode.appendChild(this.editBtn);
			}
			
			this.renderEditMode();
		} else {
			// Switch back to edit icon
			this.setButtonIcon(this.editBtn, "$:/core/images/edit-button", "E");
			this.editBtn.title = this.getLanguageString("Buttons/Edit", "Edit");
			const editClasses = this.getEditButtonClass().split(" ");
			for(let i = 0; i < editClasses.length; i++) {
				this.editBtn.classList.add(editClasses[i]);
			}
			const saveClasses = this.getSaveButtonClass().split(" ");
			for(let i = 0; i < saveClasses.length; i++) {
				this.editBtn.classList.remove(saveClasses[i]);
			}
			
			// Hide delete and cancel buttons
			if(this.deleteBtn) {
				this.deleteBtn.style.display = "none";
			}
			if(this.cancelBtn) {
				this.cancelBtn.style.display = "none";
			}
			
			this.renderViewMode();
		}
	}

	/**
	 * Create textarea for editing
	 */
	createEditTextarea(initialValue, rows = 2) {
		const textarea = document.createElement("textarea");
		textarea.className = this.getEditorClass();
		textarea.value = initialValue;
		textarea.rows = rows;
		
		const self = this;
		
		// Create blur handler
		this.boundBlurHandler = function() {
			// Don't auto-save on blur, wait for explicit save
		};
		
		textarea.addEventListener("blur", this.boundBlurHandler);
		
		textarea.addEventListener("keydown", function(e) {
			if(e.key === "Escape") {
				e.preventDefault();
				textarea.removeEventListener("blur", self.boundBlurHandler);
				self.cancelEdit();
			} else if(e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				textarea.removeEventListener("blur", self.boundBlurHandler);
				self.saveEdit(textarea.value);
			}
		});
		
		this.editTextarea = textarea;
		return textarea;
	}

	/**
	 * Handle delete action
	 */
	handleDelete() {
		const pos = this.getPos();
		if(typeof pos !== "number") {
			return;
		}
		const tr = this.view.state.tr.delete(pos, pos + this.node.nodeSize);
		this.view.dispatch(tr);
	}

	/**
	 * Select node
	 */
	selectNode() {
		this.selected = true;
		this.dom.classList.add("selected");
	}

	/**
	 * Deselect node
	 */
	deselectNode() {
		this.selected = false;
		this.dom.classList.remove("selected");
	}

	/**
	 * Update node
	 */
	update(node) {
		if(node.type !== this.node.type) {
			return false;
		}
		this.node = node;
		this.updateTitle();
		return true;
	}

	/**
	 * Destroy node view
	 */
	destroy() {
		if(this.editTextarea && this.boundBlurHandler) {
			this.editTextarea.removeEventListener("blur", this.boundBlurHandler);
		}
	}

	/**
	 * Stop events from reaching ProseMirror when in edit mode.
	 * This prevents keystrokes in the textarea from being interpreted as PM commands.
	 */
	stopEvent(event) {
		if(this.isEditMode) return true;
		return false;
	}

	/**
	 * Ignore DOM mutations inside this node view.
	 * ProseMirror should not try to parse our custom DOM structure.
	 */
	// eslint-disable-next-line class-methods-use-this
	ignoreMutation() {
		return true;
	}

	// Override these methods in subclasses
	// eslint-disable-next-line class-methods-use-this
	getHeaderClass() { return "pm-nodeview-header"; }

	// eslint-disable-next-line class-methods-use-this
	getTitleClass() { return "pm-nodeview-title"; }

	// eslint-disable-next-line class-methods-use-this
	getButtonsClass() { return "pm-nodeview-buttons"; }

	// eslint-disable-next-line class-methods-use-this
	getDeleteButtonClass() { return "pm-nodeview-delete"; }

	// eslint-disable-next-line class-methods-use-this
	getEditButtonClass() { return "pm-nodeview-edit"; }

	// eslint-disable-next-line class-methods-use-this
	getSaveButtonClass() { return "pm-nodeview-save"; }

	// eslint-disable-next-line class-methods-use-this
	getCancelButtonClass() { return "pm-nodeview-cancel"; }

	// eslint-disable-next-line class-methods-use-this
	getEditorClass() { return "pm-nodeview-editor"; }
	
	// eslint-disable-next-line class-methods-use-this
	updateTitle() {}

	// eslint-disable-next-line class-methods-use-this
	renderEditMode() {}

	// eslint-disable-next-line class-methods-use-this
	renderViewMode() {}

	// eslint-disable-next-line class-methods-use-this
	saveEdit(newText) {}
}

exports.BaseSourceEditableNodeView = BaseSourceEditableNodeView;

