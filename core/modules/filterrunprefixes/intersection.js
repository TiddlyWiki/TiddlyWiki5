/*\
title: $:/core/modules/filterrunprefixes/intersection.js
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
exports.intersection = function(operationSubFunction) {
	return function(results,source,widget) {
		if(results.length !== 0) {
			var secondRunResults = operationSubFunction(source,widget);
			var firstRunResults = results.toArray();
			results.clear();
			$tw.utils.each(firstRunResults,function(title) {
				if(secondRunResults.indexOf(title) !== -1) {
					results.push(title);
				}
			});
		}
	};
};

})();
