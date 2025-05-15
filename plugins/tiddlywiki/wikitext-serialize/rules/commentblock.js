/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/commentblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "commentblock";

exports.serialize = function(tree,serialize) {
	return tree.text + "\n\n" + serialize(tree.children);
};
