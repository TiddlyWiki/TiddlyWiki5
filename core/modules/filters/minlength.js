/*\
title: $:/core/modules/filters/minlength.js
type: application/javascript
module-type: filteroperator

Filter operator for filtering out titles that don't meet the minimum length in the operand

\*/

"use strict";

/*
Export our filter function
*/
exports.minlength = function(source,operator,options) {
	var results = [],
		minLength = parseInt(operator.operand || "",10) || 0;
	source(function(tiddler,title) {
		if(title.length >= minLength) {
			results.push(title);
		}
	});
	return results;
};
