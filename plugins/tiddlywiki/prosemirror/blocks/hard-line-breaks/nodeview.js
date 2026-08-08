/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/hard-line-breaks/nodeview.js
type: application/javascript
module-type: library

NodeView for hard_line_breaks_block in ProseMirror.
Renders as a block with a hover border indicator, while keeping the inner content
directly editable (no separate edit/view modes needed).
Uses the unified pm-nodeview badge pattern.

\*/

"use strict";

const createSafeNodeView = require("$:/plugins/tiddlywiki/prosemirror/blocks/safe-nodeview.js").createSafeNodeView;
const replaceNodeWithOpaqueSource = require("$:/plugins/tiddlywiki/prosemirror/blocks/source-utils.js").replaceNodeWithOpaqueSource;

class HardLineBreaksNodeView {
	constructor(node, view, getPos) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;

		const container = document.createElement("div");
		container.className = "pm-nodeview pm-nodeview-hardbreaks";

		// Label badge — shows on hover via .pm-nodeview-header
		const label = document.createElement("span");
		label.className = "pm-nodeview-header";
		label.setAttribute("contenteditable", "false");
		const title = document.createElement("span");
		title.className = "pm-nodeview-title";
		title.textContent = '"""  Hard Line Breaks  """';
		label.appendChild(title);
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
		label.appendChild(buttons);
		container.appendChild(label);

		const content = document.createElement("div");
		content.className = "pm-nodeview-content";
		container.appendChild(content);

		this.dom = container;
		this.contentDOM = content;
	}

	update(node) {
		if(node.type.name !== "hard_line_breaks_block") return false;
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

function createHardLineBreaksNodeViewPlugin() {
	const Plugin = require("prosemirror-state").Plugin;
	const PluginKey = require("prosemirror-state").PluginKey;

	return new Plugin({
		key: new PluginKey("hardLineBreaksNodeView"),
		props: {
			nodeViews: {
				hard_line_breaks_block: createSafeNodeView((node, view, getPos) => new HardLineBreaksNodeView(node, view, getPos))
			}
		}
	});
}

exports.HardLineBreaksNodeView = HardLineBreaksNodeView;
exports.createHardLineBreaksNodeViewPlugin = createHardLineBreaksNodeViewPlugin;
