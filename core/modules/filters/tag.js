/*\
title: $:/core/modules/filters/tag.js
type: application/javascript
module-type: filteroperator

Filter operator for checking for the presence of a tag

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.tag = function(source,operator,options) {
	var results = [];
	if((operator.suffix || "").toLowerCase() === "strict" && !operator.operand) {
		// New semantics:
		// Always return copy of input if operator.operand is missing
		source(function(tiddler,title) {
			results.push(title);
		});
	} else {
		// Old semantics:
		if(operator.prefix === "!") {
			// Returns a copy of the input if operator.operand is missing
			source(function(tiddler,title) {
				if(tiddler && !tiddler.hasTag(operator.operand)) {
					results.push(title);
				}
			});
		} else {
			// Returns empty results if operator.operand is missing
			source(function(tiddler,title) {
				if(tiddler && tiddler.hasTag(operator.operand)) {
					results.push(title);
				}
			});
			results = options.wiki.sortByList(results,operator.operand);
		}		
	}
	return results;
};

})();
