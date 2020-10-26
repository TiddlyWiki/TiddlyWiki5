/*\
title: $:/core/modules/filterprefixes/else.js
type: application/javascript
module-type: filterprefix

Equivalent to ~ filter run prefix.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter prefix function
*/
exports.else = function(operationSubFunction) {
	return function(results,source,widget) {
		if(results.length === 0) {
			// Main result so far is empty
			$tw.utils.pushTop(results,operationSubFunction(source,widget));
		}
	};
};

})();
