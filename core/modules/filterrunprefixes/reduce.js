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
			var accumulator = "";
			var index = 0;
			results.each(function(title) {
				var list = operationSubFunction(options.wiki.makeTiddlerIterator([title]),{
					getVariable: function(name) {
						switch(name) {
							case "currentTiddler":
								return "" + title;
							case "..currentTiddler":
								return widget.getVariable("currentTiddler");
							case "accumulator":
								return "" + accumulator;
							case "index":
								return "" + index;
							case "revIndex":
								return "" +  (results.length - 1 - index);
							case "length":
								return "" + results.length;
							default:
								return widget.getVariable(name);
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
