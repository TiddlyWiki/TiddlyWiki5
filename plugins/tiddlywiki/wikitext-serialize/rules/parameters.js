/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/parameters.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "parameters";

exports.serialize = function(tree,serialize) {
	var params = tree.orderedAttributes.map(function(param) {
			return param.name + (param.value ? ":" + param.value : "");
	}).join(",");
	return "\\parameters(" + params + ")\n\n" + serialize(tree.children);
};
