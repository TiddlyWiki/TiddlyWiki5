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
		var hasNestedQuote = false;
		tree.children.forEach(function (child, index) {
			if(child.type === "element" && child.tag === "p") {
				var content = serialize(child.children).trim();
				// If there's a nested quote after this, add blank line after paragraph
				var nextChild = tree.children[index + 1];
				if(nextChild && nextChild.type === "element" && nextChild.tag === "blockquote") {
					result.push(content);
					result.push(""); // Blank line before nested quote
				} else {
					result.push(content);
				}
			} else if(child.type === "element" && child.tag === "blockquote") {
				hasNestedQuote = true;
				// Nested blockquote - add extra < for each level
				var nestedQuote = exports.serialize(child, serialize).trim();
				// Replace all <<< with <<<< to indicate one more level of nesting
				nestedQuote = nestedQuote.replace(/^(<<<+)/gm, function(match) {
					return match + "<";
				});
				result.push(nestedQuote);
				result.push(""); // Always add blank line after nested quote
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
