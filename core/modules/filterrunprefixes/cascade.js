/*\
title: $:/core/modules/filterrunprefixes/cascade.js
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
exports.cascade = function(operationSubFunction,options) {
	return function(results,source,widget) {
		if(results.length !== 0) {
			var filterList = operationSubFunction(source,widget);
			var inputResults = results.toArray();
			results.clear();
			$tw.utils.each(inputResults,function(title) {
				var result = ""; // If no filter matches, we return an empty string
				$tw.utils.each(filterList,function(filter) {
					var output = options.wiki.filterTiddlers(filter,widget,options.wiki.makeTiddlerIterator([title]));
					if(output.length !== 0) {
						result = output[0];
						return false;
					}
				});
				results.push(result);
			});
		}
	}
};

})();