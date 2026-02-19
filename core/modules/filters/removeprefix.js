/*\
title: $:/core/modules/filters/removeprefix.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.removeprefix = function(source,operator,options) {
	var results = [],
		suffixes = (operator.suffixes || [])[0] || [];
	if(suffixes.indexOf("caseinsensitive") !== -1) {
		var operand = operator.operand.toLowerCase();
		source(function(tiddler,title) {
			if(title.toLowerCase().substr(0,operand.length) === operand) {
				results.push(title.substr(operand.length));
			}
		});
	} else {
		source(function(tiddler,title) {
			if(title.substr(0,operator.operand.length) === operator.operand) {
				results.push(title.substr(operator.operand.length));
			}
		});
	}
	return results;
};
