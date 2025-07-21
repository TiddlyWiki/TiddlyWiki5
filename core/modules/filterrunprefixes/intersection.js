/*\
title: $:/core/modules/filterrunprefixes/intersection.js
type: application/javascript
module-type: filterrunprefix

\*/

"use strict";

/*
Export our filter prefix function
*/
exports.intersection = function(operationSubFunction) {
	return function(results,source,widget) {
		if(results.length !== 0) {
			const secondRunResults = operationSubFunction(source,widget);
			const firstRunResults = results.toArray();
			results.clear();
			$tw.utils.each(firstRunResults,(title) => {
				if(secondRunResults.includes(title)) {
					results.push(title);
				}
			});
		}
	};
};
