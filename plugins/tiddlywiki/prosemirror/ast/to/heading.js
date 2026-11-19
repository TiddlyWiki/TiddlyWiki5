/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/heading.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").convertNodes;

function buildHeading(context, node, level) {
	return {
		type: "heading",
		attrs: { level: level },
		content: convertNodes(context, node.children)
	};
}

exports.level = buildHeading;
