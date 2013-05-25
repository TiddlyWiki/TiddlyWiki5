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
	var results = [];
	// Convert to an array if necessary
	if(!$tw.utils.isArray(source)) {
		var copy = [];
		$tw.utils.each(source,function(element,title) {
			copy.push(title);
		});
		source = copy;
	}
	// Slice the array if necessary
	var limit = Math.min(source.length,parseInt(operator.operand,10));
	if(operator.prefix === "!") {
		results = source.slice(source.length - limit,limit);
	} else {
		results = source.slice(0,limit);
	}
	return results;
};

})();
