/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/typed-block/nodeview.js
type: application/javascript
module-type: library

NodeView for typed_block in ProseMirror.
Renders as an atom block with a type dropdown selector and raw text display,
similar to hard_line_breaks_block but with type controls.

\*/

"use strict";

var COMMON_TYPES = [
	{ value: "", label: "text/plain" },
	{ value: "text/plain", label: "text/plain" },
	{ value: "application/javascript", label: "JavaScript" },
	{ value: "application/json", label: "JSON" },
	{ value: "text/css", label: "CSS" },
	{ value: "text/html", label: "HTML" },
	{ value: "image/svg+xml", label: "SVG" },
	{ value: "text/x-markdown", label: "Markdown" },
	{ value: "text/vnd.tiddlywiki", label: "WikiText" },
	{ value: ".js", label: ".js" },
	{ value: ".css", label: ".css" },
	{ value: ".svg", label: ".svg" },
	{ value: ".html", label: ".html" },
	{ value: ".json", label: ".json" },
	{ value: ".md", label: ".md" },
	{ value: ".tid", label: ".tid" }
];

function TypedBlockNodeView(node, view, getPos) {
	this.node = node;
	this.view = view;
	this.getPos = getPos;

	var container = document.createElement("div");
	container.className = "pm-nodeview pm-nodeview-typedblock";

	// Header with type selector
	var header = document.createElement("div");
	header.className = "pm-nodeview-header";
	header.setAttribute("contenteditable", "false");

	var label = document.createElement("span");
	label.className = "pm-typed-block-prefix";
	label.textContent = "$$$";
	header.appendChild(label);

	var select = document.createElement("select");
	select.className = "pm-typed-block-type-select";
	this._populateSelect(select, node.attrs.parseType);
	header.appendChild(select);

	var self = this;
	select.addEventListener("change", function() {
		var pos = self.getPos();
		if(pos === undefined) return;
		var tr = self.view.state.tr.setNodeMarkup(pos, null, {
			rawText: self.node.attrs.rawText,
			parseType: select.value,
			renderType: self.node.attrs.renderType
		});
		self.view.dispatch(tr);
	});

	select.addEventListener("mousedown", function(e) {
		e.stopPropagation();
	});

	container.appendChild(header);

	// Content area — shows raw text in a pre block
	var content = document.createElement("pre");
	content.className = "pm-typed-block-content";
	content.textContent = node.attrs.rawText || "";
	container.appendChild(content);

	// Edit button (in header)
	var editBtn = document.createElement("button");
	editBtn.className = "pm-nodeview-edit-btn";
	editBtn.textContent = "✎";
	editBtn.title = "Edit";
	editBtn.addEventListener("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
		if(self._editing) {
			self._commitEdit();
		} else {
			self._enterEditMode();
		}
	});
	header.appendChild(editBtn);

	// Delete button (in header)
	var deleteBtn = document.createElement("button");
	deleteBtn.className = "pm-nodeview-delete-btn";
	deleteBtn.textContent = "✕";
	deleteBtn.title = "Delete";
	deleteBtn.addEventListener("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
		var pos = self.getPos();
		if(pos === undefined) return;
		var tr = self.view.state.tr.delete(pos, pos + self.node.nodeSize);
		self.view.dispatch(tr);
	});
	header.appendChild(deleteBtn);

	this.dom = container;
	this.contentDOM = null; // atom node, no contentDOM
	this._select = select;
	this._content = content;
	this._contentParent = container;
	this._editBtn = editBtn;
	this._editing = false;
	this._textarea = null;
}

TypedBlockNodeView.prototype._populateSelect = function(select, currentType) {
	while(select.firstChild) select.removeChild(select.firstChild);
	var found = false;
	for(var i = 0; i < COMMON_TYPES.length; i++) {
		var opt = document.createElement("option");
		opt.value = COMMON_TYPES[i].value;
		opt.textContent = COMMON_TYPES[i].label;
		if(COMMON_TYPES[i].value === currentType) {
			opt.selected = true;
			found = true;
		}
		select.appendChild(opt);
	}
	// If current type is not in common list, add it
	if(!found && currentType) {
		var custom = document.createElement("option");
		custom.value = currentType;
		custom.textContent = currentType;
		custom.selected = true;
		select.insertBefore(custom, select.firstChild);
	}
};

TypedBlockNodeView.prototype._enterEditMode = function() {
	if(this._editing) return;
	this._editing = true;
	var self = this;

	// Replace pre with textarea
	var textarea = document.createElement("textarea");
	textarea.className = "pm-typed-block-textarea";
	textarea.value = this.node.attrs.rawText || "";
	textarea.rows = Math.max(3, (this.node.attrs.rawText || "").split("\n").length);
	this._contentParent.replaceChild(textarea, this._content);
	this._textarea = textarea;

	// Switch edit button to checkmark
	this._editBtn.textContent = "✓";
	this._editBtn.title = "Save";
	this.dom.classList.add("pm-nodeview-editing");

	textarea.focus();

	textarea.addEventListener("keydown", function(e) {
		if(e.key === "Escape") {
			e.preventDefault();
			self._commitEdit();
			self.view.focus();
		}
		e.stopPropagation();
	});
};

TypedBlockNodeView.prototype._commitEdit = function() {
	if(!this._editing) return;
	this._editing = false;
	var newText = this._textarea ? this._textarea.value : this.node.attrs.rawText;

	// Replace textarea back with pre
	var content = document.createElement("pre");
	content.className = "pm-typed-block-content";
	content.textContent = newText;
	this._contentParent.replaceChild(content, this._textarea);
	this._content = content;
	this._textarea = null;

	// Switch button back to edit icon
	this._editBtn.textContent = "✎";
	this._editBtn.title = "Edit";
	this.dom.classList.remove("pm-nodeview-editing");

	// Commit to PM state
	var pos = this.getPos();
	if(pos !== undefined) {
		var tr = this.view.state.tr.setNodeMarkup(pos, null, {
			rawText: newText,
			parseType: this.node.attrs.parseType,
			renderType: this.node.attrs.renderType
		});
		this.view.dispatch(tr);
	}
};

TypedBlockNodeView.prototype.update = function(node) {
	if(node.type.name !== "typed_block") return false;
	this.node = node;
	this._populateSelect(this._select, node.attrs.parseType);
	if(!this._editing) {
		this._content.textContent = node.attrs.rawText || "";
	}
	return true;
};

TypedBlockNodeView.prototype.selectNode = function() {
	this.dom.classList.add("pm-nodeview-selected");
};

TypedBlockNodeView.prototype.deselectNode = function() {
	this.dom.classList.remove("pm-nodeview-selected");
};

TypedBlockNodeView.prototype.stopEvent = function(event) {
	return this.dom.contains(event.target);
};

TypedBlockNodeView.prototype.ignoreMutation = function() {
	return true;
};

function createTypedBlockNodeViewPlugin() {
	var Plugin = require("prosemirror-state").Plugin;
	var PluginKey = require("prosemirror-state").PluginKey;

	return new Plugin({
		key: new PluginKey("typedBlockNodeView"),
		props: {
			nodeViews: {
				typed_block: function(node, view, getPos) {
					return new TypedBlockNodeView(node, view, getPos);
				}
			}
		}
	});
}

exports.TypedBlockNodeView = TypedBlockNodeView;
exports.createTypedBlockNodeViewPlugin = createTypedBlockNodeViewPlugin;
