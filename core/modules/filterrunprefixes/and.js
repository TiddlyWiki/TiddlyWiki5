/*\
title: $:/core/modules/filterrunprefixes/and.js
type: application/javascript
module-type: filterrunprefix
\*/

"use strict";

exports.and = function(operationSubFunction,options) {
	return function(results,source,widget) {
		// This replaces all the elements of the array, but keeps the actual array so that references to it are preserved
		source = options.wiki.makeTiddlerIterator(results.toArray());
		results.clear();
		results.pushTop(operationSubFunction(source,widget));
	};
};
