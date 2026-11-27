/*\
title: $:/core/modules/filterrunprefixes/sort.js
type: application/javascript
module-type: filterrunprefix

\*/

"use strict";

/*
Export our filter prefix function
*/
exports.sort = function(operationSubFunction,options) {
	return function(results,source,widget) {
		if(results.length > 0) {
			const suffixes = options.suffixes,
				sortType = (suffixes[0] && suffixes[0][0]) ? suffixes[0][0] : "string",
				invert = suffixes[1] ? suffixes[1].includes("reverse") : false,
				isCaseSensitive = suffixes[1] ? suffixes[1].includes("casesensitive") : false,
				inputTitles = results.toArray(),
				sortKeys = [],
				compareFn = $tw.utils.makeCompareFunction(sortType,{defaultType: "string", invert:invert, isCaseSensitive:isCaseSensitive});
			results.each((title) => {
				const key = operationSubFunction(
					options.wiki.makeTiddlerIterator([title]),
					widget.makeFakeWidgetWithVariables({
						"currentTiddler": "" + title,
						"..currentTiddler": widget.getVariable("currentTiddler",{defaultValue:""})
					})
				);
				sortKeys.push(key[0] || "");
			});
			results.clear();
			// Prepare an array of indexes to sort
			let indexes = Array.from(inputTitles.keys());
			indexes.sort((a,b) => compareFn(sortKeys[a],sortKeys[b]));
			indexes.forEach((index) => {
				results.push(inputTitles[index]);
			});
		}
	};
};
