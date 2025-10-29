/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/styleinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "styleinline";

exports.serialize = function(tree,serialize) {
	var result = "@@";
	// Add styles if present
	if(tree.attributes && tree.attributes.style) {
		result += tree.attributes.style.value.trim();
	}
	// Add classes if present
	if(tree.attributes && tree.attributes.class) {
		result += "." + tree.attributes.class.value.trim().split(" ").join(".");
	}
	var children = serialize(tree.children);
	// Ensure at least one space after the style/class
	if(children && children[0] !== " ") {
		result += " ";
	}
	result += children + "@@";
	return result;
};
