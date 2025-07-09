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
	const results = [];
	source((tiddler,title) => {
		results.push(title);
	});
	// Run the filter over each item
	const filterFn = options.wiki.compileFilter(operator.operand);
	let accumulator = operator.operands[1] || "";
	for(let index = 0;index < results.length;index++) {
		const title = results[index];
		const list = filterFn.call(options.wiki,options.wiki.makeTiddlerIterator([title]),options.widget.makeFakeWidgetWithVariables({
			"currentTiddler": `${title}`,
			"..currentTiddler": options.widget.getVariable("currentTiddler"),
			"accumulator": `${accumulator}`,
			"index": `${index}`,
			"revIndex": `${results.length - 1 - index}`,
			"length": `${results.length}`
		}));
		if(list.length > 0) {
			accumulator = `${list[0]}`;
		}
	}
	if(results.length > 0) {
		return [accumulator];
	} else {
		return [];
	}
};
