/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/commentblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "commentblock";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// A block position comment has no children; the walker owns its separator
	if(!tree.children || !tree.children.length) {
		return tree.text;
	}
	// A pragma area comment chains the rest of the tiddler as its children;
	// the separator is not in the parse tree, so recover it from the source
	var gap = $tw.utils.recoverSourceGap(tree.end,tree.children[0] && tree.children[0].start,{source: options.source}) || "\n\n";
	return tree.text + gap + $tw.utils.serializeChildren(tree,serialize,options);
};
