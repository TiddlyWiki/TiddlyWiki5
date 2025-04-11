/*\
title: $:/plugins/tiddlywiki/internals/startup.js
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
	$tw.plugins = $tw.plugins || {};
	$tw.plugins.internals = {
		getWrappers: getWrappers
	};
	var inspectedFilters = [
		"[all[shadows+tiddlers]tag[$:/tags/ViewTemplate]!is[draft]]"
	],
		accumulator = [];
	$tw.hooks.addHook("th-filter-evaluation",function(filterString,wrappers) {
		// Check whether this is a filter we want to inspect
		if(inspectedFilters.indexOf(filterString) === -1) {
			return wrappers;
		}
		// Don't do anything if there are already wrappers
		if(wrappers.prefix || wrappers.operation || wrappers.operator) {
			return wrappers;
		}
		var flushAccumulator = function() {
			if(accumulator.length) {
				$tw.utils.each(accumulator,function(jsonInspectionOutput) {
					// Get the output as a string
					var stringInspectionOutput = JSON.stringify(jsonInspectionOutput),
						logPrefix = `$:/temp/filter-inspection/${ + $tw.utils.stringifyDate(new Date())}: `,
						logPrefixLength = logPrefix.length;
					// Check if the the output is the same as the last log with the same filter
					var logTitles = [];
					$tw.wiki.each(function(tiddler,title) {
						if(title.substring(logPrefixLength) === filterString) {
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
						title: `${logPrefix}${filterString}`,
						tags: ["$:/tags/FilterInspectionOutput"],
						text: stringInspectionOutput,
						filter: filterString,
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

function getWrappers(fnDone,inputFilter) {
	var output = {
			inputFilter: inputFilter,
			input: [],
			runs: []
		},
		currentRun,currentOperation;
	// Compile the filter with wrapper functions to log the details
	return {
		start: function(source) {
			// Save the input
			source(function(tiddler,title) {
				output.input.push(title);
			});
		},
		prefix: function(filterRunPrefixFunction,operationFunction,innerOptions) {
			return function(results,innerSource,innerWidget) {
				var details ={
						input: results.toArray(),
						prefixName: innerOptions.prefixName,
						suffixes: innerOptions.suffixes,
						operations: []
					};
				currentRun = details.operations;
				var innerResults = filterRunPrefixFunction.call(null,operationFunction,innerOptions);
				innerResults(results,innerSource,innerWidget);
				details.output = results.toArray();
				output.runs.push(details);
			};
		},
		operation: function(operationFunction,operation) {
			var details = {
				operators: []
			}
			currentOperation = details.operators;
			currentRun.push(details);
			operationFunction();
		},
		operator: function(operatorFunction,innerSource,innerOperator,innerOptions) {
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
			innerSource(function(tiddler,title) {
				details.input.push(title);
			});
			currentOperation.push(details);
			var innerResults = operatorFunction.apply(null,Array.prototype.slice.call(arguments,1));
			if(!$tw.utils.isArray(innerResults)) {
				var resultArray = [];
				innerResults(function(tiddler,title) {
					resultArray.push(title);
				});
				innerResults = resultArray;
			}
			details.output = innerResults;
			return innerResults;
		},
		done: function(results) {
			output.output = results;
			// console.log(`Inspected ${JSON.stringify(output,null,4)}`);
			if(fnDone) {
				fnDone(output);
			}
		}
	};
}
