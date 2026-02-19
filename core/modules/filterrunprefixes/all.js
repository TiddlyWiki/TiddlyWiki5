/*\
title: $:/core/modules/filterrunprefixes/all.js
type: application/javascript
module-type: filterrunprefix
\*/

"use strict";

exports.all = function(operationSubFunction) {
	return function(results,source,widget) {
		results.push.apply(results, operationSubFunction(source,widget));
	};
};
