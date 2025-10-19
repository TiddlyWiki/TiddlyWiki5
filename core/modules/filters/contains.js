/*\
title: $:/core/modules/filters/contains.js
type: application/javascript
module-type: filteroperator

Filter operator for finding values in array fields

\*/

"use strict";

/*
Export our filter function
*/
exports.contains = function(source,operator,options) {
	const results = [];
	const fieldname = operator.suffix || "list";
	const tiddlersWithOperand = options.wiki.findListingsOfTiddler(operator.operand, fieldname);
	const intermediateSet = new Set(tiddlersWithOperand);
	const invert = operator.prefix === "!";
	source((tiddler,title) => {
		if(intermediateSet.has(title) !== invert) {
			results.push(title);
		}
	});
	return results;
};