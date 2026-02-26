/*\
title: $:/plugins/tiddlywiki/prosemirror/pragma-block/nodeview.js
type: application/javascript
module-type: library

NodeView for pragma_block and opaque_block atoms in ProseMirror.
Pragma blocks display their first line and can be expanded to edit.
Opaque blocks do the same for unsupported wikitext constructs.

\*/

"use strict";

/**
 * Shared NodeView for both pragma_block and opaque_block.
 * @param {Node} node - ProseMirror node
 * @param {EditorView} view - ProseMirror EditorView
 * @param {Function} getPos - returns current position
 * @param {string} blockType - "pragma" or "opaque"
 */
function SourceBlockNodeView(node, view, getPos, blockType) {
	this.node = node;
	this.view = view;
	this.getPos = getPos;
	this.blockType = blockType;
	this.editing = false;

	// Build DOM
	var prefix = blockType === "pragma" ? "pm-pragma-block" : "pm-opaque-block";
	this.dom = document.createElement("div");
	this.dom.className = prefix;
	this.dom.setAttribute("contenteditable", "false");

	// Label showing first line
	this.label = document.createElement("span");
	this.label.className = prefix + "-label";
	this.label.textContent = node.attrs.firstLine || (blockType === "pragma" ? "(pragma)" : "(block)");
	this.dom.appendChild(this.label);

	// Click to edit
	var self = this;
	this.dom.addEventListener("click", function(e) {
		if(!self.editing) {
			e.preventDefault();
			e.stopPropagation();
			self.startEdit();
		}
	});
}

SourceBlockNodeView.prototype.startEdit = function() {
	if(this.editing) return;
	this.editing = true;
	var prefix = this.blockType === "pragma" ? "pm-pragma-block" : "pm-opaque-block";
	this.dom.classList.add(prefix + "-editing");

	// Hide label
	this.label.style.display = "none";

	// Create textarea
	this.textarea = document.createElement("textarea");
	this.textarea.className = prefix + "-editor";
	this.textarea.value = this.node.attrs.rawText || "";
	this.textarea.rows = Math.max(2, (this.node.attrs.rawText || "").split("\n").length);
	this.dom.appendChild(this.textarea);

	// Create button row
	this.buttonRow = document.createElement("div");
	this.buttonRow.style.cssText = "display:flex;gap:6px;margin-top:4px;justify-content:flex-end;";

	var cancelBtn = document.createElement("button");
	cancelBtn.type = "button";
	cancelBtn.textContent = "Cancel";
	cancelBtn.style.cssText = "padding:2px 10px;font-size:12px;cursor:pointer;";
	var self = this;
	cancelBtn.addEventListener("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
		self.cancelEdit();
	});

	var saveBtn = document.createElement("button");
	saveBtn.type = "button";
	saveBtn.textContent = "Save";
	saveBtn.style.cssText = "padding:2px 10px;font-size:12px;cursor:pointer;background:#2589D8;color:white;border:1px solid #1a6fa8;border-radius:3px;";
	saveBtn.addEventListener("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
		self.saveEdit();
	});

	this.buttonRow.appendChild(cancelBtn);
	this.buttonRow.appendChild(saveBtn);
	this.dom.appendChild(this.buttonRow);

	// Focus textarea
	var textarea = this.textarea;
	setTimeout(function() { textarea.focus(); }, 0);

	// Stop keyboard events from reaching ProseMirror
	this.textarea.addEventListener("keydown", function(e) {
		e.stopPropagation();
		// Escape = cancel, Ctrl/Cmd+Enter = save
		if(e.key === "Escape") {
			self.cancelEdit();
		} else if(e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
			self.saveEdit();
		}
	});
};

SourceBlockNodeView.prototype.cancelEdit = function() {
	this.editing = false;
	var prefix = this.blockType === "pragma" ? "pm-pragma-block" : "pm-opaque-block";
	this.dom.classList.remove(prefix + "-editing");
	if(this.textarea && this.textarea.parentNode) {
		this.textarea.parentNode.removeChild(this.textarea);
	}
	if(this.buttonRow && this.buttonRow.parentNode) {
		this.buttonRow.parentNode.removeChild(this.buttonRow);
	}
	this.textarea = null;
	this.buttonRow = null;
	this.label.style.display = "";
	this.view.focus();
};

SourceBlockNodeView.prototype.saveEdit = function() {
	var newRawText = this.textarea ? this.textarea.value : this.node.attrs.rawText;
	var newFirstLine = newRawText.split("\n")[0] || newRawText;
	this.cancelEdit();

	// Update the node attrs
	var pos = this.getPos();
	if(typeof pos !== "number") return;
	var tr = this.view.state.tr.setNodeMarkup(pos, null, {
		rawText: newRawText,
		firstLine: newFirstLine.trim()
	});
	this.view.dispatch(tr);
};

SourceBlockNodeView.prototype.update = function(node) {
	if(node.type.name !== this.node.type.name) return false;
	this.node = node;
	if(!this.editing) {
		this.label.textContent = node.attrs.firstLine || (this.blockType === "pragma" ? "(pragma)" : "(block)");
	}
	return true;
};

SourceBlockNodeView.prototype.stopEvent = function(event) {
	// When editing, stop all events from reaching ProseMirror
	if(this.editing) return true;
	return false;
};

SourceBlockNodeView.prototype.ignoreMutation = function() {
	return true;
};

SourceBlockNodeView.prototype.destroy = function() {
	// Cleanup
	this.textarea = null;
	this.buttonRow = null;
};

/**
 * Create a ProseMirror plugin that registers NodeViews for pragma_block and opaque_block.
 */
function createPragmaBlockNodeViewPlugin(hostWidget) {
	var Plugin = require("prosemirror-state").Plugin;
	return new Plugin({
		props: {
			nodeViews: {
				pragma_block: function(node, view, getPos) {
					return new SourceBlockNodeView(node, view, getPos, "pragma");
				},
				opaque_block: function(node, view, getPos) {
					return new SourceBlockNodeView(node, view, getPos, "opaque");
				}
			}
		}
	});
}

exports.createPragmaBlockNodeViewPlugin = createPragmaBlockNodeViewPlugin;
exports.SourceBlockNodeView = SourceBlockNodeView;
