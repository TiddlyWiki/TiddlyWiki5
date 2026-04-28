/*\
title: $:/plugins/tiddlywiki/prosemirror/features/editor-placeholder.js
type: application/javascript
module-type: library

Editor-wide placeholder behavior for an empty ProseMirror document.

\*/

"use strict";

const Plugin = require("prosemirror-state").Plugin;

function defaultIsEmpty(state) {
	return state.doc.childCount === 1 && state.doc.firstChild && state.doc.firstChild.isTextblock && state.doc.firstChild.content.size === 0;
}

function placeholderPlugin(options = {}) {
	const text = typeof options.text === "string" ? options.text : "Type / for commands";
	const isEmpty = typeof options.isEmpty === "function" ? options.isEmpty : defaultIsEmpty;

	return new Plugin({
		props: {
			decorations(state) {
				if(!isEmpty(state)) {
					return null;
				}
				return null;
			}
		},
		view(view) {
			const dom = view.dom;
			const update = () => {
				const empty = isEmpty(view.state);
				if(empty) {
					dom.classList.add("tw-prosemirror-empty");
					dom.setAttribute("data-placeholder", text);
				} else {
					dom.classList.remove("tw-prosemirror-empty");
					dom.removeAttribute("data-placeholder");
				}
			};
			update();
			return {
				update,
				destroy() {
					dom.classList.remove("tw-prosemirror-empty");
					dom.removeAttribute("data-placeholder");
				}
			};
		}
	});
}

module.exports = {
	placeholderPlugin
};