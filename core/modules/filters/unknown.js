/*\
title: $:/core/modules/filters/unknown.js
type: application/javascript
module-type: filteroperator

Filter operator for handling unknown filter operators.

Not intended to be used directly by end users, hence the square brackets around the name.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var fieldFilterOperatorFn = require("$:/core/modules/filters/field.js").field;

/*
Export our filter function
*/
exports["[unknown]"] = function(source,operator,options) {
	// Check for a user defined filter operator
	if(operator.operator.charAt(0) === ".") {
		var variableInfo = options.widget && options.widget.getVariableInfo && options.widget.getVariableInfo(operator.operator);
		if(variableInfo && variableInfo.srcVariable && variableInfo.srcVariable.isFunctionDefinition) {
			var list = options.widget.evaluateVariable(operator.operator,{params: operator.operands, source: source});
			if(operator.prefix === "!") {
				var results = [];
				source(function(tiddler,title) {
					if(list.indexOf(title) === -1) {
						results.push(title);
					}
				});
				return results;
			} else {
				return list;
			}
		}
	}
	// Otherwise, use the "field" operator
	return fieldFilterOperatorFn(source,operator,options);
};

})();
