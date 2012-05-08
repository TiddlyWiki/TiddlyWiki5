/*\
title: $:/core/modules/wiki.filters.js
type: application/javascript
module-type: wikimethod

Adds tiddler filtering to the $tw.Wiki object.

TiddlyWiki has a special syntax for expressing filters. They can be used to select tiddlers for an operation, or to filter a set of tiddlers to add or remove members.

The mechanism is easiest to understand by first presenting some example filter strings:

|!Filter |!Results |
|`HelloThere` |The single tiddler titled `HelloThere` (if it exists) |
|`[[A Title With Several Words]]` |The single tiddler titled `A Title With Several Words` (if it exists) |
|`[title[MyTiddler]]` |The single tiddler titled `MyTiddler` (if it exists) |
|`HelloThere Introduction` |The tiddlers titled `HelloThere` and `Introduction` (if they exist) |
|`[tag[important]]` |Any tiddlers with the tag `important` |
|`[!tag[important]]` |Any tiddlers not with the tag `important` |
|`[tag[important]sort[title]]` |Any tiddlers with the tag `important` sorted by title |
|`[tag[important]!sort[title]]` |Any tiddlers with the tag `important` reverse sorted by title |
|`[[one][two][three]tag[tom]]` |Any of the tiddlers called `one`, `two` or `three` that exist and are tagged with `tom` |
|`[[one][two][three]] [tag[tom]]` |Any of the tiddlers called `one`, `two` or `three` that exist, along with all of the source tiddlers that are tagged with `tom` |
|`[tag[tom]] [tag[harry]] -[[one][two][three]]` |All tiddlers tagged either `tom` or `harry`, but excluding `one`, `two` and `three` |

[[one]] [[two]] [tag[three]] -[[four]] +[sort[title]]
[tag[important]] -[[one][two]] -[[three]] +[sort[-modified]limit[20]]

A filter string consists of one or more filter operations, each comprising one or more filter operators with associated operands.

The operators look like `[operator[operand]]`, where `operator` is one of:
* ''title'': selects the tiddler with the title given in the operand
* ''is'': tests whether a tiddler is a member of the system defined set named in the operand (see below)
* ''has'': tests whether a tiddler has a specified field
* ''tag'': tests whether a given tag is (`[tag[mytag]]`) or is not (`[!tag[mytag]]`) present on the tiddler
* ''<field>'': tests whether a tiddler field has a specified value (`[modifier[Jeremy]]`) or not (`[!modifier[Jeremy]]`)

An operator can be negated with by preceding it with `!`, for example `[!tag[Tommy]]` selects the tiddlers that are not tagged with `Tommy`.

The operator defaults to `title` if omitted, so `[[HelloThere]]` is equivalent to `[title[HelloThere]]`. If there are no spaces in the title, then the double square brackets can also be omitted: `HelloThere`.

The operands available with the `is` operator are:
* ''tiddler'': selects all ordinary (non-shadow) tiddlers

Operators are combined into logically ANDed expressions by bashing them together and merging the square brackets:
{{{
[tag[one]] [tag[two]] ---> [tag[one]tag[two]]
}}}

Operations can be preceded with `-` to negate their action, removing the selected tiddlers from the results. For example, `[tag[Tommy]] -HelloThere -[[Another One]]` selects all tiddlers tagged with `Tommy` except those titled `HelloThere` or `Another One`.

Operations can be preceded with `+` in order to make them apply to all of the current results, rather than the original source. For example, `[tag[Jeremy]] [tag[Tommy]] +[sort[title]]` selects the tiddlers tagged `Tommy` or `Jeremy`, and sorts them by the `title` field.

Filters are processed with the following elements:
* a string of filter operations, each made up of one or more filter operators
* the incoming source tiddlers
* the overall result stack
* the subresult stack of the tiddlers selected by the current operation

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
Compiling a filter gives a JavaScript function that is invoked as `filter(source)`, where `source` is a hashmap of source tiddler titles (the values don't matter, so it is possible to use a store or a changes object). It returns an array of tiddler titles that satisfy the filter
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
				operatorInfo = this.operators["field"];
			}
			output.push(operatorInfo[type](operator));
			type = "filter";
		}
		output.push(operationInfo.epilogue);
	}
	output.push(this.filterFragments.epilogue);
	try {
		/*jslint evil: true */
		fn = eval(output.join(""));
	} catch(ex) {
		throw "Error in filter expression: " + ex;
	}
	return fn;
};

exports.filterFragments = {
	prologue: "(function(source) {\nvar results = [], subResults;\n",
	epilogue: "return results;\n})",
	operation: {
		prefix: {
			"": {
				prologue: "subResults = [];\n",
				epilogue: "$tw.utils.pushTop(results,subResults);\n"
			},
			"+": {
				prologue: "subResults = results.slice(0);\nresults.splice(0,results.length);\n",
				epilogue: "$tw.utils.pushTop(results,subResults);\n"
			},
			"-": {
				prologue: "subResults = [];\n",
				epilogue: "$tw.utils.removeArrayEntries(results,subResults);\n"
			}
		}
	}
};

exports.operators = {
	"title": {
		selector: function(operator) {
			return "if($tw.utils.hop(source,\"" + $tw.utils.stringify(operator.operand) + "\")) {$tw.utils.pushTop(subResults,\"" + $tw.utils.stringify(operator.operand) + "\");}\n";
		},
		filter: function(operator) {
			return "if(subResults.indexOf(\"" + $tw.utils.stringify(operator.operand) + "\") !== -1) {subResults = [\"" + $tw.utils.stringify(operator.operand) + "\"];} else {subResults = [];}\n";
		}
	},
	"is": {
		selector: function(operator) {
			switch(operator.operand) {
				case "tiddler":
					if(operator.prefix === "!") {
						return "subResults = [];";
					} else {
						return "for(var title in source) {$tw.utils.pushTop(subResults,title);}";
					}
					break;
				default:
					throw "Unknown operand for 'is' filter operator";
			}
		},
		filter: function(operator) {
			switch(operator.operand) {
				case "tiddler":
					if(operator.prefix === "!") {
						return "subResults = [];";
					} else {
						return "";
					}
					break;
				default:
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
