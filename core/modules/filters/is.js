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

	var isFilterOperators = getIsFilterOperators(),
		subops = operator.operand.split("+");

	//Make sure all the operands are defined.
	for (var t = 0; t < subops.length; t++){
		if( !isFilterOperators[subops[t]] ) {
			return [$tw.language.getString("Error/IsFilterOperator")];
		}
	}


	if(subops.length === 0) { 	// Return all tiddlers if the operand is missing
		var results = [];
		source(function(tiddler,title) {
			results.push(title);
		});
		return results;
	} else if(subops.length === 1) {	// Shortcut the Single Operator
		var subop = isFilterOperators[subops[0]];
		return subop(source,operator.prefix,options);

	} else {	// Handle multiple operators
		var filtered_results = new Set(),
			results = [];
		for(var t=0; t < subops.length; t++){
			var subop = isFilterOperators[subops[t]];
			subop(source,operator.prefix,options).forEach(function(element) { filtered_results.add(element)});
		}

		// Sort the output by the input (There may be a better way to do this)
		source(function(tiddler,title) {
			if(filtered_results.has(title)) {
				results.push(title);
			}
		});

		return results;
	}
};

})();
