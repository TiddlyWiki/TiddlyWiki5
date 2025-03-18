/*\
title: $:/core/modules/filterrunprefixes/let.js
type: application/javascript
module-type: filterrunprefix

Assign a value to a variable

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter prefix function
*/
exports.let = function(operationSubFunction,options) {
	// Return the filter run prefix function
	return function(results,source,widget) {
		// Evaluate the subfunction to get the variable name
		var subFunctionResults = operationSubFunction(source,widget);
		if(subFunctionResults.length === 0) {
			return;
		}
		var name = subFunctionResults[0];
		if(typeof name !== "string" || name.length === 0) {
			return;
		}
		// Assign the result of the subfunction to the variable
		var variables = {};
		variables[name] = results.toArray()
		// Clear the results
		results.clear();
		// Return the variables
		return {
			variables: variables
		};
	};
};

})();
