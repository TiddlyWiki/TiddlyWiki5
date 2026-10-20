/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/import.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "import";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	var filter = tree.attributes.filter.value;
	// Siblings below the pragma become children; the separator is not in
	// the parse tree
	var gap = $tw.utils.recoverSourceGap(tree.end,tree.children[0] && tree.children[0].start,{source: options.source}) || "\n";
	return "\\import " + filter + gap + $tw.utils.serializeChildren(tree,serialize,options);
};
