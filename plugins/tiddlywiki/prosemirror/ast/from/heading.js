/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/heading.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;
const factory = $tw.utils.wikitextParseTree;

module.exports = function heading(builders, node) {
	return factory.heading(node.attrs.level, convertNodes(builders, node.content));
};
