/*\
title: $:/core/modules/filterrunprefixes/and.js
type: application/javascript
module-type: filterrunprefix

Intersection of sets.
Equivalent to + filter run prefix.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter prefix function
*/
exports.and = function(operationSubFunction) {
	return function(results,source,widget) {
		// This replaces all the elements of the array, but keeps the actual array so that references to it are preserved
		source = $tw.wiki.makeTiddlerIterator(results);
		results.splice(0,results.length);
		$tw.utils.pushTop(results,operationSubFunction(source,widget));
	};
};

})();
