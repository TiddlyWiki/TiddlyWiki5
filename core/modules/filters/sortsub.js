/*\
title: $:/core/modules/filters/sortsub.js
type: application/javascript
module-type: filteroperator

Filter operator for sorting by a subfilter

\*/

"use strict";

/*
Export our filter function
*/
exports.sortsub = function(source,operator,options) {
	// Compile the subfilter
	const filterFn = options.wiki.compileFilter(operator.operand);
	// Collect the input titles and the corresponding sort keys
	const inputTitles = [];
	const sortKeys = [];
	source((tiddler,title) => {
		inputTitles.push(title);
		const r = filterFn.call(options.wiki,(iterator) => {
			iterator(options.wiki.getTiddler(title),title);
		},options.widget.makeFakeWidgetWithVariables({
			"currentTiddler": `${title}`,
			"..currentTiddler": options.widget.getVariable("currentTiddler")
		}));
		sortKeys.push(r[0] || "");
	});
	// Rather than sorting the titles array, we'll sort the indexes so that we can consult both arrays
	let indexes = new Array(inputTitles.length);
	for(let t = 0;t < inputTitles.length;t++) {
		indexes[t] = t;
	}
	// Sort the indexes
	const compareFn = $tw.utils.makeCompareFunction(operator.suffix,{defaultType: "string",invert: operator.prefix === "!"});
	indexes = indexes.sort((a,b) => {
		return compareFn(sortKeys[a],sortKeys[b]);
	});
	// Make the results array in order
	const results = [];
	$tw.utils.each(indexes,(index) => {
		results.push(inputTitles[index]);
	});
	return results;
};
