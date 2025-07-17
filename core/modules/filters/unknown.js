/*\
title: $:/core/modules/filters/unknown.js
type: application/javascript
module-type: filteroperator

Filter operator for handling unknown filter operators.

Not intended to be used directly by end users, hence the square brackets around the name.

\*/

"use strict";

const fieldFilterOperatorFn = require("$:/core/modules/filters/field.js").field;

/*
Export our filter function
*/
exports["[unknown]"] = function(source,operator,options) {
	// Check for a user defined filter operator
	if(operator.operator.includes(".")) {
		const params = [];
		$tw.utils.each(operator.operands,(param) => {
			params.push({value: param});
		});
		const variableInfo = options.widget && options.widget.getVariableInfo && options.widget.getVariableInfo(operator.operator,{params,source});
		if(variableInfo && variableInfo.srcVariable) {
			const list = variableInfo.resultList ? variableInfo.resultList : [variableInfo.text];
			if(operator.prefix === "!") {
				const results = [];
				source((tiddler,title) => {
					if(!list.includes(title)) {
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
