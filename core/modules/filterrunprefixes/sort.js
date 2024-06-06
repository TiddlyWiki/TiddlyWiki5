/*\
title: $:/core/modules/filterrunprefixes/sort.js
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
exports.sort = function(operationSubFunction,options) {
	return function(results,source,widget) {
		if(results.length > 0) {
			var suffixes = options.suffixes,
				sortType = (suffixes[0] && suffixes[0][0]) ? suffixes[0][0] : "string",
				invert = suffixes[1] ? (suffixes[1].indexOf("reverse") !== -1) : false,
				isCaseSensitive = suffixes[1] ? (suffixes[1].indexOf("casesensitive") !== -1) : false,
				inputTitles = results.toArray(),
				sortKeys = [],
				indexes = new Array(inputTitles.length),
				compareFn;
			results.each(function(title) {
				var key = operationSubFunction(options.wiki.makeTiddlerIterator([title]),widget.makeFakeWidgetWithVariables({
					"currentTiddler": "" + title,
					"..currentTiddler": widget.getVariable("currentTiddler")
				}));
				sortKeys.push(key[0] || "");
			});
			results.clear();
			// Prepare an array of indexes to sort
			for(var t=0; t<inputTitles.length; t++) {
				indexes[t] = t;
			}
			// Sort the indexes
			compareFn = $tw.utils.makeCompareFunction(sortType,{defaultType: "string", invert:invert, isCaseSensitive:isCaseSensitive});
			indexes = indexes.sort(function(a,b) {
					return compareFn(sortKeys[a],sortKeys[b]);
			});
			// Add to results in correct order
			$tw.utils.each(indexes,function(index) {
				results.push(inputTitles[index]);
			});
		}
	}
};

})();