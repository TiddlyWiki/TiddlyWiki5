/*\
title: $:/core/modules/filters/prefix.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.prefix = function(source,operator,options) {
	var results = [],
		suffixes = (operator.suffixes || [])[0] || [];
	if(suffixes.indexOf("caseinsensitive") !== -1) {
		var operand = operator.operand.toLowerCase();
		if(operator.prefix === "!") {
			source(function(tiddler,title) {
				if(title.toLowerCase().substr(0,operand.length) !== operand) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				if(title.toLowerCase().substr(0,operand.length) === operand) {
					results.push(title);
				}
			});
		}
	} else {
		if(operator.prefix === "!") {
			source(function(tiddler,title) {
				if(title.substr(0,operator.operand.length) !== operator.operand) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				if(title.substr(0,operator.operand.length) === operator.operand) {
					results.push(title);
				}
			});
		}
	}
	return results;
};
