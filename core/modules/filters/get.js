/*\
title: $:/core/modules/filters/get.js
type: application/javascript
module-type: filteroperator

Filter operator for replacing tiddler titles by the value of the field specified in the operand.

\*/

"use strict";

/*
Export our filter function
*/
exports.get = function(source,operator,options) {
	const results = [];
	source((tiddler,title) => {
		if(tiddler) {
			const value = tiddler.getFieldString(operator.operand);
			if(value) {
				results.push(value);
			}
		}
	});
	return results;
};
