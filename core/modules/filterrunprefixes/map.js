/*\
title: $:/core/modules/filterrunprefixes/map.js
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
exports.map = function(operationSubFunction,options) {
	return function(results,source,widget) {
		if(results.length > 0) {
			var inputTitles = results.toArray(),
				index = 0;
			results.clear();
			$tw.utils.each(inputTitles,function(title) {
				var filtered = operationSubFunction(options.wiki.makeTiddlerIterator([title]),{
					getVariable: function(name,opts) {
						opts = opts || {};
						opts.variables = {
							"currentTiddler": "" + title,
							"..currentTiddler": widget.getVariable("currentTiddler"),
							"index": "" + index,
							"revIndex": "" +  (inputTitles.length - 1 - index),
							"length": "" + inputTitles.length
						};
						if(name in opts.variables) {
							return opts.variables[name];
						} else {
							return widget.getVariable(name,opts);
						}
					}
				});
				results.push(filtered[0] || "");
				++index;
			});
		}
	}
};

})();