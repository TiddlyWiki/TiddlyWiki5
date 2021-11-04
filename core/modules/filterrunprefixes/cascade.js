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
			var filterList = operationSubFunction(source,widget),
				filterFnList = [];
			var inputResults = results.toArray();
			results.clear();
			$tw.utils.each(inputResults,function(title) {
				var result = ""; // If no filter matches, we return an empty string
				$tw.utils.each(filterList,function(filter,index) {
					if(!filterFnList[index]) {
						filterFnList[index] = options.wiki.compileFilter(filter);
					}
					var output = filterFnList[index](options.wiki.makeTiddlerIterator([title]),{
							getVariable: function(name) {
								switch(name) {
									case "currentTiddler":
										return "" + title;
									case "..currentTiddler":
										return widget.getVariable("currentTiddler");
									default:
										return widget.getVariable(name);
								}
							}
						});
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