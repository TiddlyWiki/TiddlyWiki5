/*\
title: $:/core/modules/filters/function.js
type: application/javascript
module-type: filteroperator

Filter operator returning those input titles that are returned from a function

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.function = function(source,operator,options) {
	var functionName = operator.operands[0],
		customDefinition = options.widget && options.widget.getVariableInfo && options.widget.getVariableInfo(functionName);
	if(customDefinition && customDefinition.srcVariable && customDefinition.srcVariable.isFunctionDefinition) {
		var variables = Object.create(null);
		// Go through each of the defined parameters, and make a variable with the value of the corresponding operand
		$tw.utils.each(customDefinition.srcVariable.params,function(param,index) {
			var value = operator.operands[1 + index]; // Skip over the first operand that gives the function name
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
	// Return an empty list if the function wasn't found
	return [];
};

})();
