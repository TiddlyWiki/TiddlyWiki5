/*\
title: $:/plugins/tiddlywiki/prosemirror/hard-line-breaks-block/nodeview.js
type: application/javascript
module-type: library

NodeView for hard_line_breaks_block in ProseMirror.
Renders as a block with a hover border indicator, while keeping the inner content
directly editable (no separate edit/view modes needed).
Uses the unified pm-nodeview badge pattern.

\*/

"use strict";

/**
 * HardLineBreaksNodeView — NodeView for the hard_line_breaks_block node type.
 * The inner content is always directly editable via contentDOM.
 * A border + label appear on hover to indicate the block boundary.
 */
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
		label.textContent = '"""  Hard Line Breaks  """';
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
}

/**
 * Create a ProseMirror plugin that registers the NodeView for hard_line_breaks_block.
 */
function createHardLineBreaksNodeViewPlugin() {
	const Plugin = require("prosemirror-state").Plugin;
	const PluginKey = require("prosemirror-state").PluginKey;

	return new Plugin({
		key: new PluginKey("hardLineBreaksNodeView"),
		props: {
			nodeViews: {
				hard_line_breaks_block: (node, view, getPos) => {
					return new HardLineBreaksNodeView(node, view, getPos);
				}
			}
		}
	});
}

exports.HardLineBreaksNodeView = HardLineBreaksNodeView;
exports.createHardLineBreaksNodeViewPlugin = createHardLineBreaksNodeViewPlugin;
