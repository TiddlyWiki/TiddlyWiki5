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
		var tiddlers = options.wiki.getTiddlersWithTag(operator.operand);
		if(operator.prefix === "!") {
			// Returns a copy of the input if operator.operand is missing
			source(function(tiddler,title) {
				if(tiddlers.indexOf(title) === -1) {
					results.push(title);
				}
			});
		} else {
			// Returns empty results if operator.operand is missing
			source(function(tiddler,title) {
				if(tiddlers.indexOf(title) !== -1) {
					results.push(title);
				}
			});
			results = options.wiki.sortByList(results,operator.operand);
		}		
	}
	return results;
};

})();
