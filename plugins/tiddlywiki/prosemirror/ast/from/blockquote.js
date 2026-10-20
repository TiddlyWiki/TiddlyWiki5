/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/blockquote.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;
const factory = $tw.utils.wikitextParseTree;

module.exports = function blockquote(builders, node) {
	const options = {};
	if(node.attrs && node.attrs.cite) {
		options.cite = [factory.text(node.attrs.cite)];
	}
	return factory.quoteBlock(convertNodes(builders, node.content), options);
};
