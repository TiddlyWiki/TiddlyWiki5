/*\
title: $:/core/modules/filters/function.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.function = function(source,operator,options) {
	var functionName = operator.operands[0],
		params = [],
		results;
	$tw.utils.each(operator.multiValueOperands.slice(1),function(paramList) {
		params.push({value: paramList[0] || "",multiValue: paramList});
	});
	// console.log(`Calling ${functionName} with params ${JSON.stringify(params)}`);
	var variableInfo = options.widget && options.widget.getVariableInfo && options.widget.getVariableInfo(functionName,{params: params, source: source});
	if(variableInfo && variableInfo.srcVariable && variableInfo.srcVariable.isFunctionDefinition) {
		results = variableInfo.resultList ? variableInfo.resultList : [variableInfo.text];
	}

	if(!results) {
		results = [];
		source(function(tiddler,title) {
			results.push(title);
		});
	}

	return results;
};
