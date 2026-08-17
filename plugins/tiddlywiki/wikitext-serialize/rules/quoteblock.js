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
		var classValue = tree.attributes && tree.attributes["class"] ? tree.attributes["class"].value : "tc-quote";
		// Strip the default tc-quote class; only emit additional custom classes
		var extraClasses = classValue.split(" ").filter(function(c) { return c !== "tc-quote" && c !== ""; }).join(" ");
		result.push("<<<" + (extraClasses ? extraClasses : ""));
		var citeText = "";
		tree.children.forEach(function (child) {
			if(child.type === "element" && child.tag === "p") {
				result.push(serialize(child.children).trim());
			} else if(child.type === "element" && child.tag === "cite") {
				// Preserve cite text for the closing <<<
				citeText = serialize(child.children).trim();
			}
		});
		result.push("<<<" + (citeText ? citeText : ""));
	}
	return result.join("\n") + "\n\n";
};
