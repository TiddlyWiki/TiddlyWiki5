/*\
title: $:/plugins/tiddlywiki/internals/filterinspection/modules/inspect.js
type: application/javascript
module-type: filteroperator

Filter operator for inspecting the evaluation of a filter

\*/

"use strict";

var getWrappers = $tw.plugins.internals.getWrappers;

/*
Export our filter function
*/
exports.inspect = function(source,operator,options) {
	var inputFilter = operator.operands[0] || "",
		results,
		wrappers = getWrappers(function(output) {
			results = output;
		},inputFilter);
	// Compile the filter with wrapper functions to log the details
	var compiledFilter = options.wiki.compileFilter(inputFilter,{
			wrappers: wrappers
	});
	compiledFilter.call(options.wiki,source,options.widget);
	return [JSON.stringify(results)];
};