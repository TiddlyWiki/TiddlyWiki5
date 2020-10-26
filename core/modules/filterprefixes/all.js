/*\
title: $:/core/modules/filterprefixes/all.js
type: application/javascript
module-type: filterprefix

Union of sets without de-duplication.
Equivalent to = filter run prefix.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter prefix function
*/
exports.all = function(operationSubFunction) {
	return function(results,source,widget) {
		Array.prototype.push.apply(results,operationSubFunction(source,widget));
	};
};

})();
