/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/parsermode.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "parsermode";

exports.serialize = function(tree,serialize) {
	var mode = tree.parseAsInline ? "inline" : "block";
	return "\\parsermode " + mode + "\n\n" + serialize(tree.children);
};
