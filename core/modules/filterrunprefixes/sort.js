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
			const {suffixes} = options;
			const sortType = (suffixes[0] && suffixes[0][0]) ? suffixes[0][0] : "string";
			const invert = suffixes[1] ? (suffixes[1].includes("reverse")) : false;
			const isCaseSensitive = suffixes[1] ? (suffixes[1].includes("casesensitive")) : false;
			const inputTitles = results.toArray();
			const sortKeys = [];
			let indexes = new Array(inputTitles.length);
			let compareFn;
			results.each((title) => {
				const key = operationSubFunction(options.wiki.makeTiddlerIterator([title]),widget.makeFakeWidgetWithVariables({
					"currentTiddler": `${title}`,
					"..currentTiddler": widget.getVariable("currentTiddler")
				}));
				sortKeys.push(key[0] || "");
			});
			results.clear();
			// Prepare an array of indexes to sort
			for(let t = 0;t < inputTitles.length;t++) {
				indexes[t] = t;
			}
			// Sort the indexes
			compareFn = $tw.utils.makeCompareFunction(sortType,{defaultType: "string",invert,isCaseSensitive});
			indexes = indexes.sort((a,b) => {
				return compareFn(sortKeys[a],sortKeys[b]);
			});
			// Add to results in correct order
			$tw.utils.each(indexes,(index) => {
				results.push(inputTitles[index]);
			});
		}
	};
};
