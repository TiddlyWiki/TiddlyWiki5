/*\
title: $:/core/modules/filterrunprefixes/then.js
type: application/javascript
module-type: filterrunprefix

Replace results of previous runs unless empty

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter prefix function
*/
exports.then = function(operationSubFunction) {
	return function(results,source,widget) {
		if(results.length !== 0) {
			// Only run if previous run(s) produced results
			var thisRunResult = operationSubFunction(source,widget);
			if(thisRunResult.length !== 0) {
				// Replace results only if this run actually produces a result
				results.clear();
				results.pushTop(thisRunResult);
			}
		}
	};
};

})();
