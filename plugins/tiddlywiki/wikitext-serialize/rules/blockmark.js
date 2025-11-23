/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/blockmark.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "blockmark";

exports.serialize = function(tree,serialize) {
	var id = tree.attributes.id ? tree.attributes.id.value : "";
	var previousSibling = tree.attributes.previousSibling && tree.attributes.previousSibling.value === "yes";
	
	// If previousSibling is true, the block mark is at the start of a new line
	// If false, it's inline at the end of the line with a space before it
	if(previousSibling) {
		return "^" + id;
	} else {
		return " ^" + id;
	}
};
