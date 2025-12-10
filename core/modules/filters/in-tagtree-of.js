/*\
title: $:/core/modules/filters/in-tagtree-of.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if tiddlers are in a tag tree with a specified root

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
		const results = new Set();
		getTiddlersRecursively(rootTiddler,results,options.wiki);
		return results;
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

function getTiddlersRecursively(title,results,wiki) {
	// Get tagging[] list at this level
	const intermediate = new Set(wiki.getTiddlersWithTag(title));
	
	// Remove any TiddlersWithTag in intermediate that are already in the results set to avoid loops
	// Code adapted from $tw.utils.pushTop
	if(intermediate.size > 0) {
		if(results.size > 0) {
			if(results.size < intermediate.size) {
				results.forEach(function(alreadyExisted) {
					if(intermediate.has(alreadyExisted)) {
						intermediate.delete(alreadyExisted);
					}
				});
			} else {
				intermediate.forEach(function(alreadyExisted) {
					if(results.has(alreadyExisted)) {
						intermediate.delete(alreadyExisted);
					}
				});
			}
		}
		// Add the remaining intermediate results and traverse the hierarchy further
		intermediate.forEach(function(title) {
			results.add(title);
		});
		intermediate.forEach(function(title) {
			getTiddlersRecursively(title,results,wiki);
		});
	}
}
