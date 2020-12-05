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
			for(var index=0; index<results.length; index++) {
				var title = results[index],
					list = operationSubFunction(options.wiki.makeTiddlerIterator([title]),{
						getVariable: function(name) {
							switch(name) {
								case "currentTiddler":
									return "" + title;
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
			}
			results.splice(0,results.length);
			results.push(accumulator);	
		}
	}
};

})();
