/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/anchor.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "anchor";

/*
Serializer for anchor nodes. Two kinds:

1. Name anchor (attributes.name === "true"): outputs " ^id". These are inline
   placeholders produced by the anchor inline rule.

2. Target anchor (attributes.target === "true"): transparent container, just
   serializes children. The name anchor inside the children handles ^id output.
*/
exports.serialize = function(tree,serialize) {
	var anchorId = tree.attributes && tree.attributes.id ? tree.attributes.id.value : "";
	// Name anchor: output " ^id" inline text
	if(tree.attributes && tree.attributes.name) {
		return anchorId ? " ^" + anchorId : "";
	}
	// Target anchor: transparent, just serialize children
	if(!tree.children || tree.children.length === 0) {
		return "";
	}
	var result = [];
	for(var i = 0; i < tree.children.length; i++) {
		result.push(serialize(tree.children[i]));
	}
	return result.join("");
};
