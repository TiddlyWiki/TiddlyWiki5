/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/image.js
type: application/javascript
module-type: library
\*/

"use strict";

module.exports = function image(context, node) {
	const getImageAttrsFromWikiAstImageNode = require("$:/plugins/tiddlywiki/prosemirror/blocks/image/utils.js").getImageAttrsFromWikiAstImageNode;
	return {
		type: "image",
		attrs: getImageAttrsFromWikiAstImageNode(node)
	};
};
