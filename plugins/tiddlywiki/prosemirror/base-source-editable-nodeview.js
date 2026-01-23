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
	 * Get SVG icon from tiddler
	 */
	getSvgIcon(tiddlerTitle, size = "16pt") {
		const iconTiddler = $tw.wiki.getTiddler(tiddlerTitle);
		if(iconTiddler) {
			const iconText = iconTiddler.fields.text;
			const svgMatch = iconText.match(/<svg[\s\S]*<\/svg>/);
			if(svgMatch) {
				return svgMatch[0].replace(/<<size>>/g, size);
			}
		}
		return null;
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
		deleteBtn.title = "Delete";
		deleteBtn.type = "button";
		deleteBtn.style.display = "none";

		const svg = this.getSvgIcon("$:/core/images/delete-button");
		if(svg) {
			deleteBtn.innerHTML = svg;
		} else {
			deleteBtn.innerHTML = "🗑";
		}

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
		cancelBtn.title = "Cancel";
		cancelBtn.type = "button";
		cancelBtn.style.display = "none"; // Hidden by default, shown in edit mode
		cancelBtn.contentEditable = "false";

		// Get SVG icon
		const svg = this.getSvgIcon("$:/core/images/cancel-button");
		if(svg) {
			cancelBtn.innerHTML = svg;
		} else {
			cancelBtn.innerHTML = "✖";
		}

		const self = this;
		cancelBtn.addEventListener("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
			if(self.isEditMode) {
				self.toggleEditMode(); // Exit edit mode without saving
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
		editBtn.title = "Edit";
		editBtn.type = "button";

		const svg = this.getSvgIcon("$:/core/images/edit-button");
		if(svg) {
			editBtn.innerHTML = svg;
		} else {
			editBtn.innerHTML = "✏️";
		}

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
	 * Toggle between edit and view mode
	 */
	toggleEditMode() {
		this.isEditMode = !this.isEditMode;
		
		if(this.isEditMode) {
			// Switch to save icon
			const svg = this.getSvgIcon("$:/core/images/done-button");
			if(svg) {
				this.editBtn.innerHTML = svg;
			}
			this.editBtn.title = "Save changes";
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
			const svg = this.getSvgIcon("$:/core/images/edit-button");
			if(svg) {
				this.editBtn.innerHTML = svg;
			}
			this.editBtn.title = "Edit";
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
				self.isEditMode = false;
				self.toggleEditMode();
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

	// Override these methods in subclasses
	getHeaderClass() { return "pm-nodeview-header"; }
	getTitleClass() { return "pm-nodeview-title"; }
	getButtonsClass() { return "pm-nodeview-buttons"; }
	getDeleteButtonClass() { return "pm-nodeview-delete"; }
	getEditButtonClass() { return "pm-nodeview-edit"; }
	getSaveButtonClass() { return "pm-nodeview-save"; }
	getEditorClass() { return "pm-nodeview-editor"; }
	
	updateTitle() {}
	renderEditMode() {}
	renderViewMode() {}
	saveEdit(newText) {}
}

exports.BaseSourceEditableNodeView = BaseSourceEditableNodeView;

