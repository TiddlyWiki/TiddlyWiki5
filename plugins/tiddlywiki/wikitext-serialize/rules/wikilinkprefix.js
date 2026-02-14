/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/wikilinkprefix.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "wikilinkprefix";

exports.serialize = function(tree,serialize) {
	var serialized = $tw.config.textPrimitives.unWikiLink;
	serialized += tree.text;
	return serialized;
};
