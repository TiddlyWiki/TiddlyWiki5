/*\
title: $:/core/modules/filters/prefix.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if a title starts with a prefix

\*/

"use strict";

/*
Export our filter function
*/
exports.prefix = function(source,operator,options) {
	const results = [],
		suffixes = (operator.suffixes || [])[0] || [],
		caseInsensitive = suffixes.includes("caseinsensitive"),
		negate = operator.prefix === "!";

	const operand = caseInsensitive ?
		operator.operand.toLowerCase() :
		operator.operand;

	source((tiddler,title) => {
		const value = caseInsensitive ? title.toLowerCase() : title,
			matches = value.startsWith(operand);
		if(negate ? !matches : matches) {
			results.push(title);
		}
	});

	return results;
};