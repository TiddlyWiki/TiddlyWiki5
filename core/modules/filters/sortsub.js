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
	let filterFn = options.wiki.compileFilter(operator.operand);
	// Collect the input titles and the corresponding sort keys
	let inputTitles = [],
		sortKeys = [];
	source(function(tiddler,title) {
		inputTitles.push(title);
		let r = filterFn.call(options.wiki,function(iterator) {
			iterator(options.wiki.getTiddler(title),title);
		},options.widget.makeFakeWidgetWithVariables({
			"currentTiddler": "" + title,
			"..currentTiddler": options.widget.getVariable("currentTiddler")
		}));
		sortKeys.push(r[0] || "");
	});
	// Rather than sorting the titles array, we'll sort the indexes so that we can consult both arrays
	let indexes = Array.from(inputTitles.keys());
	// Sort the indexes
	let compareFn = $tw.utils.makeCompareFunction(operator.suffix,{defaultType: "string",invert: operator.prefix === "!"});
	indexes = indexes.sort((a,b) => compareFn(sortKeys[a],sortKeys[b]));
	// Make the results array in order
	let results = [];
	$tw.utils.each(indexes,function(index) {
		results.push(inputTitles[index]);
	});
	return results;
};
