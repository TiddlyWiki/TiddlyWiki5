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
exports.filter = function(operationSubFunction,options) {
	return function(results,source,widget) {
		if(results.length > 0) {
			var resultsToRemove = [],
				index = 0;
			results.each(function(title) {
				var filtered = operationSubFunction(options.wiki.makeTiddlerIterator([title]),widget.makeFakeWidgetWithVariables({
					"currentTiddler": "" + title,
					"..currentTiddler": widget.getVariable("currentTiddler",""),
					"index": "" + index,
					"revIndex": "" +  (results.length - 1 - index),
					"length": "" + results.length
				}));
				if(filtered.length === 0) {
					resultsToRemove.push(title);
				}
				++index;
			});
			results.remove(resultsToRemove);
		}
	}
};

})();
