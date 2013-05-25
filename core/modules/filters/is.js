/*\
title: $:/core/modules/filters/is.js
type: application/javascript
module-type: filteroperator

Filter operator for checking tiddler properties

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var isFilterOperators;

function getIsFilterOperators() {
	if(!isFilterOperators) {
		isFilterOperators = {};
		$tw.modules.applyMethods("isfilteroperator",isFilterOperators);
	}
	return isFilterOperators;
};

/*
Export our filter function
*/
exports.is = function(source,operator,options) {
	// Dispatch to the correct isfilteroperator
	var isFilterOperators = getIsFilterOperators();
	var isFilterOperator = isFilterOperators[operator.operand];
	if(isFilterOperator) {
		return isFilterOperator(source,operator.prefix,options);
	} else {
		return ["Filter Error: Unknown operand for the 'is' filter operator"];
	}
};

})();
