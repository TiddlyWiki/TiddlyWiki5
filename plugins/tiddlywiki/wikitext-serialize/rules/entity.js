/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/entity.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "entity";

exports.serialize = function(tree,serialize) {
	return tree.entity;
};
