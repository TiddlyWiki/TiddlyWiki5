/*\
title: $:/core/modules/filterrunprefixes/cascade.js
type: application/javascript
module-type: filterrunprefix
\*/

"use strict";

/*
Export our filter prefix function
*/
exports.cascade = function(operationSubFunction,options) {
	return function(results,source,widget) {
		if(results.length !== 0) {
			const filterList = operationSubFunction(source,widget);
			const filterFnList = [];
			const inputResults = results.toArray();
			results.clear();
			$tw.utils.each(inputResults,(title) => {
				let result = ""; // If no filter matches, we return an empty string
				$tw.utils.each(filterList,(filter,index) => {
					if(!filterFnList[index]) {
						filterFnList[index] = options.wiki.compileFilter(filter);
					}
					const output = filterFnList[index](options.wiki.makeTiddlerIterator([title]),widget.makeFakeWidgetWithVariables({
						"currentTiddler": `${title}`,
						"..currentTiddler": widget.getVariable("currentTiddler","")
					}));
					if(output.length !== 0) {
						result = output[0];
						return false;
					}
				});
				results.push(result);
			});
		}
	};
};
