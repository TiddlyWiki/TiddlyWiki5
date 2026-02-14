/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/emphasis/underscore.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "underscore";

exports.serialize = function(tree,serialize) {
	return "__" + serialize(tree.children) + "__";
};
