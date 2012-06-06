/*\
title: $:/core/modules/wiki.filters.js
type: application/javascript
module-type: wikimethod

Adds tiddler filtering to the $tw.Wiki object.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.filterTiddlers = function(filterString) {
	var fn = this.compileFilter(filterString);
	return fn.call(this,this.tiddlers);
};

/*
Compiling a filter gives a JavaScript function that is invoked as `this.filter(source)`, where `source` is a hashmap of source tiddler titles (the values don't matter, so it is possible to use a store or a changes object). It returns an array of tiddler titles that satisfy the filter
*/
exports.compileFilter = function(filterString) {
	var filter = this.parseFilter(filterString),
		output = [],
		t,operation,operationInfo,type,p,operator,operatorInfo,fn;
	output.push(this.filterFragments.prologue);
	for(t=0; t<filter.length; t++) {
		operation = filter[t];
		operationInfo = this.filterFragments.operation.prefix[operation.prefix || ""];
		output.push(operationInfo.prologue);
		type = "selector";
		if(operation.prefix === "+") {
			type = "filter";
		}
		for(p=0; p<operation.operators.length; p++) {
			operator = operation.operators[p];
			operatorInfo = this.operators[operator.operator];
			if(!operatorInfo) { // Check for it being a field operator
				operatorInfo = this.operators.field;
			}
			output.push(operatorInfo[type](operator));
			type = "filter";
		}
		output.push(operationInfo.epilogue);
	}
	output.push(this.filterFragments.epilogue);
	try {
		/*jslint evil: true */
		fn = eval(output.join("\n"));
	} catch(ex) {
		throw "Error in filter expression: " + ex;
	}
	return fn;
};

exports.filterFragments = {
	prologue: "(function(source) {\nvar results = [], subResults;",
	epilogue: "return results;\n})",
	operation: {
		prefix: {
			"": {
				prologue: "subResults = [];",
				epilogue: "$tw.utils.pushTop(results,subResults);"
			},
			"+": {
				prologue: "subResults = results.slice(0);\nresults.splice(0,results.length);",
				epilogue: "$tw.utils.pushTop(results,subResults);"
			},
			"-": {
				prologue: "subResults = [];",
				epilogue: "$tw.utils.removeArrayEntries(results,subResults);"
			}
		}
	}
};

exports.operators = {
	"title": {
		selector: function(operator) {
			return "if($tw.utils.hop(source,\"" + $tw.utils.stringify(operator.operand) + "\")) {$tw.utils.pushTop(subResults,\"" + $tw.utils.stringify(operator.operand) + "\");}";
		},
		filter: function(operator) {
			return "if(subResults.indexOf(\"" + $tw.utils.stringify(operator.operand) + "\") !== -1) {subResults = [\"" + $tw.utils.stringify(operator.operand) + "\"];} else {subResults = [];}";
		}
	},
	"prefix": {
		selector: function(operator) {
			var op = operator.prefix === "!" ? "!" : "=";
			return "for(var title in source) {if(title.substr(0," + operator.operand.length + ")" + op + "==\"" + $tw.utils.stringify(operator.operand) + "\") {$tw.utils.pushTop(subResults,title);}}";
		},
		filter: function(operator) {
			var op = operator.prefix === "!" ? "=" : "!";
			return "for(var r=subResults.length-1; r>=0; r--) {if(title.substr(0," + operator.operand.length + ")" + op + "==\"" + $tw.utils.stringify(operator.operand) + "\") {subResults.splice(r,1);}}";
		}
	},
	"is": {
		selector: function(operator) {
			if(operator.operand === "tiddler") {
				if(operator.prefix === "!") {
					return "subResults = [];";
				} else {
					return "for(var title in source) {$tw.utils.pushTop(subResults,title);}";
				}
			} else {
				throw "Unknown operand for 'is' filter operator";
			}
		},
		filter: function(operator) {
			if(operator.operand === "tiddler") {
				if(operator.prefix === "!") {
					return "subResults = [];";
				} else {
					return "";
				}
			} else {
				throw "Unknown operand for 'is' filter operator";
			}
		}
	},
	"tag": {
		selector: function(operator) {
			var op = operator.prefix === "!" ? "!" : "";
			return "for(var title in source) {if(" + op + "this.getTiddler(title).hasTag(\"" + $tw.utils.stringify(operator.operand) + "\")) {$tw.utils.pushTop(subResults,title);}}";
		},
		filter: function(operator) {
			var op = operator.prefix === "!" ? "" : "!";
			return "for(var r=subResults.length-1; r>=0; r--) {if(" + op + "this.getTiddler(subResults[r]).hasTag(\"" + $tw.utils.stringify(operator.operand) + "\")) {subResults.splice(r,1);}}";
		}
	},
	"has": {
		selector: function(operator) {
			var op = operator.prefix === "!" ? "=" : "!";
			return "for(var title in source) {if(this.getTiddler(title).fields[\"" + $tw.utils.stringify(operator.operand) + "\"] " + op + "== undefined) {$tw.utils.pushTop(subResults,title);}}";
		},
		filter: function(operator) {
			var op = operator.prefix === "!" ? "!" : "=";
			return "for(var r=subResults.length-1; r>=0; r--) {if(this.getTiddler(subResults[r]).fields[\"" + $tw.utils.stringify(operator.operand) + "\"] " + op + "== undefined) {subResults.splice(r,1);}}";
		}
	},
	"sort": {
		selector: function(operator) {
			throw "Cannot use sort operator at the start of a filter operation";
		},
		filter: function(operator) {
			var desc = operator.prefix === "!" ? "true" : "false";
			return "this.sortTiddlers(subResults,\"" + $tw.utils.stringify(operator.operand) + "\"," + desc + ");";
		}
	},
	"limit": {
		selector: function(operator) {
			throw "Cannot use limit operator at the start of a filter operation";
		},
		filter: function(operator) {
			var limit = parseInt(operator.operand,10),
				base = operator.prefix === "!" ? 0 : limit;
			return "if(subResults.length > " + limit + ") {subResults.splice(" + base + ",subResults.length-" + limit + ");}";
		}
	},
	"field": {
		selector: function(operator) {
			var op = operator.prefix === "!" ? "!" : "=";
			return "for(var title in source) {if(this.getTiddler(title).fields[\"" + $tw.utils.stringify(operator.operator) + "\"] " + op + "== \"" + operator.operand + "\") {$tw.utils.pushTop(subResults,title);}}";
		},
		filter: function(operator) {
			var op = operator.prefix === "!" ? "=" : "!";
			return "for(var r=subResults.length-1; r>=0; r--) {if(this.getTiddler(subResults[r]).fields[\"" + $tw.utils.stringify(operator.operator) + "\"] " + op + "== \"" + operator.operand + "\") {subResults.splice(r,1);}}";
		}
	}
};

/*
Parses an operation within a filter string
	results: Array of array of operator nodes into which results should be inserted
	filterString: filter string
	p: start position within the string
Returns the new start position, after the parsed operation
*/
function parseFilterOperation(operators,filterString,p) {
	var operator, operand, bracketPos;
	// Skip the starting square bracket
	if(filterString[p++] !== "[") {
		throw "Missing [ in filter expression";
	}
	// Process each operator in turn
	do {
		operator = {};
		// Check for an operator prefix
		if(filterString[p] === "!") {
			operator.prefix = filterString[p++];
		}
		// Get the operator name
		bracketPos = filterString.indexOf("[",p);
		if(bracketPos === -1) {
			throw "Missing [ in filter expression";
		}
		operator.operator = filterString.substring(p,bracketPos);
		if(operator.operator === "") {
			operator.operator = "title";
		}
		p = bracketPos + 1;
		// Get the operand
		bracketPos = filterString.indexOf("]",p);
		if(bracketPos === -1) {
			throw "Missing ] in filter expression";
		}
		operator.operand = filterString.substring(p,bracketPos);
		p = bracketPos + 1;
		// Push this operator
		operators.push(operator);
	} while(filterString[p] !== "]");
	// Skip the ending square bracket
	if(filterString[p++] !== "]") {
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

})();
