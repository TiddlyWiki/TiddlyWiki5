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
	const results = [];
	const minLength = parseInt(operator.operand || "",10) || 0;
	source((tiddler,title) => {
		if(title.length >= minLength) {
			results.push(title);
		}
	});
	return results;
};
