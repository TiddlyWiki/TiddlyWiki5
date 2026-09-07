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

exports.serialize = function (tree,serialize,options) {
	options = options || {};
	var rows = [];

	// Helper function to find the marker for a given list container tag and item tag
	function findMarker(listTag, itemTag) {
		for(var key in listTypes) {
			if(listTypes[key].listTag === listTag && listTypes[key].itemTag === itemTag) {
				return key; // Return the marker associated with the list tag and item tag
			}
		}
		return ""; // Return empty string if no matching marker is found
	}

	// Recursive function collecting one row per list item line, with the item
	// positions so the joiners can be recovered from the source
	function collectRows(node, markerPrefix) {
		if(node.type === "element" && isListNode(node)) {
			node.children.forEach(function (child) {
				if(itemTags.includes(child.tag)) {
					// The parser records the full row marker; reconstruct it
					// from the tag nesting only for synthesized trees
					var rowMarker = child.rowMarker || markerPrefix + findMarker(node.tag, child.tag);
					// Each class needs its own dot, eg *.first.second
					var classAttr = child.attributes && child.attributes.class ? "." + child.attributes.class.value.split(" ").join(".") : "";
					/**
					 * same level text nodes may be split into multiple children, and separated by deeper list sub-tree.
					 * We collect same level text nodes into this list, and concat then submit them before enter deeper list.
					 */
					var content = [],
						isFirstRow = true;
					var pushRow = function() {
						// The item span covers exactly its own row line, so the
						// slice preserves marker spacing and content verbatim
						var slice = isFirstRow ? $tw.utils.serializeFromSource(child,{source: options.source, fragments: [rowMarker]}) : null;
						rows.push({
							text: slice !== null && slice.indexOf(rowMarker) === 0 ? slice : rowMarker + classAttr + " " + content.join("").trim(),
							start: child.start,
							end: child.end,
							blankLineBefore: isFirstRow && !!child.blankLineBefore
						});
						content = [];
						isFirstRow = false;
					};
					$tw.utils.each(child.children,function (subNode) {
						if(isListNode(subNode)) {
							// Recursive call for nested lists
							if(content.length > 0) {
								pushRow();
							}
							collectRows(subNode, rowMarker);
						} else {
							content.push(serialize(subNode));
						}
					});
					// prepend the mark to a new line, if it has content (and has or hasn't nested list), or if it has no content and also no nested list
					if(content.length > 0 || child.children.length === 0) {
						pushRow();
					}
				}
			});
		}
	}

	collectRows(tree, "");
	// The parser merges lists across blank lines into a single node; the
	// blankLineBefore flag reproduces the separator, the source gap refines
	// it to the exact bytes
	var source = options.source,
		result = "";
	$tw.utils.each(rows,function(row,index) {
		if(index > 0) {
			var joiner = row.blankLineBefore ? "\n\n" : "\n",
				prev = rows[index - 1];
			if(source && typeof prev.end === "number" && typeof row.start === "number" && row.start >= prev.end) {
				var gap = source.substring(prev.end,row.start);
				if(gap.indexOf("\n") !== -1 && /^\s+$/.test(gap)) {
					joiner = gap;
				}
			}
			result += joiner;
		}
		result += row.text;
	});
	return result;
};
