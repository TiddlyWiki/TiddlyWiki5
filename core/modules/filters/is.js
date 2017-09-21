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
}

/*
Export our filter function
*/
exports.is = function(source,operator,options) {
	// Get our isfilteroperators
	var isFilterOperators = getIsFilterOperators();
    // Cycle through the isfilteroperators accumulating their results
	var results = [];
    if(operator.operand) {
		var subops = operator.operand.split("+");
		for (var t=0; t<subops.length; t++) {
			var subop = isFilterOperators[subops[t]];
			if(subop) {
				$tw.utils.pushTop(results,subop(source,operator.prefix,options));
			} else {
				return [$tw.language.getString("Error/IsFilterOperator")];
			}
		}
		return results;
	} else {
		// Return all tiddlers if the operand is missing
		var results = [];
		source(function(tiddler,title) {
			results.push(title);
		});
		return results;
	}
};

})();
