/*\
title: $:/core/modules/filters/match.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if a title matches a string

\*/

"use strict";

/*
Export our filter function
*/
exports.match = function(source,operator,options) {
	var results = [],
		suffixes = (operator.suffixes || [])[0] || [];
	if(suffixes.indexOf("caseinsensitive") !== -1) {
		if(operator.prefix === "!") {
			source(function(tiddler,title) {
				if(title.toLowerCase() !== (operator.operand || "").toLowerCase()) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				if(title.toLowerCase() === (operator.operand || "").toLowerCase()) {
					results.push(title);
				}
			});
		}
	} else {
		if(operator.prefix === "!") {
			source(function(tiddler,title) {
				if(title !== operator.operand) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				if(title === operator.operand) {
					results.push(title);
				}
			});
		}
	}
	return results;
};
