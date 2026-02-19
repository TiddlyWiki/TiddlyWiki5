/*\
title: $:/core/modules/filterrunprefixes/let.js
type: application/javascript
module-type: filterrunprefix
\*/

"use strict";

exports.let = function(operationSubFunction,options) {
	// Return the filter run prefix function
	return function(results,source,widget) {
		// Save the result list
		var resultList = results.toArray();
		// Clear the results
		results.clear();
		// Evaluate the subfunction to get the variable name
		var subFunctionResults = operationSubFunction(source,widget);
		if(subFunctionResults.length === 0) {
			return;
		}
		var name = subFunctionResults[0];
		if(typeof name !== "string" || name.length === 0) {
			return;
		}

		var variables = {};
		variables[name] = resultList;
		// Return the variables
		return {
			variables: variables
		};
	};
};
