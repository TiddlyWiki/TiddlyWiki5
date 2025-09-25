/*\
title: $:/core/modules/filters/limit.js
type: application/javascript
module-type: filteroperator

Filter operator for chopping the results to a specified maximum number of entries

\*/

"use strict";

/*
Export our filter function
*/
exports.limit = function(source,operator,options) {
	var results = [];
	// Convert to an array
	source(function(tiddler,title) {
		results.push(title);
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
