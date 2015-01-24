/*\
title: $:/core/modules/filters/limit.js
type: application/javascript
module-type: filteroperator

Filter operator for chopping the results to a specified maximum number of entries

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.limit = function(source,operator,options) {
	var count = 0,
		results = [],
		offset = parseInt(operator.suffix,10) || 0;
	// Convert to an array
	source(function(tiddler,title) {
		if(count < offset) {
			count++;			
		} else {
			results.push(title);
		}
	});
	// Slice the array if necessary
	var limit = Math.min(results.length,parseInt(operator.operand,10));
	if(operator.prefix === "!") {
		results = results.slice(-limit);
	} else {
		results = results.slice(0,limit);
	}
	return results;
};

})();
