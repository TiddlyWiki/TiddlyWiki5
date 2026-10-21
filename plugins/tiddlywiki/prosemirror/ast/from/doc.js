/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/doc.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;

function isEmptyParagraph(node) {
	return node && node.type === "paragraph" && (!node.content || node.content.length === 0);
}

module.exports = function doc(builders, node) {
	if(node.content && node.content.length === 1 && isEmptyParagraph(node.content[0])) {
		return [];
	}
	return convertNodes(builders, node.content);
};
