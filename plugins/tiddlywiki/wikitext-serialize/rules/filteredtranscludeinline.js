/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/filteredtranscludeinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "filteredtranscludeinline";

exports.serialize = function(tree,serialize) {
	var filteredtranscludeblock = require("$:/plugins/tiddlywiki/wikitext-serialize/rules/filteredtranscludeblock.js");
	var result = filteredtranscludeblock.serialize(tree,serialize);
	return result.trimEnd();
};
