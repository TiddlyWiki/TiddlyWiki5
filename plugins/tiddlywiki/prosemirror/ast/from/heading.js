/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/heading.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;

module.exports = function heading(builders, node) {
	return {
		type: "element",
		tag: "h" + node.attrs.level,
		rule: "heading",
		attributes: {},
		children: convertNodes(builders, node.content)
	};
};
