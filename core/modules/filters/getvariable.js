/*\
title: $:/core/modules/filters/getvariable.js
type: application/javascript
module-type: filteroperator

Filter operator for replacing input values by the value(s) of the variable with the same name, or blank if the variable is missing

\*/

"use strict";

/*
Export our filter function
*/
exports.getvariable = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var variableInfo = options.widget.getVariableInfo(title);
		var resultList = variableInfo.resultList;
		// If variable doesn't exist, resultList will be [undefined] and we replace with [""]
		if(resultList.length === 1 && resultList[0] === undefined) {
			results.push("");
		} else {
			// Otherwise, we output all values from the list (if any)
			$tw.utils.each(resultList,function(value) {
				results.push(value);
			});
		}
	});
	return results;
};
