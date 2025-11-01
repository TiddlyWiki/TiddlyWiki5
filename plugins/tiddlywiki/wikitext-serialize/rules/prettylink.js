/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/prettylink.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "prettylink";

exports.serialize = function(tree,serialize) {
	var text = tree.children[0].text;
	var target = tree.attributes.to ? tree.attributes.to.value : tree.attributes.href.value;
	var blockMark = tree.attributes.toBlockMark ? tree.attributes.toBlockMark.value : "";
	
	// Build the target with block mark if present
	var targetWithMark = target + (blockMark ? "^" + blockMark : "");
	
	// If text equals target (without block mark), we don't need the alias syntax
	if(text === target) {
		return "[[" + targetWithMark + "]]";
	} else {
		return "[[" + text + "|" + targetWithMark + "]]";
	}
};
