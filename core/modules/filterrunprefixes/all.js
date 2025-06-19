/*\
title: $:/core/modules/filterrunprefixes/all.js
type: application/javascript
module-type: filterrunprefix

Union of sets without de-duplication.
Equivalent to = filter run prefix.

\*/

"use strict";

/*
Export our filter prefix function
*/
exports.all = function(operationSubFunction) {
	return function(results,source,widget) {
		results.push.apply(results, operationSubFunction(source,widget));
	};
};
