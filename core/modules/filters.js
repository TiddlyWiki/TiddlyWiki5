/*\
title: $:/core/modules/filters.js
type: application/javascript
module-type: wikimethod

Adds tiddler filtering methods to the $tw.Wiki object.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widgetClass = require("$:/core/modules/widgets/widget.js").widget;

/* Maximum permitted filter recursion depth */
var MAX_FILTER_DEPTH = 300;

/*
Parses an operation (i.e. a run) within a filter string
	operators: Array of array of operator nodes into which results should be inserted
	filterString: filter string
	p: start position within the string
Returns the new start position, after the parsed operation
*/
function parseFilterOperation(operators,filterString,p) {
	var nextBracketPos, operator;
	// Skip the starting square bracket
	if(filterString.charAt(p++) !== "[") {
		throw "Missing [ in filter expression";
	}
	// Process each operator in turn
	do {
		operator = {};
		// Check for an operator prefix
		if(filterString.charAt(p) === "!") {
			operator.prefix = filterString.charAt(p++);
		}
		// Get the operator name
		nextBracketPos = filterString.substring(p).search(/[\[\{<\/]/);
		if(nextBracketPos === -1) {
			throw "Missing [ in filter expression";
		}
		nextBracketPos += p;
		var bracket = filterString.charAt(nextBracketPos);
		operator.operator = filterString.substring(p,nextBracketPos);
		// Any suffix?
		var colon = operator.operator.indexOf(':');
		if(colon > -1) {
			// The raw suffix for older filters
			operator.suffix = operator.operator.substring(colon + 1);
			operator.operator = operator.operator.substring(0,colon) || "field";
			// The processed suffix for newer filters
			operator.suffixes = [];
			$tw.utils.each(operator.suffix.split(":"),function(subsuffix) {
				operator.suffixes.push([]);
				$tw.utils.each(subsuffix.split(","),function(entry) {
					entry = $tw.utils.trim(entry);
					if(entry) {
						operator.suffixes[operator.suffixes.length - 1].push(entry); 
					}
				});
			});
		}
		// Empty operator means: title
		else if(operator.operator === "") {
			operator.operator = "title";
		}
		operator.operands = [];
		var parseOperand = function(bracketType) {
			var operand = {};
			switch (bracketType) {
				case "{": // Curly brackets
					operand.indirect = true;
					nextBracketPos = filterString.indexOf("}",p);
					break;
				case "[": // Square brackets
					nextBracketPos = filterString.indexOf("]",p);
					break;
				case "<": // Angle brackets
					operand.variable = true;
					nextBracketPos = filterString.indexOf(">",p);
					break;
				case "/": // regexp brackets
					var rex = /^((?:[^\\\/]|\\.)*)\/(?:\(([mygi]+)\))?/g,
						rexMatch = rex.exec(filterString.substring(p));
					if(rexMatch) {
						operator.regexp = new RegExp(rexMatch[1], rexMatch[2]);
	// DEPRECATION WARNING
	console.log("WARNING: Filter",operator.operator,"has a deprecated regexp operand",operator.regexp);
						nextBracketPos = p + rex.lastIndex - 1;
					}
					else {
						throw "Unterminated regular expression in filter expression";
					}
					break;
			}

			if(nextBracketPos === -1) {
				throw "Missing closing bracket in filter expression";
			}
			if(operator.regexp) {
				operand.text = "";
			} else {
				operand.text = filterString.substring(p,nextBracketPos);
			}
			operator.operands.push(operand);
			p = nextBracketPos + 1;
		}

		p = nextBracketPos + 1;
		parseOperand(bracket);

		// Check for multiple operands
		while(filterString.charAt(p) === ",") {
			p++;
			if(/^[\[\{<\/]/.test(filterString.substring(p))) {
				nextBracketPos = p;
				p++;
				parseOperand(filterString.charAt(nextBracketPos));
			} else {
				throw "Missing [ in filter expression";
			}
		}

		// Push this operator
		operators.push(operator);
	} while(filterString.charAt(p) !== "]");
	// Skip the ending square bracket
	if(filterString.charAt(p++) !== "]") {
		throw "Missing ] in filter expression";
	}
	// Return the parsing position
	return p;
}

/*
Parse a filter string
*/
exports.parseFilter = function(filterString) {
	filterString = filterString || "";
	var results = [], // Array of arrays of operator nodes {operator:,operand:}
		p = 0, // Current position in the filter string
		match;
	var whitespaceRegExp = /(\s+)/mg,
		operandRegExp = /((?:\+|\-|~|=|\:(\w+)(?:\:([\w\:, ]*))?)?)(?:(\[)|(?:"([^"]*)")|(?:'([^']*)')|([^\s\[\]]+))/mg;
	while(p < filterString.length) {
		// Skip any whitespace
		whitespaceRegExp.lastIndex = p;
		match = whitespaceRegExp.exec(filterString);
		if(match && match.index === p) {
			p = p + match[0].length;
		}
		// Match the start of the operation
		if(p < filterString.length) {
			operandRegExp.lastIndex = p;
			match = operandRegExp.exec(filterString);
			if(!match || match.index !== p) {
				throw $tw.language.getString("Error/FilterSyntax");
			}
			var operation = {
				prefix: "",
				operators: []
			};
			if(match[1]) {
				operation.prefix = match[1];
				p = p + operation.prefix.length;
				if(match[2]) {
					operation.namedPrefix = match[2];
				}
				if(match[3]) {
					operation.suffixes = [];
					 $tw.utils.each(match[3].split(":"),function(subsuffix) {
						operation.suffixes.push([]);
						$tw.utils.each(subsuffix.split(","),function(entry) {
							entry = $tw.utils.trim(entry);
							if(entry) {
								operation.suffixes[operation.suffixes.length -1].push(entry);
							}
						});
					 });
				}
			}
			if(match[4]) { // Opening square bracket
				p = parseFilterOperation(operation.operators,filterString,p);
			} else {
				p = match.index + match[0].length;
			}
			if(match[5] || match[6] || match[7]) { // Double quoted string, single quoted string or unquoted title
				operation.operators.push(
					{operator: "title", operands: [{text: match[5] || match[6] || match[7]}]}
				);
			}
			results.push(operation);
		}
	}
	return results;
};

exports.getFilterOperators = function() {
	if(!this.filterOperators) {
		$tw.Wiki.prototype.oldFilterOperators = {};
		$tw.modules.applyMethods("filteroperator",this.oldFilterOperators);
		$tw.Wiki.prototype.newFilterOperators = {};
		$tw.modules.applyMethods("newfilteroperator",this.newFilterOperators);
		$tw.Wiki.prototype.filterOperators = $tw.utils.extend({},$tw.Wiki.prototype.oldFilterOperators,$tw.Wiki.prototype.newFilterOperators);
	}
	return this.filterOperators;
};

exports.isFilterOperatorNew = function(name) {
	this.getFilterOperators();
	return name in $tw.Wiki.prototype.newFilterOperators;
};

exports.getFilterRunPrefixes = function() {
	if(!this.filterRunPrefixes) {
		$tw.Wiki.prototype.filterRunPrefixes = {};
		$tw.modules.applyMethods("filterrunprefix",this.filterRunPrefixes);
	}
	return this.filterRunPrefixes;
}

exports.filterTiddlersPolymorphic = function(filterString,widget,source) {
	var fn = this.compileFilter(filterString);
	return fn.call(this,source,widget);
};

exports.filterTiddlers = function(filterString,widget,source) {
	var results = this.filterTiddlersPolymorphic(filterString,widget,source);
	for(var t=0; t<results.length; t++) {
		if(typeof results[t] !== "string") {
			results[t] = $tw.utils.filterItemToString(results[t]);
		}
	}
	return results;
};

/*
Compile a filter into a function with the signature fn(source,widget) where:
source: an iterator function for the source tiddlers, called source(iterator), where iterator is called as iterator(tiddler,title)
widget: an optional widget node for retrieving the current tiddler etc.
*/
exports.compileFilter = function(filterString) {
	if(!this.filterCache) {
		this.filterCache = Object.create(null);
		this.filterCacheCount = 0;
	}
	if(this.filterCache[filterString] !== undefined) {
		return this.filterCache[filterString];
	}
	var filterParseTree;
	try {
		filterParseTree = this.parseFilter(filterString);
	} catch(e) {
		// We do not cache this result, so it adjusts along with localization changes
		return function(source,widget) {
			return [$tw.language.getString("Error/Filter") + ": " + e];
		};
	}
	// Get the hashmap of filter operator functions
	var filterOperators = this.getFilterOperators();
	// Assemble array of functions, one for each operation
	var operationFunctions = [];
	// Step through the operations
	var self = this;
	$tw.utils.each(filterParseTree,function(operation) {
		// Create a function for the chain of operators in the operation
		var operationSubFunction = function(source,widget) {
			var accumulator = source,
				results = [],
				currTiddlerTitle = widget && widget.getVariable("currentTiddler");
			$tw.utils.each(operation.operators,function(operator) {
				var operands = [],
					operatorFunction,
					operatorName;
				if(!operator.operator) {
					// Use the "title" operator if no operator is specified
					operatorFunction = filterOperators.title;
					operatorName = "title";
				} else if(!filterOperators[operator.operator]) {
					// Unknown operators treated as "[unknown]" - at run time we can distinguish between a custom operator and falling back to the default "field" operator
					operatorFunction = filterOperators["[unknown]"];
				} else {
					// Use the operator function
					operatorFunction = filterOperators[operator.operator];
					operatorName = operator.operator;
				}
				$tw.utils.each(operator.operands,function(operand) {
					if(operand.indirect) {
						operand.value = self.getTextReference(operand.text,"",currTiddlerTitle);
					} else if(operand.variable) {
						var varTree = $tw.utils.parseFilterVariable(operand.text);
						operand.value = widgetClass.evaluateVariable(widget,varTree.name,{params: varTree.params, source: source})[0] || "";
					} else {
						operand.value = operand.text;
					}
					operands.push(operand.value);
				});
				// If this is a legacy monomorphic operator then wrap the accumulator source in a wrapper that converts each item to a string
				if(!self.isFilterOperatorNew(operatorName)) {
					var innerAccumulator = accumulator;
					accumulator = function(iterator) {
						innerAccumulator(function(ignored,item) {
							var title = $tw.utils.filterItemToString(item),
								tiddler = self.getTiddler(title);
							iterator(tiddler,title);
						});
					};
				}
				// Invoke the appropriate filteroperator module
				results = operatorFunction(accumulator,{
							operator: operator.operator,
							operand: operands.length > 0 ? operands[0] : undefined,
							operands: operands,
							prefix: operator.prefix,
							suffix: operator.suffix,
							suffixes: operator.suffixes,
							regexp: operator.regexp
						},{
							wiki: self,
							widget: widget
						});
				if($tw.utils.isArray(results)) {
					accumulator = self.makeTiddlerIterator(results);
				} else {
					accumulator = results;
				}
			});
			if($tw.utils.isArray(results)) {
				return results;
			} else {
				var resultArray = [];
				results(function(tiddler,title) {
					resultArray.push(title);
				});
				return resultArray;
			}
		};
		var filterRunPrefixes = self.getFilterRunPrefixes();
		// Wrap the operator functions in a wrapper function that depends on the prefix
		operationFunctions.push((function() {
			var options = {wiki: self, suffixes: operation.suffixes || []};
			switch(operation.prefix || "") {
				case "": // No prefix means that the operation is unioned into the result
					return filterRunPrefixes["or"](operationSubFunction, options);
				case "=": // The results of the operation are pushed into the result without deduplication
					return filterRunPrefixes["all"](operationSubFunction, options);
				case "-": // The results of this operation are removed from the main result
					return filterRunPrefixes["except"](operationSubFunction, options);
				case "+": // This operation is applied to the main results so far
					return filterRunPrefixes["and"](operationSubFunction, options);
				case "~": // This operation is unioned into the result only if the main result so far is empty
					return filterRunPrefixes["else"](operationSubFunction, options);
				default: 
					if(operation.namedPrefix && filterRunPrefixes[operation.namedPrefix]) {
						return filterRunPrefixes[operation.namedPrefix](operationSubFunction, options);
					} else {
						return function(results,source,widget) {
							results.clear();
							results.push($tw.language.getString("Error/FilterRunPrefix"));
						};
					}
			}
		})());
	});
	// Return a function that applies the operations to a source iterator of tiddler titles
	var fnMeasured = $tw.perf.measure("filter: " + filterString,function filterFunction(source,widget) {
		if(!source) {
			source = self.each;
		} else if(typeof source === "object") { // Array or hashmap
			source = self.makeTiddlerIterator(source);
		}
		if(!widget) {
			widget = $tw.rootWidget;
		}
		var results = new $tw.utils.LinkedList();
		self.filterRecursionCount = (self.filterRecursionCount || 0) + 1;
		if(self.filterRecursionCount < MAX_FILTER_DEPTH) {
			$tw.utils.each(operationFunctions,function(operationFunction) {
				operationFunction(results,source,widget);
			});
		} else {
			results.push("/**-- Excessive filter recursion --**/");
		}
		self.filterRecursionCount = self.filterRecursionCount - 1;
		return results.toArray();
	});
	if(this.filterCacheCount >= 2000) {
		// To prevent memory leak, we maintain an upper limit for cache size.
		// Reset if exceeded. This should give us 95% of the benefit
		// that no cache limit would give us.
		this.filterCache = Object.create(null);
		this.filterCacheCount = 0;
	}
	this.filterCache[filterString] = fnMeasured;
	this.filterCacheCount++;
	return fnMeasured;
};

})();
