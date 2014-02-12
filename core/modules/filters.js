/*\
title: $:/core/modules/filters.js
type: application/javascript
module-type: wikimethod

Adds tiddler filtering to the $tw.Wiki object.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Parses an operation within a filter string
	results: Array of array of operator nodes into which results should be inserted
	filterString: filter string
	p: start position within the string
Returns the new start position, after the parsed operation
*/
function parseFilterOperation(operators,filterString,p) {
	var operator, operand, bracketPos, curlyBracketPos;
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
		var nextBracketPos = filterString.substring(p).search(/[\[\{\/]/);
		if(nextBracketPos === -1) {
			throw "Missing [ in filter expression";
		}
		nextBracketPos += p;
		var bracket = filterString.charAt(nextBracketPos);
		operator.operator = filterString.substring(p,nextBracketPos);
		
		// Any suffix?
		var colon = operator.operator.indexOf(':');
		if(colon > -1) {
			operator.field = operator.operator.substring(colon+1);
			operator.operator = operator.operator.substring(0,colon) || "field";
		}
		// Empty operator means: title
		else if(operator.operator === "") {
			operator.operator = "title";
		}

		p = nextBracketPos + 1;
		switch (bracket) {
		case '{': // Curly brackets
			operator.indirect = true;
			nextBracketPos = filterString.indexOf('}',p);
			break;
		case '[': // Square brackets
			nextBracketPos = filterString.indexOf(']',p);
			break;
		case '/': // regexp brackets
			var rex = /^((?:[^\\\/]*|\\.)*)\/(?:\(([mygi]+)\))?/g,
				rexMatch = rex.exec(filterString.substring(p));
			if(rexMatch) {
				operator.regexp = new RegExp(rexMatch[1], rexMatch[2]);
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
		if(!operator.regexp) {
			operator.operand = filterString.substring(p,nextBracketPos);
		}
		p = nextBracketPos + 1;
			
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
		operandRegExp = /((?:\+|\-)?)(?:(\[)|("(?:[^"])*")|('(?:[^'])*')|([^\s\[\]]+))/mg;
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
				throw "Syntax error in filter expression";
			}
			var operation = {
				prefix: "",
				operators: []
			};
			if(match[1]) {
				operation.prefix = match[1];
				p++;
			}
			if(match[2]) { // Opening square bracket
				p = parseFilterOperation(operation.operators,filterString,p);
			} else {
				p = match.index + match[0].length;
			}
			if(match[3] || match[4] || match[5]) { // Double quoted string, single quoted string or unquoted title
				operation.operators.push(
					{operator: "title", operand: match[3] || match[4] || match[5]}
				);
			}
			results.push(operation);
		}
	}
	return results;
};

exports.getFilterOperators = function() {
	if(!this.filterOperators) {
		$tw.Wiki.prototype.filterOperators = {};
		$tw.modules.applyMethods("filteroperator",this.filterOperators);
	}
	return this.filterOperators;
};

exports.filterTiddlers = function(filterString,currTiddlerTitle,tiddlerList) {
	var fn = this.compileFilter(filterString);
	return fn.call(this,tiddlerList || this.tiddlers,currTiddlerTitle);
};

exports.compileFilter = function(filterString) {
	var filterParseTree;
	try {
		filterParseTree = this.parseFilter(filterString);
	} catch(e) {
		return function(source,currTiddlerTitle) {
			return ["Filter error: " + e];
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
		var operationSubFunction = function(source,currTiddlerTitle) {
			var accumulator = source,
				results = [];
			$tw.utils.each(operation.operators,function(operator) {
				var operatorFunction = filterOperators[operator.operator] || filterOperators.field || function(source,operator,operations) {
						return ["Filter Error: unknown operator '" + operator.operator + "'"];
					},
					operand = operator.operand;
				if(operator.indirect) {
					operand = self.getTextReference(operator.operand,"",currTiddlerTitle);
				}
				results = operatorFunction(accumulator,{
							operator: operator.operator,
							operand: operand,
							prefix: operator.prefix,
							field: operator.field,
							regexp: operator.regexp
						},{
							wiki: self,
							currTiddlerTitle: currTiddlerTitle
						});
				accumulator = results;
			});
			return results;
		};
		// Wrap the operator functions in a wrapper function that depends on the prefix
		operationFunctions.push((function() {
			switch(operation.prefix || "") {
				case "": // No prefix means that the operation is unioned into the result
					return function(results,source,currTiddlerTitle) {
						$tw.utils.pushTop(results,operationSubFunction(source,currTiddlerTitle));
					};
				case "-": // The results of this operation are removed from the main result
					return function(results,source,currTiddlerTitle) {
						$tw.utils.removeArrayEntries(results,operationSubFunction(source,currTiddlerTitle));
					};
				case "+": // This operation is applied to the main results so far
					return function(results,source,currTiddlerTitle) {
						// This replaces all the elements of the array, but keeps the actual array so that references to it are preserved
						source = results.slice(0);
						results.splice(0,results.length);
						$tw.utils.pushTop(results,operationSubFunction(source,currTiddlerTitle));
					};
			}
		})());
	});
	// Return a function that applies the operations to a source array/hashmap of tiddler titles
	return function(source,currTiddlerTitle) {
		var results = [];
		$tw.utils.each(operationFunctions,function(operationFunction) {
			operationFunction(results,source,currTiddlerTitle);
		});
		return results;
	};
};

})();
