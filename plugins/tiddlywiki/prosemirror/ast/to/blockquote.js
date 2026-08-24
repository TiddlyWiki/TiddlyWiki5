/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/blockquote.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");

module.exports = function buildBlockquote(context, node) {
	let citeText = null;
	const classValue = node.attributes && node.attributes.class && node.attributes.class.value || "";
	const customClasses = classValue.split(/\s+/).filter(function(className) {
		return className && className !== "tc-quote";
	});
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
		attrs: {
			cite: citeText,
			twClasses: customClasses.length > 0 ? customClasses.join(" ") : null
		},
		content: shared.convertNodes(context, bodyChildren)
	};
};
