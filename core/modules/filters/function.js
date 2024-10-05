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
		params = [];
	$tw.utils.each(operator.operands.slice(1),function(param) {
		params.push({value: param});
	});
	var variableInfo = options.widget && options.widget.getVariableInfo && options.widget.getVariableInfo(functionName,{params: params, source: source});
	if(variableInfo && variableInfo.srcVariable && variableInfo.srcVariable.isFunctionDefinition) {
		return variableInfo.resultList ? variableInfo.resultList : [variableInfo.text];
	}
	// Return the input list if the function wasn't found
	var results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	return results;
};

})();
