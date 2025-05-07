/*\
title: $:/plugins/tiddlywiki/internals/filterinspection/modules/startup.js
type: application/javascript
module-type: startup

Install hooks

\*/

"use strict";

// Export name and synchronous status
exports.name = "internals-plugin";
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	// Publish public methods
	$tw.plugins = $tw.plugins || {};
	$tw.plugins.internals = {
		getWrappers: getWrappers
	};
	// We accumulate the output of the filter inspection into an array. We can't directly write to the wiki since we might be in the middle
	// of the refresh cycle, when writes to the wiki are not allowed
	var accumulator = [];
	// Add our hook for each filter evaluation
	$tw.hooks.addHook("th-filter-evaluation",function(filterString,wrappers) {
		// Get the list of filters to be inspected
		var inspectedFilters = [];
		$tw.wiki.eachTiddlerPlusShadows(function(tiddler,title) {
			if(tiddler.fields.tags && tiddler.fields.tags.indexOf("$:/tags/InspectableFilter") !== -1 && !tiddler.fields["draft.of"] && tiddler.fields.text) {
				inspectedFilters.push(tiddler.fields.text);
			}
		});
		// Check whether this is a filter we want to inspect
		if(inspectedFilters.indexOf(filterString) === -1) {
			return wrappers;
		}
		// Don't do anything if there are already wrappers
		if(wrappers.prefix || wrappers.operation || wrappers.operator) {
			return wrappers;
		}
		// Flush the accumulator, making each filter inspection output record into a separate tiddler
		var flushAccumulator = function() {
			if(accumulator.length) {
				$tw.utils.each(accumulator,function(jsonInspectionOutput) {
					// Get the output as a string
					var stringInspectionOutput = JSON.stringify(jsonInspectionOutput);
					// Compute the log prefix and its length
					var logPrefix = `$:/temp/filter-inspection/${ + $tw.utils.stringifyDate(new Date())}: `,
						logPrefixLength = logPrefix.length;
					// Check if the the output is the same as the last log with the same filter
					var logTitles = [];
					$tw.wiki.each(function(tiddler,title) {
						if(title.substring(logPrefixLength) === jsonInspectionOutput.inputFilter) {
							logTitles.push(title);
						}
					});
					var alreadyLogged = false;
					$tw.utils.each(logTitles,function(title) {
						var jsonLog = $tw.wiki.getTiddlerData(title);
						if($tw.utils.isArrayEqual(jsonLog.output,jsonInspectionOutput.output)) {
							alreadyLogged = true;
						}
					});
					if(alreadyLogged) {
						return;
					}
					// Add the log tiddler
					var tiddlerFields = {
						title: `${logPrefix}${jsonInspectionOutput.inputFilter}`,
						tags: ["$:/tags/FilterInspectionOutput"],
						text: stringInspectionOutput,
						filter: jsonInspectionOutput.inputFilter,
						type: "application/json"
					}
					// console.log("Adding " + JSON.stringify(tiddlerFields));
					$tw.wiki.addTiddler(new $tw.Tiddler($tw.wiki.getCreationFields(),$tw.wiki.getModificationFields(),tiddlerFields));
				});
				accumulator = [];
			}
		};
		// Get our wrappers
		return getWrappers(function(output) {
			// Schedule a flush
			if(accumulator.length === 0) {
				$tw.utils.nextTick(function() {
					flushAccumulator();
				});
			}
			accumulator.push(output);
		},filterString);
	});
};

/*
Return the wrappers for evaluating a given filter
fnDone is a function that will be called with the output of the filter evaluation as the single argument
inputFilter is the filter to be evaluated
*/
function getWrappers(fnDone,inputFilter) {
	// Skeleton output record
	var output = {
			inputFilter: inputFilter,
			input: [],
			runs: []
		};
	// Keep track of where the current run and the current operation are being written
	var currentRun,currentOperation;
	// Compile the filter with wrapper functions to log the details
	return {
		start: function(source) {
			// Save the input so that we have it in the output record
			source(function(tiddler,title) {
				output.input.push(title);
			});
		},
		prefix: function(filterRunPrefixFunction,operationFunction,innerOptions) {
			// Function to be called at the start of each filter run
			return function(results,innerSource,innerWidget) {
				// Save the details of this filte run
				var details ={
						input: results.toArray(),
						prefixName: innerOptions.prefixName,
						prefix: innerOptions.prefix,
						suffixes: innerOptions.suffixes,
						operations: []
					};
				// Save the current run so that we can add operations to it
				currentRun = details.operations;
				// Get the filter run prefix function
				var innerResults = filterRunPrefixFunction.call(null,operationFunction,innerOptions);
				// Invoke the filter run
				innerResults(results,innerSource,innerWidget);
				// Save the results of the filter run
				details.output = results.toArray();
				output.runs.push(details);
			};
		},
		operation: function(operationFunction,operation) {
			// Record the operation
			var details = {
				operators: []
			}
			// Keep track of where the current operation should be being written
			currentOperation = details.operators;
			currentRun.push(details);
			// Invoke the operation
			operationFunction();
		},
		operator: function(operatorFunction,innerSource,innerOperator,innerOptions) {
			// Record the operator
			var details = {
					operatorName: innerOperator.operatorName,
					operands: innerOperator.operands,
					parseTree: innerOperator.parseTree,
					prefix: innerOperator.prefix,
					suffix: innerOperator.suffix,
					suffixes: innerOperator.suffixes,
					regexp: innerOperator.regexp,
					input: []
				};
			// Copy the input
			innerSource(function(tiddler,title) {
				details.input.push(title);
			});
			// Save this operation
			currentOperation.push(details);
			// Invoke the operator
			var innerResults = operatorFunction.apply(null,Array.prototype.slice.call(arguments,1));
			// Make sure the results are an array so that we can store them
			if(!$tw.utils.isArray(innerResults)) {
				var resultArray = [];
				innerResults(function(tiddler,title) {
					resultArray.push(title);
				});
				innerResults = resultArray;
			}
			// Store the results in the output
			details.output = innerResults;
			// Return the results
			return innerResults;
		},
		done: function(results) {
			// Save the results of the filter evaluation
			output.output = results;
			// console.log(`Inspected ${JSON.stringify(output,null,4)}`);
			// Invoke the done function
			if(fnDone) {
				fnDone(output);
			}
		}
	};
}
