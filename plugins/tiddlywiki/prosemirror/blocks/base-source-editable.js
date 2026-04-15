/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/base-source-editable.js
type: application/javascript
module-type: library

Base class for node views that have an edit badge (images, widgets, links, etc.)
All subclasses share a unified bottom-right badge pattern.

\*/

"use strict";

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
		this.cancelBtn = null;
		this.contentContainer = null;
		this.selected = false;
		this.isEditMode = false;
		this._titleEl = null;
	}

	getLanguageString(suffix, fallback) {
		return $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/" + suffix, fallback);
	}

	getSvgIcon(tiddlerTitle, size = "1em") {
		try {
			const htmlStr = $tw.wiki.renderTiddler("text/html", tiddlerTitle, {
				variables: { size }
			});
			if(!htmlStr) return null;
			const container = document.createElement("div");
			container.innerHTML = htmlStr;
			return container.querySelector("svg") || null;
		} catch(e) {
			return null;
		}
	}

	setButtonIcon(button, tiddlerTitle, fallbackText) {
		const svgEl = this.getSvgIcon(tiddlerTitle);
		if(svgEl) {
			button.innerHTML = "";
			button.appendChild(document.importNode(svgEl, true));
		} else {
			button.textContent = fallbackText || "\u2022";
		}
	}

	createHeader(titleText) {
		const header = document.createElement("span");
		header.className = "pm-nodeview-header";
		header.contentEditable = "false";

		const title = document.createElement("span");
		title.className = "pm-nodeview-title";
		title.textContent = titleText;

		const buttons = document.createElement("span");
		buttons.className = "pm-nodeview-buttons";

		const editBtn = this._createButton("$:/core/images/edit-button", "E", this.getLanguageString("Buttons/Edit", "Edit"));
		const deleteBtn = this._createButton("$:/core/images/delete-button", "\u00D7", this.getLanguageString("Buttons/Delete", "Delete"));
		const cancelBtn = this._createButton("$:/core/images/cancel-button", "\u00D7", this.getLanguageString("Buttons/Cancel", "Cancel"));

		editBtn.classList.add("pm-nodeview-btn-edit");
		deleteBtn.classList.add("pm-nodeview-btn-delete");
		cancelBtn.classList.add("pm-nodeview-btn-cancel");

		deleteBtn.style.display = "none";
		cancelBtn.style.display = "none";

		editBtn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			if(this.isEditMode) {
				this.commitEdit();
			} else {
				this.enterEditMode();
			}
			return false;
		}, true);

		editBtn.addEventListener("mousedown", (e) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
		}, true);

		deleteBtn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			this.handleDelete();
		}, true);

		deleteBtn.addEventListener("mousedown", (e) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
		}, true);

		cancelBtn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.cancelEdit();
		}, true);

		cancelBtn.addEventListener("mousedown", (e) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
		}, true);

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

	_createButton(iconTiddler, fallback, tooltip) {
		const btn = document.createElement("button");
		btn.className = "pm-nodeview-btn";
		btn.title = tooltip;
		btn.type = "button";
		btn.contentEditable = "false";
		this.setButtonIcon(btn, iconTiddler, fallback);
		return btn;
	}

	enterEditMode() {
		if(this.isEditMode) return;
		this.isEditMode = true;
		if(this.dom) this.dom.classList.add("pm-nodeview-editing");

		this.setButtonIcon(this.editBtn, "$:/core/images/done-button", "\u2713");
		this.editBtn.title = this.getLanguageString("Buttons/SaveChanges", "Save changes");

		if(this.deleteBtn) this.deleteBtn.style.display = "";
		if(this.cancelBtn) this.cancelBtn.style.display = "";
		if(this.editBtn.parentNode) this.editBtn.parentNode.appendChild(this.editBtn);

		this.renderEditMode();
	}

	cancelEdit() {
		if(!this.isEditMode) return;
		this.isEditMode = false;
		if(this.dom) this.dom.classList.remove("pm-nodeview-editing");

		this.setButtonIcon(this.editBtn, "$:/core/images/edit-button", "E");
		this.editBtn.title = this.getLanguageString("Buttons/Edit", "Edit");

		if(this.deleteBtn) this.deleteBtn.style.display = "none";
		if(this.cancelBtn) this.cancelBtn.style.display = "none";

		this.renderViewMode();
	}

	commitEdit() {
		if(!this.isEditMode) return;
		const editValue = this.getEditValue();
		this.isEditMode = false;
		if(this.dom) this.dom.classList.remove("pm-nodeview-editing");

		this.setButtonIcon(this.editBtn, "$:/core/images/edit-button", "E");
		this.editBtn.title = this.getLanguageString("Buttons/Edit", "Edit");

		if(this.deleteBtn) this.deleteBtn.style.display = "none";
		if(this.cancelBtn) this.cancelBtn.style.display = "none";

		this.saveEdit(editValue);
	}

	createEditTextarea(initialValue, rows = 2) {
		const textarea = document.createElement("textarea");
		textarea.className = "pm-nodeview-editor";
		textarea.value = initialValue;
		textarea.rows = rows;

		textarea.addEventListener("keydown", (e) => {
			if(e.key === "Escape") {
				e.preventDefault();
				this.cancelEdit();
			} else if(e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				this.commitEdit();
			}
		});

		return textarea;
	}

	createEditForm(fields) {
		const form = document.createElement("div");
		form.className = "pm-nodeview-form";

		for(const field of fields) {
			const row = document.createElement("div");
			row.className = "pm-nodeview-form-row";

			const label = document.createElement("label");
			label.className = "pm-nodeview-form-label";
			label.textContent = field.label;

			const input = document.createElement("input");
			input.className = "pm-nodeview-form-input";
			input.type = field.type || "text";
			input.value = field.value || "";
			input.dataset.key = field.key;
			input.placeholder = field.placeholder || "";

			input.addEventListener("keydown", (e) => {
				if(e.key === "Escape") {
					e.preventDefault();
					this.cancelEdit();
				} else if(e.key === "Enter") {
					e.preventDefault();
					this.commitEdit();
				}
			});

			row.appendChild(label);
			row.appendChild(input);
			form.appendChild(row);
		}

		return form;
	}

	getEditValue() {
		if(this.contentContainer) {
			const textarea = this.contentContainer.querySelector(".pm-nodeview-editor");
			if(textarea) return textarea.value;
			const form = this.contentContainer.querySelector(".pm-nodeview-form");
			if(form) {
				const result = {};
				for(const input of form.querySelectorAll(".pm-nodeview-form-input")) {
					result[input.dataset.key] = input.value;
				}
				return result;
			}
		}
		return "";
	}

	handleDelete() {
		const pos = this.getPos();
		if(typeof pos !== "number") return;
		const tr = this.view.state.tr.delete(pos, pos + this.node.nodeSize);
		this.view.dispatch(tr);
	}

	selectNode() {
		this.selected = true;
		if(this.dom) this.dom.classList.add("pm-nodeview-selected");
	}

	deselectNode() {
		this.selected = false;
		if(this.dom) this.dom.classList.remove("pm-nodeview-selected");
	}

	update(node) {
		if(node.type !== this.node.type) return false;
		this.node = node;
		this.updateTitle();
		if(!this.isEditMode) {
			this.renderViewMode();
		}
		return true;
	}

	destroy() {
		// Subclasses can override
	}

	stopEvent() {
		return this.isEditMode;
	}

	ignoreMutation() {
		return true;
	}

	// Override in subclasses
	updateTitle() {}
	renderEditMode() {}
	renderViewMode() {}
	saveEdit(_value) {}
}

exports.BaseSourceEditableNodeView = BaseSourceEditableNodeView;
