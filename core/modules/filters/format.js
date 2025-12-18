/*\
title: $:/core/modules/filters/format.js
type: application/javascript
module-type: filteroperator
Filter operator for formatting strings
\*/

"use strict";

var formatFilterOperators;

function getFormatFilterOperators() {
	if(!formatFilterOperators) {
		formatFilterOperators = {};
		$tw.modules.applyMethods("formatfilteroperator",formatFilterOperators);
	}
	return formatFilterOperators;
}

/*
Export our filter function
*/
exports.format = function(source,operator,options) {
	// Dispatch to the correct formatfilteroperator
	var formatFilterOperators = getFormatFilterOperators();
	if(operator.suffix) {
		var formatFilterOperator = formatFilterOperators[operator.suffix];
		if(formatFilterOperator) {
			return formatFilterOperator(source,operator.operand,options);
		} else {
			return [$tw.language.getString("Error/FormatFilterOperator")];
		}
	} else {
		// Return all unchanged if the suffix is missing
		var results = [];
		source(function(tiddler,title) {
			results.push(title);
		});
		return results;
	}
};
