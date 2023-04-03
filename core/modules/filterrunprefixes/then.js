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
			// Main result so far is not empty
            results.clear();
			results.pushTop(operationSubFunction(source,widget));
		}
	};
};

})();
