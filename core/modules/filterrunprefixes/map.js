/*\
title: $:/core/modules/filterrunprefixes/map.js
type: application/javascript
module-type: filterrunprefix
\*/

"use strict";

/*
Export our filter prefix function
*/
exports.map = function(operationSubFunction,options) {
	return function(results,source,widget) {
		if(results.length > 0) {
			const inputTitles = results.toArray();
			let index = 0;
			const {suffixes} = options;
			const flatten = !!((suffixes[0] && suffixes[0][0] === "flat"));
			results.clear();
			$tw.utils.each(inputTitles,(title) => {
				const filtered = operationSubFunction(options.wiki.makeTiddlerIterator([title]),widget.makeFakeWidgetWithVariables({
					"currentTiddler": `${title}`,
					"..currentTiddler": widget.getVariable("currentTiddler",""),
					"index": `${index}`,
					"revIndex": `${inputTitles.length - 1 - index}`,
					"length": `${inputTitles.length}`
				}));
				if(filtered.length && flatten) {
					$tw.utils.each(filtered,(value) => {
						results.push(value);
					});
				} else {
					results.push(filtered[0] || "");
				}
				++index;
			});
		}
	};
};
