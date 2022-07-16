/*\
title: $:/core/modules/filterrunprefixes/foreach.js
type: application/javascript
module-type: filterrunprefix
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter prefix function
*/
exports.foreach = function(operationSubFunction,options) {
	var	filterRunPrefixes = options.wiki.getFilterRunPrefixes();
	options.switches.includeAll = true;
	return (filterRunPrefixes["map"]).call(this,operationSubFunction,options);
};

})();