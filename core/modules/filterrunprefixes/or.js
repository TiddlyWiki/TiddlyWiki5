/*\
title: $:/core/modules/filterrunprefixes/or.js
type: application/javascript
module-type: filterrunprefix
\*/

"use strict";

exports.or = function(operationSubFunction) {
	return function(results,source,widget) {
		results.pushTop(operationSubFunction(source,widget));
	};
};
