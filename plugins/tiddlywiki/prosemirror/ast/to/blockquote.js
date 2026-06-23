/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/blockquote.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");

module.exports = function buildBlockquote(context, node) {
	let citeText = null;
	const bodyChildren = [];
	const children = node.children || [];
	for(let index = 0; index < children.length; index++) {
		if(children[index].type === "element" && children[index].tag === "cite") {
			citeText = shared.extractPlainText(children[index]);
		} else {
			bodyChildren.push(children[index]);
		}
	}
	return {
		type: "blockquote",
		attrs: { cite: citeText },
		content: shared.convertNodes(context, bodyChildren)
	};
};
