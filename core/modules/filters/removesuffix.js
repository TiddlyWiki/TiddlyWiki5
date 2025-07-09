/*\
title: $:/core/modules/filters/removesuffix.js
type: application/javascript
module-type: filteroperator

Filter operator for removing a suffix from each title in the list. Titles that do not end with the suffix are removed.

\*/

"use strict";

/*
Export our filter function
*/
exports.removesuffix = function(source,operator,options) {
	const results = [];
	const suffixes = (operator.suffixes || [])[0] || [];
	if(!operator.operand) {
		source((tiddler,title) => {
			results.push(title);
		});
	} else if(suffixes.includes("caseinsensitive")) {
		const operand = operator.operand.toLowerCase();
		source((tiddler,title) => {
			if(title && title.toLowerCase().substr(-operand.length) === operand) {
				results.push(title.substr(0,title.length - operand.length));
			}
		});
	} else {
		source((tiddler,title) => {
			if(title && title.substr(-operator.operand.length) === operator.operand) {
				results.push(title.substr(0,title.length - operator.operand.length));
			}
		});
	}
	return results;
};
