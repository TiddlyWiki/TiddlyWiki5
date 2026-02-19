/*\
title: $:/core/modules/filters/unknown.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

var fieldFilterOperatorFn = require("$:/core/modules/filters/field.js").field;

exports["[unknown]"] = function(source,operator,options) {
	// Check for a user defined filter operator
	if(operator.operator.indexOf(".") !== -1) {
		var params = [];
		$tw.utils.each(operator.multiValueOperands,function(paramList) {
			params.push({value: paramList[0] || "",multiValue: paramList});
		});
		var variableInfo = options.widget && options.widget.getVariableInfo && options.widget.getVariableInfo(operator.operator,{params: params, source: source});
		if(variableInfo && variableInfo.srcVariable) {
			var list = variableInfo.resultList ? variableInfo.resultList : [variableInfo.text];
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
