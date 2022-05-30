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
	if(operator.operator.charAt(0) === ".") {
		var customDefinition = options.widget && options.widget.getVariableInfo && options.widget.getVariableInfo(operator.operator);
		if(customDefinition && customDefinition.srcVariable && customDefinition.srcVariable.isFunctionDefinition) {
			var variables = Object.create(null);
			// Go through each of the defined parameters, and make a variable with the value of the corresponding operand
			$tw.utils.each(customDefinition.srcVariable.params,function(param,index) {
				var value = operator.operands[index];
				variables[param.name] = value === undefined ? param["default"] || "" : value;
			});
			var list = options.wiki.filterTiddlers(customDefinition.srcVariable.value,options.widget.makeFakeWidgetWithVariables(variables),source);
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
	return fieldFilterOperatorFn(source,operator,options);
};

})();
