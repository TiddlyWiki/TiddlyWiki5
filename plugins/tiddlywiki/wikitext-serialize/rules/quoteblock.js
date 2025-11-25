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
		var citation = tree.attributes && tree.attributes.class && tree.attributes.class.value ? tree.attributes.class.value.trim() : "";
		var quotePrefix = "<<<" + (citation ? " " + citation : "");
		
		result.push(quotePrefix);
		
		// Process children
		tree.children.forEach(function (child) {
			if(child.type === "element" && child.tag === "p") {
				result.push(serialize(child.children).trim());
			} else if(child.type === "element" && child.tag === "blockquote") {
				// Nested blockquote - add extra < for each level
				var nestedQuote = exports.serialize(child, serialize).trim();
				// Replace all <<< with <<<< to indicate one more level of nesting
				nestedQuote = nestedQuote.replace(/^(<<<+)/gm, function(match) {
					return match + '<';
				});
				result.push(nestedQuote);
			} else if(child.type === "text") {
				// Skip text nodes that are just whitespace or citation
				var text = child.text.trim();
				if(text && text !== citation) {
					result.push(text);
				}
			}
		});
		
		result.push("<<<");  // Closing <<<
	}
	return result.join("\n") + "\n\n";
};
