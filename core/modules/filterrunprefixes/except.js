/*\
title: $:/core/modules/filterrunprefixes/except.js
type: application/javascript
module-type: filterrunprefix

Difference of sets.
Equivalent to - filter run prefix.

\*/

"use strict";

/*
Export our filter prefix function
*/
exports.except = function(operationSubFunction) {
	return function(results,source,widget) {
		results.remove(operationSubFunction(source,widget));
	};
};
