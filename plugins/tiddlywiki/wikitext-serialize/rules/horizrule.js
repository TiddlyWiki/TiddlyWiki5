/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/horizrule.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "horizrule";

exports.serialize = function(tree,serialize) {
	// The dash count stays normalized by choice
	return "---";
};
