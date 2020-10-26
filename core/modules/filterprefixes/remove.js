/*\
title: $:/core/modules/filterprefixes/remove.js
type: application/javascript
module-type: filterprefix

Difference of sets.
Equivalent to - filter run prefix.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter prefix function
*/

exports.remove = function(operationSubFunction) {
	return function(results,source,widget) {
		$tw.utils.removeArrayEntries(results,operationSubFunction(source,widget));
	};
};

})();
