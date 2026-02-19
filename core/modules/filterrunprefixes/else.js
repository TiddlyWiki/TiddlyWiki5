/*\
title: $:/core/modules/filterrunprefixes/else.js
type: application/javascript
module-type: filterrunprefix
\*/

"use strict";

exports.else = function(operationSubFunction) {
	return function(results,source,widget) {
		if(results.length === 0) {
			// Main result so far is empty
			results.pushTop(operationSubFunction(source,widget));
		}
	};
};
