/*\
title: $:/core/modules/filters/reduce.js
type: application/javascript
module-type: filteroperator

Filter operator evaluates a subfilter for each item, making the running total available in the variable `accumulator`, and the current index available in the variable `index`

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.reduce = function(source,operator,options) {
	// Accumulate the list
	var results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	// Run the filter over each item
	var filterFn = options.wiki.compileFilter(operator.operand),
		accumulator = operator.operands[1] || "";
	for(var index=0; index<results.length; index++) {
		var title = results[index],
			list = filterFn.call(options.wiki,options.wiki.makeTiddlerIterator([title]),{
				getVariable: function(name) {
					switch(name) {
						case "currentTiddler":
							return "" + title;
						case "accumulator":
							return "" + accumulator;
						case "index":
							return "" + index;
						case "revIndex":
							return "" + (results.length - 1 - index);
						case "length":
							return "" + results.length;
						default:
							return options.widget.getVariable(name);
					}
				}
			});
		if(list.length > 0) {
			accumulator = "" +  list[0];
		}
	}
	return [accumulator];
};

})();
