/*\
title: $:/core/modules/filters/is.js
type: application/javascript
module-type: filteroperator

Filter operator for checking tiddler properties

\*/

"use strict";

let isFilterOperators;

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
	const isFilterOperators = getIsFilterOperators();
	if(operator.operand) {
		const isFilterOperator = isFilterOperators[operator.operand];
		if(isFilterOperator) {
			return isFilterOperator(source,operator.prefix,options);
		} else {
			return [$tw.language.getString("Error/IsFilterOperator")];
		}
	} else {
		// Return all tiddlers if the operand is missing
		const results = [];
		source((tiddler,title) => {
			results.push(title);
		});
		return results;
	}
};
