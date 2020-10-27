/*\
title: $:/core/modules/filterrunprefixes/filter.js
type: application/javascript
module-type: filterrunprefix

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.filter = function(operationSubFunction) {
	return function(results,source,widget) {
		if(results.length > 0) {
			var resultsToRemove = [];
			$tw.utils.each(results,function(result) {
				var filtered = operationSubFunction($tw.wiki.makeTiddlerIterator([result]),widget);
				if(filtered.length === 0) {
					resultsToRemove.push(result);
				}
			});
			$tw.utils.removeArrayEntries(results,resultsToRemove);
		}
	}
};

})();
