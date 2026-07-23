/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/code-block/nodeview.js
type: application/javascript
module-type: library
\*/

"use strict";

const createSafeNodeView = require("$:/plugins/tiddlywiki/prosemirror/blocks/safe-nodeview.js").createSafeNodeView;
const replaceNodeWithOpaqueSource = require("$:/plugins/tiddlywiki/prosemirror/blocks/source-utils.js").replaceNodeWithOpaqueSource;

class CodeBlockNodeView {
	constructor(node, view, getPos) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;

		const container = document.createElement("div");
		container.className = "pm-nodeview pm-nodeview-codeblock";

		const header = document.createElement("span");
		header.className = "pm-nodeview-header";
		header.setAttribute("contenteditable", "false");

		const title = document.createElement("span");
		title.className = "pm-nodeview-title";
		title.textContent = "Code";
		header.appendChild(title);

		const buttons = document.createElement("span");
		buttons.className = "pm-nodeview-buttons";
		const sourceBtn = document.createElement("button");
		sourceBtn.className = "pm-nodeview-btn pm-nodeview-btn-source";
		sourceBtn.type = "button";
		sourceBtn.title = "Edit as source";
		sourceBtn.textContent = "{}";
		sourceBtn.setAttribute("contenteditable", "false");
		sourceBtn.addEventListener("mousedown", stopControlEvent, true);
		sourceBtn.addEventListener("click", (event) => {
			stopControlEvent(event);
			replaceNodeWithOpaqueSource(this.view, this.getPos, this.node);
		}, true);
		buttons.appendChild(sourceBtn);
		header.appendChild(buttons);
		container.appendChild(header);

		const pre = document.createElement("pre");
		const code = document.createElement("code");
		pre.appendChild(code);
		container.appendChild(pre);

		this.dom = container;
		this.contentDOM = code;
	}

	update(node) {
		if(node.type.name !== "code_block") return false;
		this.node = node;
		return true;
	}

	selectNode() {
		this.dom.classList.add("pm-nodeview-selected");
	}

	deselectNode() {
		this.dom.classList.remove("pm-nodeview-selected");
	}

	stopEvent(event) {
		return !!(event && event.target && event.target.closest && event.target.closest(".pm-nodeview-header, .pm-nodeview-btn"));
	}
}

function stopControlEvent(event) {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
}

function createCodeBlockNodeViewPlugin() {
	const Plugin = require("prosemirror-state").Plugin;
	const PluginKey = require("prosemirror-state").PluginKey;

	return new Plugin({
		key: new PluginKey("codeBlockNodeView"),
		props: {
			nodeViews: {
				code_block: createSafeNodeView((node, view, getPos) => new CodeBlockNodeView(node, view, getPos))
			}
		}
	});
}

exports.CodeBlockNodeView = CodeBlockNodeView;
exports.createCodeBlockNodeViewPlugin = createCodeBlockNodeViewPlugin;