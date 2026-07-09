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
	var gap = $tw.utils.recoverSourceGap(tree.end,tree.children[0] && tree.children[0].start,{source: options.source}) || "\n\n";
	return tree.text + gap + serialize(tree.children);
};
