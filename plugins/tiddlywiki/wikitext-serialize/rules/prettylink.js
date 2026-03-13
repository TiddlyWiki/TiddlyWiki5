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
	var anchor = tree.attributes.anchor ? tree.attributes.anchor.value : "";
	
	// Build the target with anchor if present
	var targetWithMark = target + (anchor ? "^" + anchor : "");
	
	// If text equals target (without anchor), we don't need the alias syntax
	if(text === target) {
		return "[[" + targetWithMark + "]]";
	} else {
		return "[[" + text + "|" + targetWithMark + "]]";
	}
};
