/*\
title: $:/yaisog/modules/filters/intersection.js
type: application/javascript
module-type: filteroperator

Filter operator to output the intersection of the input and operand lists
Operand list uses multi-valued variables
Negated operator outputs those input tiddlers that are not in the operand list

\*/

"use strict";

exports.intersection = (source, operator, options) => {
	const list = operator.multiValueOperands[0];
	const isNegated = operator.prefix === "!";
	const results = [];

	source((tiddler, title) => {
		if(isNegated !== list.includes(title)) {
			results.push(title);
		}
	});

	return results;
};