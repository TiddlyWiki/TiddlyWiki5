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
		variableInfo = options.widget && options.widget.getVariableInfo && options.widget.getVariableInfo(functionName);
	if(variableInfo && variableInfo.srcVariable && variableInfo.srcVariable.isFunctionDefinition) {
		return options.widget.evaluateVariable(functionName,{params: operator.operands.slice(1), source: source});
	}
	// Return the input list if the function wasn't found
	var results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	return results;
};

})();
