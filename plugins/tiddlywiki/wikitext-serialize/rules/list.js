/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/list.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "list";

var listTypes = require("$:/core/modules/parsers/wikiparser/rules/list.js").listTypes;
var listTags = Object.values(listTypes).map(function(type) {
	return type.listTag;
});
/*
Check if the child is a nested list or a simple line of list item
*/
function isListNode(node) {
	return node && node.type === "element" && listTags.includes(node.tag);
}
var itemTags = Object.values(listTypes).map(function(type) {
	return type.itemTag;
});

exports.serialize = function (tree,serialize) {
	// Helper function to find the marker for a given list container tag and item tag
	function findMarker(listTag, itemTag) {
		for(var key in listTypes) {
			if(listTypes[key].listTag === listTag && listTypes[key].itemTag === itemTag) {
				return key; // Return the marker associated with the list tag and item tag
			}
		}
		return ""; // Return empty string if no matching marker is found
	}

	// Recursive function to serialize list nodes, handling nested lists and formatting output
	function serializeList(node, markerPrefix) {
		var result = [];
		if(node.type === "element" && isListNode(node)) {
			node.children.forEach(function (child) {
				if(itemTags.includes(child.tag)) {
					var currentMarker = findMarker(node.tag, child.tag);
					// Handle class attributes
					var classAttr = child.attributes && child.attributes.class ? "." + child.attributes.class.value : "";
					/** 
					 * same level text nodes may be split into multiple children, and separated by deeper list sub-tree.
					 * We collect same level text nodes into this list, and concat then submit them before enter deeper list.
					 */
					var content = [];
					$tw.utils.each(child.children,function (subNode) {
						if(isListNode(subNode)) {
							// Recursive call for nested lists
							if(content.length > 0) {
								result.push(markerPrefix + currentMarker + classAttr + " " + content.join("").trim());
								content = [];
							}
							result.push(serializeList(subNode, markerPrefix + currentMarker).trim())
						} else {
							content.push(serialize(subNode)) ;
						}
						return ""; // Default return for unhandled node types
					});
					// prepend `#` mark to a new line, if it has content (and has or hasn't nested list), or if it has no content and also no nested list
					if(content.length > 0 || child.children.length === 0) {
						result.push(markerPrefix + currentMarker + classAttr + " " + content.join("").trim());
						content = [];
					}
				}
			});
		}
		return result.join("\n");
	}

	// Begin serialization from the root node, with an empty string as the initial marker prefix
	return serializeList(tree, "") + "\n\n";
};
