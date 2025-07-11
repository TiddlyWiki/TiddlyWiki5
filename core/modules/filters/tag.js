/*\
title: $:/core/modules/filters/tag.js
type: application/javascript
module-type: filteroperator

Filter operator for checking for the presence of a tag

\*/

"use strict";

/*
Export our filter function
*/
exports.tag = function(source,operator,options) {
	let results = []; let indexedResults;
	if((operator.suffix || "").toLowerCase() === "strict" && !operator.operand) {
		// New semantics:
		// Always return copy of input if operator.operand is missing
		source((tiddler,title) => {
			results.push(title);
		});
	} else {
		// Old semantics:
		let tiddlers;
		if(operator.prefix === "!") {
			// Returns a copy of the input if operator.operand is missing
			tiddlers = options.wiki.getTiddlersWithTag(operator.operand);
			source((tiddler,title) => {
				if(!tiddlers.includes(title)) {
					results.push(title);
				}
			});
		} else {
			// Returns empty results if operator.operand is missing
			if(source.byTag) {
				indexedResults = source.byTag(operator.operand);
				if(indexedResults) {
					return indexedResults;
				}
			} else {
				tiddlers = options.wiki.getTiddlersWithTag(operator.operand);
				source((tiddler,title) => {
					if(tiddlers.includes(title)) {
						results.push(title);
					}
				});
				results = options.wiki.sortByList(results,operator.operand);
			}
		}
	}
	return results;
};
