/*\
title: $:/plugins/tiddlywiki/prosemirror/features/block-placeholder.js
type: application/javascript
module-type: library

ProseMirror plugin that shows a placeholder on empty lines inside
hard_line_breaks_block and code_block nodes.
The placeholder text includes the configured exit shortcut.

\*/

"use strict";

const { Plugin, PluginKey } = require("prosemirror-state");
const { Decoration, DecorationSet } = require("prosemirror-view");

const blockPlaceholderKey = new PluginKey("blockPlaceholder");

function getExitShortcutLabel(wiki) {
	const configTiddler = "$:/config/prosemirror/shortcuts/hardbreak-shift";
	const custom = wiki ? wiki.getTiddlerText(configTiddler, "").trim() : "";
	if(custom === "none") return null;
	return custom || "Shift-Enter";
}

function buildPlaceholderText(wiki) {
	const shortcut = getExitShortcutLabel(wiki);
	if(!shortcut) return "";
	const isMac = typeof navigator !== "undefined"
		? (navigator.userAgentData
			? /mac/i.test(navigator.userAgentData.platform)
			: /Mac|iP(hone|[oa]d)/.test(navigator.platform))
		: false;
	const displayKey = shortcut
		.replace(/Mod-/g, isMac ? "\u2318" : "Ctrl+")
		.replace(/Shift-/g, isMac ? "\u21E7" : "Shift+")
		.replace(/Alt-/g, isMac ? "\u2325" : "Alt+")
		.replace(/Ctrl-/g, isMac ? "\u2303" : "Ctrl+");
	return `Use ${displayKey} to exit the block`;
}

function makePlaceholderWidget(text, pos) {
	return Decoration.widget(pos, () => {
		const span = document.createElement("span");
		span.className = "tc-prosemirror-block-placeholder";
		span.textContent = text;
		return span;
	}, { side: -1, key: `block-placeholder-${pos}` });
}

function buildDecorations(state, placeholderText) {
	if(!placeholderText) return DecorationSet.empty;

	const decos = [];
	const { selection } = state;

	state.doc.descendants((node, pos) => {
		if(node.type.name !== "hard_line_breaks_block" && node.type.name !== "code_block") {
			return true; // continue descending
		}

		if(node.content.size === 0) {
			decos.push(makePlaceholderWidget(placeholderText, pos + 1));
		} else if(node.type.name === "hard_line_breaks_block") {
			const cursorPos = selection.$from.pos;
			const blockStart = pos + 1;
			const blockEnd = pos + 1 + node.content.size;

			if(cursorPos < blockStart || cursorPos > blockEnd) return false;

			let lineStart = blockStart;
			node.forEach((child, offset) => {
				const childPos = blockStart + offset;
				if(child.type.name === "hard_break") {
					if(childPos === lineStart && cursorPos === lineStart) {
						decos.push(makePlaceholderWidget(placeholderText, lineStart));
					}
					lineStart = childPos + 1;
				}
			});
			if(lineStart === blockEnd && cursorPos === lineStart) {
				decos.push(makePlaceholderWidget(placeholderText, lineStart));
			}
		}

		return false;
	});

	return DecorationSet.create(state.doc, decos);
}

function createBlockPlaceholderPlugin(wiki) {
	const placeholderText = buildPlaceholderText(wiki);

	return new Plugin({
		key: blockPlaceholderKey,
		state: {
			init(_, state) {
				return buildDecorations(state, placeholderText);
			},
			apply(tr, oldDecos, oldState, newState) {
				if(tr.docChanged || tr.selectionSet) {
					return buildDecorations(newState, placeholderText);
				}
				return oldDecos;
			}
		},
		props: {
			decorations(state) {
				return this.getState(state);
			}
		}
	});
}

exports.createBlockPlaceholderPlugin = createBlockPlaceholderPlugin;
