/*\
title: $:/core/modules/filters/suffix.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if a title ends with a suffix

\*/

"use strict";

/*
Export our filter function
*/
exports.suffix = function(source,operator,options) {
	const results = [],
		suffixes = (operator.suffixes || [])[0] || [];

	if(!operator.operand) {
		source((tiddler,title) => {
			results.push(title);
		});
		return results;
	}

	const caseInsensitive = suffixes.indexOf("caseinsensitive") !== -1,
		negate = operator.prefix === "!",
		operand = caseInsensitive ? operator.operand.toLowerCase() : operator.operand;

	source((tiddler,title) => {
		const value = caseInsensitive ? title.toLowerCase() : title,
			matches = value.endsWith(operand);
		if(negate ? !matches : matches) {
			results.push(title);
		}
	});

	return results;
};
