/*\
title: $:/core/modules/filterrunprefixes/except.js
type: application/javascript
module-type: filterrunprefix
\*/

"use strict";

exports.except = function(operationSubFunction) {
	return function(results,source,widget) {
		results.remove(operationSubFunction(source,widget));
	};
};
