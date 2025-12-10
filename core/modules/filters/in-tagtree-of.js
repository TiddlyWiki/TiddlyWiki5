/*\
title: $:/core/modules/filters/in-tagtree-of.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if tiddlers are in a tag tree with a specified root

Finds out where a tiddler originates from, is it in a tag tree with xxx as root?

Based on:
- https://github.com/bimlas/tw5-kin-filter/blob/master/plugins/kin-filter/kin.js
- https://talk.tiddlywiki.org/t/recursive-filter-operators-to-show-all-tiddlers-beneath-a-tag-and-all-tags-above-a-tiddler/3814

\*/

"use strict";

/*
Export our filter function
*/
exports["in-tagtree-of"] = function(source,operator,options) {
	const rootTiddler = operator.operand;
	/*
	 * By default we check tiddler passed-in is tagged with the operand (or is its child), we output the tiddler passed-in, otherwise output empty.
	 * But if `isInclusive` is true, if tiddler operand itself is passed-in, we output it, even if the operand itself is not tagged with itself.
	 */
	const isInclusive = operator.suffix === "inclusive";
	/*
	 * If add `!` prefix, means output the input if input is not in rootTiddlerChildren
	 */
	const isNotInTagTreeOf = operator.prefix === "!";
	const sourceTiddlers = new Set();
	let firstTiddler;
	
	source(function(tiddler,title) {
		sourceTiddlers.add(title);
		if(firstTiddler === undefined) {
			firstTiddler = tiddler;
		}
	});
	
	// Optimize for fileSystemPath and cascade usage, where input will only be one tiddler, and often is just tagged with the rootTiddler
	if(sourceTiddlers.size === 1 && !isNotInTagTreeOf) {
		const theOnlyTiddlerTitle = Array.from(sourceTiddlers)[0];
		if(firstTiddler && firstTiddler.fields && firstTiddler.fields.tags && firstTiddler.fields.tags.indexOf(rootTiddler) !== -1) {
			return [theOnlyTiddlerTitle];
		}
		if(isInclusive && theOnlyTiddlerTitle === rootTiddler) {
			return [theOnlyTiddlerTitle];
		}
	}
	
	const rootTiddlerChildren = options.wiki.getGlobalCache("in-tagtree-of-" + rootTiddler,function() {
		return $tw.utils.getTagDescendants(options.wiki,rootTiddler);
	});
	
	if(isNotInTagTreeOf) {
		const sourceTiddlerCheckedToNotBeChildrenOfRootTiddler = Array.from(sourceTiddlers).filter(function(title) {
			// Check if title is in the tag tree, or if it's the root itself when inclusive
			const isInTree = rootTiddlerChildren.has(title) || (isInclusive && title === rootTiddler);
			return !isInTree;
		});
		return sourceTiddlerCheckedToNotBeChildrenOfRootTiddler;
	}
	
	const sourceTiddlerCheckedToBeChildrenOfRootTiddler = Array.from(sourceTiddlers).filter(function(title) {
		// Check if title is in the tag tree, or if it's the root itself when inclusive
		return rootTiddlerChildren.has(title) || (isInclusive && title === rootTiddler);
	});
	return sourceTiddlerCheckedToBeChildrenOfRootTiddler;
};
