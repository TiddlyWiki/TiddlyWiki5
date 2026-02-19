/*\
title: $:/core/modules/filters/removesuffix.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.removesuffix = function(source,operator,options) {
	var results = [],
		suffixes = (operator.suffixes || [])[0] || [];
	if (!operator.operand) {
		source(function(tiddler,title) {
			results.push(title);
		});
	} else if(suffixes.indexOf("caseinsensitive") !== -1) {
		var operand = operator.operand.toLowerCase();
		source(function(tiddler,title) {
			if(title && title.toLowerCase().substr(-operand.length) === operand) {
				results.push(title.substr(0,title.length - operand.length));
			}
		});
	} else {
		source(function(tiddler,title) {
			if(title && title.substr(-operator.operand.length) === operator.operand) {
				results.push(title.substr(0,title.length - operator.operand.length));
			}
		});
	}
	return results;
};
