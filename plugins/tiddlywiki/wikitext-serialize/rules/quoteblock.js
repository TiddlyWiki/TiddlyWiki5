/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/quoteblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "quoteblock";

exports.serialize = function (tree,serialize) {
	var result = [];
	if(tree.type === "element" && tree.tag === "blockquote") {
		// tree.attributes.class.value: "tc-quote"
		result.push("<<<" + tree.attributes.class.value);
		tree.children.forEach(function (child) {
			if(child.type === "element" && child.tag === "p") {
				result.push(serialize(child.children).trim());
			}
		});
		result.push("<<<");
	}
	return result.join("\n") + "\n\n";
};
