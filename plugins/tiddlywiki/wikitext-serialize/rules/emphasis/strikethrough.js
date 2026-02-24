/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/emphasis/strikethrough.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "strikethrough";

exports.serialize = function(tree,serialize) {
	return "~~" + serialize(tree.children) + "~~";
};
