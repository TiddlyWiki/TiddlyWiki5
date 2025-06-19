/*\
title: $:/core/modules/filters/splitbefore.js
type: application/javascript
module-type: filteroperator

Filter operator that splits each result on the first occurance of the specified separator and returns the unique values.

\*/

"use strict";

/*
Export our filter function
*/
exports.splitbefore = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var parts = title.split(operator.operand);
		if(parts.length === 1) {
			$tw.utils.pushTop(results,parts[0]);
		} else {
			$tw.utils.pushTop(results,parts[0] + operator.operand);
		}
	});
	return results;
};
