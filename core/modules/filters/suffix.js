/*\
title: $:/core/modules/filters/suffix.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if a title ends with a suffix

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.suffix = function(source,operator,options) {
	var results = [],
		suffixes = (operator.suffixes || [])[0] || [];
	if (!operator.operand) {
		source(function(tiddler,title) {
			results.push(title);
		});
	} else if(suffixes.indexOf("caseinsensitive") !== -1) {
		var operand = operator.operand.toLowerCase();
		if(operator.prefix === "!") {
			source(function(tiddler,title) {
				if(title.toLowerCase().substr(-operand.length) !== operand) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				if(title.toLowerCase().substr(-operand.length) === operand) {
					results.push(title);
				}
			});
		}
	} else {
		if(operator.prefix === "!") {
			source(function(tiddler,title) {
				if(title.substr(-operator.operand.length) !== operator.operand) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				if(title.substr(-operator.operand.length) === operator.operand) {
					results.push(title);
				}
			});
		}
	}
	return results;
};

})();
