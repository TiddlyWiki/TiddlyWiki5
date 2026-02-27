/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/emphasis/subscript.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "subscript";

exports.serialize = function(tree,serialize) {
	return ",," + serialize(tree.children) + ",,";
};
