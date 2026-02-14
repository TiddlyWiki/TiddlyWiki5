/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/transcludeinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "transcludeinline";

exports.serialize = function(tree,serialize) {
	var transcludeblock = require("$:/plugins/tiddlywiki/wikitext-serialize/rules/transcludeblock.js");
	var result = transcludeblock.serialize(tree,serialize);
	return result.trimEnd();
};
