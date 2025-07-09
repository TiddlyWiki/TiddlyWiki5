/*\
title: $:/core/modules/filters/removeprefix.js
type: application/javascript
module-type: filteroperator

Filter operator for removing a prefix from each title in the list. Titles that do not start with the prefix are removed.

\*/

"use strict";

/*
Export our filter function
*/
exports.removeprefix = function(source,operator,options) {
	const results = [];
	const suffixes = (operator.suffixes || [])[0] || [];
	if(suffixes.includes("caseinsensitive")) {
		const operand = operator.operand.toLowerCase();
		source((tiddler,title) => {
			if(title.toLowerCase().substr(0,operand.length) === operand) {
				results.push(title.substr(operand.length));
			}
		});
	} else {
		source((tiddler,title) => {
			if(title.substr(0,operator.operand.length) === operator.operand) {
				results.push(title.substr(operator.operand.length));
			}
		});
	}
	return results;
};
