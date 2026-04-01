/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/codeblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "codeblock";

exports.serialize = function(tree,serialize) {
	var language = tree.attributes.language.value;
	var anchorSuffix = "";
	// Check for name anchor in opening line nodes
	if(tree.openingLineNodes) {
		for(var i = 0; i < tree.openingLineNodes.length; i++) {
			var node = tree.openingLineNodes[i];
			if(node.type === "anchor" && node.attributes && node.attributes.name) {
				anchorSuffix = " ^" + node.attributes.id.value;
			}
		}
	}
	return "```" + language + anchorSuffix + "\n" + tree.attributes.code.value + "\n```\n\n";
};
