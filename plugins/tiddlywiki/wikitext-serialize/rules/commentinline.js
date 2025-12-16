/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/commentinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "commentinline";

exports.serialize = function(tree,serialize) {
	return tree.text;
};
