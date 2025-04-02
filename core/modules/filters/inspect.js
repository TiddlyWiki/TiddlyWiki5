/*\
title: $:/core/modules/filters/inspect.js
type: application/javascript
module-type: filteroperator

Filter operator for inspecting the evaluation of a filter

\*/

"use strict";

/*
Export our filter function
*/
exports.inspect = function(source,operator,options) {
	var self = this,
		inputFilter = operator.operands[0] || "",
		output = {input: [],runs: [], inputFilter: inputFilter},
		currentRun;
	// Save the input
	source(function(tiddler,title) {
		output.input.push(title);
	});
	// Compile the filter with wrapper functions to log the details
	var compiledFilter = options.wiki.compileFilter(inputFilter,{
			wrappers: {
				prefix: function(filterRunPrefixFunction,operationFunction,innerOptions) {
					return function(results,innerSource,innerWidget) {
						var details ={
								input: results.toArray(),
								prefixName: innerOptions.prefixName,
								suffixes: innerOptions.suffixes,
								operators: []
							};
						currentRun = details.operators;
						var innerResults = filterRunPrefixFunction.call(null,operationFunction,innerOptions);
						innerResults(results,innerSource,innerWidget);
						details.output = results.toArray();
						output.runs.push(details);
					};
				},
				operator: function(operatorFunction,innerSource,innerOperator,innerOptions) {
					var details = {
							operatorName: innerOperator.operatorName,
							operands: innerOperator.operands,
							prefix: innerOperator.prefix,
							suffix: innerOperator.suffix,
							suffixes: innerOperator.suffixes,
							regexp: innerOperator.regexp,
							input: []
						};
					innerSource(function(tiddler,title) {
						details.input.push(title);
					});
					currentRun.push(details);
					var innerResults = operatorFunction.apply(null,Array.prototype.slice.call(arguments,1));
					details.output = innerResults.slice(0);
					return innerResults;
				}
		}
	});
	output.output = compiledFilter.call(options.wiki,source,options.widget);
	var results = [];
console.log(`Inspected ${JSON.stringify(output,null,4)}`);
	results.push(JSON.stringify(output,null,4));
	return results;
};
