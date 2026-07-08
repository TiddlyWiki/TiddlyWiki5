/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/commentblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "commentblock";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// A pragma area comment chains the rest of the tiddler as its children;
	// the separator is not in the parse tree, so recover it from the source
	var gap = "\n\n";
	if(options.source && typeof tree.end === "number" && tree.children.length && typeof tree.children[0].start === "number" && tree.children[0].start >= tree.end) {
		var sourceGap = options.source.substring(tree.end,tree.children[0].start);
		if(/^\s+$/.test(sourceGap)) {
			gap = sourceGap;
		}
	}
	return tree.text + gap + serialize(tree.children);
};
