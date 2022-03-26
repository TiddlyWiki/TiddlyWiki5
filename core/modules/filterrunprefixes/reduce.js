/*\
title: $:/core/modules/filterrunprefixes/reduce.js
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
exports.reduce = function(operationSubFunction,options) {
	return function(results,source,widget) {
		if(results.length > 0) {
			var accumulator = "",
				index = 0;
			results.each(function(title) {
				var list = operationSubFunction(options.wiki.makeTiddlerIterator([title]),{
					getVariable: function(name,opts) {
						opts = opts || {};
						opts.variables = {
							"currentTiddler": "" + title,
							"..currentTiddler": widget.getVariable("currentTiddler"),
							"index": "" + index,
							"revIndex": "" +  (results.length - 1 - index),
							"length": "" + results.length,
							"accumulator": "" + accumulator
						};
						if(name in opts.variables) {
							return opts.variables[name];
						} else {
							return widget.getVariable(name,opts);
						}
					}
				});
				if(list.length > 0) {
					accumulator = "" + list[0];
				}
				++index;
			});
			results.clear();
			results.push(accumulator);
		}
	}
};

})();
