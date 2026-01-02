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
			var inputTitles = results.toArray(),
				index = 0,
				suffixes = options.suffixes,
				flatten = (suffixes[0] && suffixes[0][0] === "flat") ? true : false;
			results.clear();
			$tw.utils.each(inputTitles,function(title) {
				var filtered = operationSubFunction(options.wiki.makeTiddlerIterator([title]),widget.makeFakeWidgetWithVariables({
					"currentTiddler": "" + title,
					"..currentTiddler": widget.getVariable("currentTiddler",""),
					"index": "" + index,
					"revIndex": "" +  (inputTitles.length - 1 - index),
					"length": "" + inputTitles.length
				}));
				if(filtered.length && flatten) {
					$tw.utils.each(filtered,function(value) {
						results.push(value);
					})
				} else {
					results.push(filtered[0]||"");
				}
				++index;
			});
		}
	}
};
