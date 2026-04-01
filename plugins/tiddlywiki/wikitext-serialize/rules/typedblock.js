/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/typedblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "typedblock";

exports.serialize = function (tree,serialize) {
	if(tree.type === "void") {
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
		return "$$$" + tree.parseType + (tree.renderType ? " > " + tree.renderType : "") + anchorSuffix + "\n" + tree.text + "\n$$$\n\n";
	}
	return "";
};
