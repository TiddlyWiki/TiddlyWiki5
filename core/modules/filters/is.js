/*\
title: $:/core/modules/filters/is.js
type: application/javascript
module-type: filteroperator

Filter operator for checking tiddler properties

\*/

"use strict";

var isFilterOperators;

function getIsFilterOperators() {
	if(!isFilterOperators) {
		isFilterOperators = {};
		$tw.modules.applyMethods("isfilteroperator",isFilterOperators);
	}
	return isFilterOperators;
}

/*
Export our filter function
*/
exports.is = function(source,operator,options) {
	// Dispatch to the correct isfilteroperator
	var isFilterOperators = getIsFilterOperators();
	if(operator.operand) {
		var isFilterOperator = isFilterOperators[operator.operand];
		if(isFilterOperator) {
			return isFilterOperator(source,operator.prefix,options);
		} else {
			return [$tw.language.getString("Error/IsFilterOperator")];
		}
	} else {
		// Return all tiddlers if the operand is missing
		var results = [];
		source(function(tiddler,title) {
			results.push(title);
		});
		return results;
	}
};
