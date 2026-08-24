/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/inline-source/nodeview.js
type: application/javascript
module-type: library

Renders source-backed inline atoms without letting rendered widget DOM become
part of the editable ProseMirror document.

\*/

"use strict";

const OpaqueSourceSandbox = require("$:/plugins/tiddlywiki/prosemirror/blocks/opaque-sandbox.js").OpaqueSourceSandbox;
const parseWikiTextToDoc = require("$:/plugins/tiddlywiki/prosemirror/core/editor-shared.js").parseWikiTextToDoc;
const closeHistory = require("prosemirror-history").closeHistory;

class InlineSourceNodeView {
	constructor(node, view, getPos, parentWidget) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;
		this.parentWidget = parentWidget;
		this.document = view.dom.ownerDocument;
		this.wiki = (parentWidget && parentWidget.wiki) || $tw.wiki;
		this.renderedWidget = null;
		this._destroyed = false;
		const sourceTitle = parentWidget && parentWidget.widget && parentWidget.widget.editTitle;
		this.sandbox = new OpaqueSourceSandbox(this.wiki, (nextText) => {
			if(!this._destroyed && this.view && !this.view.isDestroyed &&
				nextText !== (this.node.attrs.rawText || "")) {
				this.saveSandboxText(nextText);
			}
		}, { sourceTitle: sourceTitle });
		this.dom = this.document.createElement("span");
		this.dom.className = "pm-opaque-inline";
		this.dom.setAttribute("contenteditable", "false");
		this.dom.setAttribute("aria-label", node.attrs.rawText || "Inline WikiText");
		this.content = this.document.createElement("span");
		this.content.className = "pm-opaque-inline-content";
		this.content.setAttribute("aria-hidden", "true");
		this.dom.appendChild(this.content);
		this.render();
	}

	render() {
		this.destroyRenderedWidget();
		while(this.content.firstChild) {
			this.content.removeChild(this.content.firstChild);
		}
		const rawText = this.node.attrs.rawText || "";
		this.dom.title = rawText;
		try {
			const parser = this.wiki.parseText("text/vnd.tiddlywiki", rawText, { parseAsInline: true });
			this.sandbox.ensure(rawText);
			const widget = this.wiki.makeWidget(parser, {
				parentWidget: this.parentWidget || null,
				document: this.document,
				variables: this.sandbox.getVariables()
			});
			widget.render(this.content, null);
			this.renderedWidget = widget;
			if(this.content.childNodes.length > 0) {
				return;
			}
		} catch(e) {
			// The exact source remains in the node even when its preview cannot render.
		}
		this.content.textContent = rawText || "(inline source)";
	}

	saveSandboxText(nextText) {
		const pos = this.getPos();
		if(typeof pos !== "number") {
			return;
		}
		let tr;
		try {
			const docJson = parseWikiTextToDoc(this.wiki, "text/vnd.tiddlywiki", nextText);
			const parsedDoc = this.view.state.schema.nodeFromJSON(docJson);
			if(parsedDoc.childCount === 1 && parsedDoc.firstChild.isTextblock) {
				tr = this.view.state.tr.replaceWith(pos, pos + this.node.nodeSize, parsedDoc.firstChild.content);
			}
		} catch(e) {
			// Keep the changed source atomic if it cannot become valid inline content.
		}
		if(!tr) {
			tr = this.view.state.tr.setNodeMarkup(pos, null, {
				rawText: nextText,
				firstLine: nextText.split("\n")[0] || nextText,
				parseTreeJson: null
			});
		}
		this.view.dispatch(closeHistory(tr));
	}

	destroyRenderedWidget() {
		if(this.renderedWidget) {
			try {
				this.renderedWidget.destroy();
			} catch(e) {
				// Ignore cleanup errors from third-party widgets.
			}
			this.renderedWidget = null;
		}
	}

	update(node) {
		if(node.type !== this.node.type) {
			return false;
		}
		const changed = node.attrs.rawText !== this.node.attrs.rawText ||
			node.attrs.parseTreeJson !== this.node.attrs.parseTreeJson;
		this.node = node;
		this.dom.setAttribute("aria-label", node.attrs.rawText || "Inline WikiText");
		if(changed) {
			this.render();
		}
		return true;
	}

	selectNode() {
		this.dom.classList.add("ProseMirror-selectednode");
	}

	deselectNode() {
		this.dom.classList.remove("ProseMirror-selectednode");
	}

	ignoreMutation() {
		return !!this.dom;
	}

	stopEvent(event) {
		if(!event || !event.target || typeof event.target.closest !== "function" ||
			!this.content.contains(event.target)) {
			return false;
		}
		const interactive = event.target.closest(
			"input, textarea, button, select, option, label, a[href], summary, details, " +
			"[contenteditable='true'], [contenteditable=''], [tabindex], [role='button'], " +
			"[role='checkbox'], [role='textbox'], [role='combobox'], [role='link'], [role='menuitem']"
		);
		return !!(interactive && this.content.contains(interactive));
	}

	destroy() {
		this._destroyed = true;
		this.destroyRenderedWidget();
		this.sandbox.destroy();
	}
}

function createInlineSourceNodeViewPlugin(parentWidget) {
	const Plugin = require("prosemirror-state").Plugin;
	return new Plugin({
		props: {
			nodeViews: {
				opaque_inline: function(node, view, getPos) {
					return new InlineSourceNodeView(node, view, getPos, parentWidget);
				}
			}
		}
	});
}

exports.InlineSourceNodeView = InlineSourceNodeView;
exports.createInlineSourceNodeViewPlugin = createInlineSourceNodeViewPlugin;
