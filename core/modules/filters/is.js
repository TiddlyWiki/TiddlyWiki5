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
		subops = operator.operand.split("+"),
		num_of_subops = subops.length;

	//Make sure all the operands are defined.
	for (var t = 0; t < num_of_subops; t++){
		if( !isFilterOperators[subops[t]] ) {
			return [$tw.language.getString("Error/IsFilterOperator")];
		}
	}

	if(num_of_subops === 0) { 	// Return all tiddlers if the operand is missing
		var results = [];
		source(function(tiddler,title) {
			results.push(title);
		});
		return results;
	} else if(num_of_subops === 1) {	// Shortcut the Single Operator
		var operator = isFilterOperators[subops[0]];
		return operator(source,operator.prefix,options);

	} else {	// Handle multiple operators
		var filtered_results = {},
			results = [];
		for(var t=0; t < num_of_subops; t++){
			var operator = isFilterOperators[subops[t]];
			operator(source,operator.prefix,options).forEach(function(element) { filtered_results[element] = True});
		}

		// Sort the output by the input (There may be a better way to do this)
		source(function(tiddler,title) {
			if(filtered_results[title] === True) {
				results.push(title);
			}
		});

		return results;
	}
};

})();
