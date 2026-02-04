/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/emphasis/bold.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "bold";

exports.serialize = function(tree,serialize) {
	return "''" + serialize(tree.children) + "''";
};
