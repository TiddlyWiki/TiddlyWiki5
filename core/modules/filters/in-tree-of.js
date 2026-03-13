/*\
title: $:/core/modules/filters/in-tree-of.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if tiddlers are in a tree with a specified root.

By default (no second operand), uses the tag hierarchy (getTiddlersWithTag).
A second operand `,[fieldname]` specifies an alternative field whose value is treated
as the list of children for each node (e.g. `,[list]` uses the `list` field).

The optional `:inclusive` suffix also matches the root tiddler itself.
Prefixing with `!` inverts the result, returning only those tiddlers NOT in the tree.

Syntax examples:
  [in-tree-of[root]]                      -- tag tree rooted at "root"
  [in-tree-of:inclusive[root]]            -- tag tree, root itself included
  [in-tree-of[root],[list]]               -- list-field tree
  [in-tree-of:inclusive[root],[list]]     -- list-field tree, root itself included
  [in-tree-of[root],<fieldVar>]           -- field name from variable
  [in-tree-of[root],{Config!!treeField}]  -- field name from tiddler field

\*/

"use strict";

exports["in-tree-of"] = function(source,operator,options) {
	var rootTiddler = operator.operands[0];
	// Second operand (optional): the field name to use as tree edges.
	// Empty / absent means use the tag tree (getTiddlersWithTag).
	var fieldName = operator.operands[1] || "";
	// With the `:inclusive` suffix, the root tiddler itself is included in results if it appears in input
	var isInclusive = operator.suffix === "inclusive";
	// With the `!` prefix, output tiddlers that are NOT in the tree instead
	var isNotInTree = operator.prefix === "!";

	var sourceTiddlers = new Set();
	var firstTiddler;

	source(function(tiddler,title) {
		sourceTiddlers.add(title);
		if(firstTiddler === undefined) {
			firstTiddler = tiddler;
		}
	});

	// Single-input fast path (optimised for cascade / fileSystemPath usage):
	// When there is exactly one input and we are not inverting, check membership
	// directly without building the full descendant Set.
	if(sourceTiddlers.size === 1 && !isNotInTree) {
		var theOnlyTiddlerTitle = Array.from(sourceTiddlers)[0];
		if(fieldName) {
			// Field-tree fast path: check whether the root tiddler's field directly lists the input
			var rootTiddlerObj = options.wiki.getTiddler(rootTiddler);
			if(rootTiddlerObj) {
				var rootChildren = $tw.utils.parseStringArray(rootTiddlerObj.fields[fieldName]) || [];
				if(rootChildren.indexOf(theOnlyTiddlerTitle) !== -1) {
					return [theOnlyTiddlerTitle];
				}
			}
		} else {
			// Tag-tree fast path: check whether the input is directly tagged with the root
			if(firstTiddler && firstTiddler.fields && firstTiddler.fields.tags &&
					firstTiddler.fields.tags.indexOf(rootTiddler) !== -1) {
				return [theOnlyTiddlerTitle];
			}
		}
		// Inclusive fast path: root tiddler itself was the only input
		if(isInclusive && theOnlyTiddlerTitle === rootTiddler) {
			return [theOnlyTiddlerTitle];
		}
	}

	// Retrieve the full Set of descendants (cached inside getTreeDescendants)
	var descendants = $tw.utils.getTreeDescendants(options.wiki,rootTiddler,fieldName || undefined);

	if(isNotInTree) {
		return Array.from(sourceTiddlers).filter(function(title) {
			var isInTree = descendants.has(title) || (isInclusive && title === rootTiddler);
			return !isInTree;
		});
	}

	return Array.from(sourceTiddlers).filter(function(title) {
		return descendants.has(title) || (isInclusive && title === rootTiddler);
	});
};
