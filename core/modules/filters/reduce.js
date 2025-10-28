/*\
title: $:/core/modules/filters/reduce.js
type: application/javascript
module-type: filteroperator

Filter operator evaluates a subfilter for each item, making the running total available in the variable `accumulator`, and the current index available in the variable `index`

\*/

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
			list = filterFn.call(options.wiki,options.wiki.makeTiddlerIterator([title]),options.widget.makeFakeWidgetWithVariables({
				"currentTiddler": "" + title,
				"..currentTiddler": options.widget.getVariable("currentTiddler"),
				"accumulator": "" + accumulator,
				"index": "" + index,
				"revIndex": "" + (results.length - 1 - index),
				"length": "" + results.length
			}));
		if(list.length > 0) {
			accumulator = "" +  list[0];
		}
	}
	if(results.length > 0) {
		return [accumulator];
	} else {
		return [];
	}
};
