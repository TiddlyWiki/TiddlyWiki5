/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/typed-block/nodeview.js
type: application/javascript
module-type: library

NodeView for typed_block in ProseMirror.
Uses the shared BaseSourceEditableNodeView so the header/badge sits in the
bottom-right corner with the same edit/delete affordances as pragma/widget.

\*/

"use strict";

const BaseSourceEditableNodeView = require("$:/plugins/tiddlywiki/prosemirror/blocks/base-source-editable.js").BaseSourceEditableNodeView;

// Module-level flag: when a typed_block is inserted via slash menu,
// set this to true before dispatching the transaction. The next
// nodeview constructor will consume this flag and auto-enter edit mode.
var _pendingAutoEdit = false;

function scheduleNextAutoEdit() {
	_pendingAutoEdit = true;
}

exports.scheduleNextAutoEdit = scheduleNextAutoEdit;

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

var CODE_RENDER_TYPES = {
	"application/javascript": true,
	"text/css": true,
	"application/json": true,
	".js": true,
	".css": true,
	".json": true
};

class TypedBlockNodeView extends BaseSourceEditableNodeView {
	constructor(node, view, getPos) {
		super(node, view, getPos, null);
		this.contentEl = null;
		this._select = null;

		this._createDOM();

		// Consume the pending auto-edit flag and enter edit mode on next frame
		if(_pendingAutoEdit) {
			_pendingAutoEdit = false;
			requestAnimationFrame(() => {
				if(!this.isEditMode) this.enterEditMode();
			});
		}
	}

	_createDOM() {
		const container = document.createElement("div");
		container.className = "pm-nodeview pm-nodeview-typedblock";
		container.setAttribute("contenteditable", "false");

		const header = this.createHeader(this._getTitleText());
		// Insert a type selector ahead of the buttons so it stays inside the
		// shared bottom-right badge layout instead of floating at the top.
		const select = this._buildTypeSelect();
		const buttons = header.querySelector(".pm-nodeview-buttons");
		if(buttons) {
			header.insertBefore(select, buttons);
		} else {
			header.appendChild(select);
		}
		container.appendChild(header);

		const content = document.createElement("div");
		content.className = "pm-nodeview-content pm-typed-block-content";
		container.appendChild(content);

		this.contentEl = content;
		this.contentContainer = content;
		this.dom = container;
		this._select = select;

		this.renderViewMode();
	}

	_getTitleText() {
		const type = this.node.attrs.parseType || "text/plain";
		return "$$$ " + type;
	}

	_buildTypeSelect() {
		const select = document.createElement("select");
		select.className = "pm-typed-block-type-select pm-nodeview-control";
		select.setAttribute("contenteditable", "false");
		this._populateSelect(select, this.node.attrs.parseType);

		select.addEventListener("change", () => {
			const pos = this.getPos();
			if(typeof pos !== "number") return;
			const tr = this.view.state.tr.setNodeMarkup(pos, null, {
				rawText: this.node.attrs.rawText,
				parseType: select.value,
				renderType: this.node.attrs.renderType
			});
			this.view.dispatch(tr);
		});
		// Keep PM from selecting the surrounding node on mousedown,
		// so the dropdown opens normally.
		select.addEventListener("mousedown", (e) => {
			e.stopPropagation();
		});
		return select;
	}

	_populateSelect(select, currentType) {
		while(select.firstChild) select.removeChild(select.firstChild);
		let found = false;
		for(let i = 0; i < COMMON_TYPES.length; i++) {
			const opt = document.createElement("option");
			opt.value = COMMON_TYPES[i].value;
			opt.textContent = COMMON_TYPES[i].label;
			if(COMMON_TYPES[i].value === currentType) {
				opt.selected = true;
				found = true;
			}
			select.appendChild(opt);
		}
		if(!found && currentType) {
			const custom = document.createElement("option");
			custom.value = currentType;
			custom.textContent = currentType;
			custom.selected = true;
			select.insertBefore(custom, select.firstChild);
		}
		select.value = currentType || "";
	}

	updateTitle() {
		if(this._titleEl) {
			this._titleEl.textContent = this._getTitleText();
		}
	}

	renderViewMode() {
		if(!this.contentEl) return;
		this._renderContent(this.contentEl, this.node.attrs.rawText, this.node.attrs.parseType);
	}

	renderEditMode() {
		if(!this.contentEl) return;
		while(this.contentEl.firstChild) this.contentEl.removeChild(this.contentEl.firstChild);

		const initial = this.node.attrs.rawText || "";
		const textarea = this.createEditTextarea(initial, Math.max(3, initial.split("\n").length));
		this.contentEl.appendChild(textarea);
		setTimeout(() => { textarea.focus(); }, 0);
	}

	saveEdit(newText) {
		const text = newText != null ? newText : (this.node.attrs.rawText || "");
		const pos = this.getPos();
		if(typeof pos !== "number") return;
		const tr = this.view.state.tr.setNodeMarkup(pos, null, {
			rawText: text,
			parseType: this.node.attrs.parseType,
			renderType: this.node.attrs.renderType
		});
		this.view.dispatch(tr);
	}

	_renderContent(el, rawText, parseType) {
		while(el.firstChild) el.removeChild(el.firstChild);
		this.clearEmptyPlaceholder();
		if(!rawText) {
			this.renderEmptyPlaceholder();
			return;
		}
		const renderType = parseType || "";
		if(CODE_RENDER_TYPES[renderType]) {
			const pre = document.createElement("pre");
			pre.className = "pm-typed-block-source";
			pre.textContent = rawText;
			el.appendChild(pre);
			return;
		}
		try {
			const html = $tw.wiki.renderText("text/html", renderType || "text/vnd.tiddlywiki", rawText);
			if(html) {
				el.innerHTML = html;
				return;
			}
		} catch(e) {
			// fall through
		}
		const fallback = document.createElement("pre");
		fallback.className = "pm-typed-block-source";
		fallback.textContent = rawText;
		el.appendChild(fallback);
	}

	update(node) {
		if(node.type.name !== "typed_block") return false;
		const typeChanged = node.attrs.parseType !== this.node.attrs.parseType;
		this.node = node;
		if(typeChanged && this._select) {
			this._populateSelect(this._select, node.attrs.parseType);
		}
		this.updateTitle();
		if(!this.isEditMode) {
			this.renderViewMode();
		}
		return true;
	}
}

function createTypedBlockNodeViewPlugin() {
	const Plugin = require("prosemirror-state").Plugin;
	const PluginKey = require("prosemirror-state").PluginKey;

	return new Plugin({
		key: new PluginKey("typedBlockNodeView"),
		props: {
			nodeViews: {
				typed_block: (node, view, getPos) => new TypedBlockNodeView(node, view, getPos)
			}
		}
	});
}

exports.TypedBlockNodeView = TypedBlockNodeView;
exports.createTypedBlockNodeViewPlugin = createTypedBlockNodeViewPlugin;
