/*\
title: $:/core/modules/filterrunprefixes/or.js
type: application/javascript
module-type: filterrunprefix

Equivalent to a filter run with no prefix.

\*/

"use strict";

/*
Export our filter prefix function
*/
exports.or = function(operationSubFunction) {
	return function(results,source,widget) {
		results.pushTop(operationSubFunction(source,widget));
	};
};
