/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/macrocallinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "macrocallinline";

exports.serialize = function (tree,serialize,options) {
	var macrocallblock = require("$:/plugins/tiddlywiki/wikitext-serialize/rules/macrocallblock.js");
	return macrocallblock.serialize(tree,serialize,options);
};
