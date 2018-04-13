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


	if( !operator.operand) {
		// Return all tiddlers if the operand is missing
		var results = [];
		source(function(tiddler,title) {
			results.push(title);
		});
		return results;
	}

	// Get our isfilteroperators
	var isFilterOperators = getIsFilterOperators(),
	    subops = operator.operand.split("+"),
		filteredResults = {},
		results = [];
	for (var t=0; t<subops.length; t++) {
		var subop = isFilterOperators[subops[t]];
		if(subop) {
			filteredResults[subops[t]] = subop(source,operator.prefix,options);
		} else {
			return [$tw.language.getString("Error/IsFilterOperator")];
		}
		
	}
	
    source(function(tiddler,title) {
        for (var t=0; t<subops.length; t++) {
            if (filteredResults[subops[t]].indexOf(title) != -1){
                results.push(title);
                break;
            }
        }
    });
	return results;
};

})();
