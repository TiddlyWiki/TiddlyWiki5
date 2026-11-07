/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/utils/source-verifier.js
type: application/javascript
module-type: library

Verify source-backed nodes against a fresh parse before reusing their syntax.
The index is private to one serialization; caller-owned trees stay untouched.
\*/

"use strict";

var factory = require("$:/plugins/tiddlywiki/wikitext-serialize/utils/parsetree-factory.js").wikitextParseTree;

function hasInlineRoot(tree) {
	return (Array.isArray(tree) ? tree : [tree]).some(function(node) {
		if(!node) return false;
		// Block comments deliberately need no block separator, so isBlock
		// alone cannot identify their original parsing mode.
		if(node.rule === "commentblock") return false;
		return factory.kindOf(node) === "pragma" ? hasInlineRoot(node.children || []) :
			node.rule !== "blankline" && !factory.isBlock(node);
	});
}

function equal(left,right) {
	if(left === right) return true;
	if(!left || !right || typeof left !== "object" || typeof right !== "object" ||
		Array.isArray(left) !== Array.isArray(right)) return false;
	if(Array.isArray(left) && left.length !== right.length) return false;
	var leftKeys = Object.keys(left).filter(function(key) { return left[key] !== undefined; }),
		rightKeys = Object.keys(right).filter(function(key) { return right[key] !== undefined; });
	return leftKeys.length === rightKeys.length && leftKeys.every(function(key) {
		return Object.prototype.hasOwnProperty.call(right,key) && equal(left[key],right[key]);
	});
}

function walk(tree,visit) {
	if(Array.isArray(tree)) {
		tree.forEach(function(node) { walk(node,visit); });
	} else if(tree && typeof tree === "object") {
		visit(tree);
		walk(tree.children,visit);
	}
}

function key(node) {
	return JSON.stringify([node.start,node.end,node.type,node.tag,node.rule]);
}

exports.createSourceVerifier = function(source,tree,options) {
	options = options || {};
	var index = null,
		preserveBlankLines = false;
	walk(tree,function(node) {
		if(node.rule === "blankline") preserveBlankLines = true;
	});
	return function(node) {
		if(typeof node.start !== "number" || typeof node.end !== "number") return false;
		if(index === null) {
			index = new Map();
			try {
				var original = (options.wiki || $tw.wiki).parseText("text/vnd.tiddlywiki",source,{
					preserveBlankLines: preserveBlankLines,
					parseAsInline: options.parseAsInline !== undefined ? options.parseAsInline : hasInlineRoot(tree)
				}).tree;
				walk(original,function(originalNode) {
					var nodeKey = key(originalNode),
						candidates = index.get(nodeKey) || [];
					candidates.push(originalNode);
					index.set(nodeKey,candidates);
				});
			} catch(error) {
				// An extension parser may no longer accept the source. Keep the
				// current tree authoritative and use the tree-only serializers.
				index.clear();
			}
		}
		return (index.get(key(node)) || []).some(function(originalNode) {
			return equal(node,originalNode);
		});
	};
};
