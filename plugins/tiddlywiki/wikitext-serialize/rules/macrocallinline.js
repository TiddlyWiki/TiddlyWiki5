/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/macrocallinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "macrocallinline";

exports.serialize = function (tree,serialize) {
	var macrocallblock = require("$:/plugins/tiddlywiki/wikitext-serialize/rules/macrocallblock.js");
	var result = macrocallblock.serialize(tree,serialize);
	return result.trimEnd();
};
