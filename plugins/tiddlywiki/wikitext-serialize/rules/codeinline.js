/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/codeinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "codeinline";

exports.serialize = function(tree,serialize) {
	return "`" + serialize(tree.children) + "`";
};
