/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/div.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");

module.exports = function buildDiv(context, node) {
	const classAttr = node.attributes && node.attributes.class && node.attributes.class.value;
	if(classAttr && classAttr.split(/\s+/).indexOf("markdown") !== -1) {
		return shared.convertNodes(context, node.children);
	}
	return shared.buildOpaqueFromNode(node);
};
