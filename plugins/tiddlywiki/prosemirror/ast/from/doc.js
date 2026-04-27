/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/doc.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;

module.exports = function doc(builders, node) {
	return convertNodes(builders, node.content);
};
