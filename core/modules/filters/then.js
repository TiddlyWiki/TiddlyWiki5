/*\
title: $:/core/modules/filters/then.js
type: application/javascript
module-type: filteroperator

Filter operator for replacing any titles with a constant

\*/

"use strict";

/*
Export our filter function
*/
exports.then = function(source,operator,options) {
	const results = [];
	source((tiddler,title) => {
		results.push(operator.operand);
	});
	return results;
};
