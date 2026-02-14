/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/emphasis/superscript.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "superscript";

exports.serialize = function(tree,serialize) {
	return "^^" + serialize(tree.children) + "^^";
};
