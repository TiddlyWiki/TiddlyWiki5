/*\
title: $:/core/modules/filters/function.js
type: application/javascript
module-type: filteroperator

Filter operator returning those input titles that are returned from a function

\*/

"use strict";

/*
Export our filter function
*/
exports.function = function(source,operator,options) {
	const functionName = operator.operands[0];
	const params = [];
	let results;
	$tw.utils.each(operator.operands.slice(1),(param) => {
		params.push({value: param});
	});
	// console.log(`Calling ${functionName} with params ${JSON.stringify(params)}`);
	const variableInfo = options.widget && options.widget.getVariableInfo && options.widget.getVariableInfo(functionName,{params,source});
	if(variableInfo && variableInfo.srcVariable && variableInfo.srcVariable.isFunctionDefinition) {
		results = variableInfo.resultList ? variableInfo.resultList : [variableInfo.text];
	}
	// Return the input list if the function wasn't found
	if(!results) {
		results = [];
		source((tiddler,title) => {
			results.push(title);
		});
	}
	// console.log(`function ${functionName} with params ${JSON.stringify(params)} results: ${JSON.stringify(results)}`);
	return results;
};
