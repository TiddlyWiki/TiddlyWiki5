/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/transcludeinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "transcludeinline";

exports.serialize = function(tree,serialize,options) {
	var transcludeblock = require("$:/plugins/tiddlywiki/wikitext-serialize/rules/transcludeblock.js");
	return transcludeblock.serialize(tree,serialize,options);
};
