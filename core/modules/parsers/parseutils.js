/*\
title: $:/core/modules/utils/parseutils.js
type: application/javascript
module-type: utils

Utility functions concerned with parsing text into tokens.

Most functions have the following pattern:

* The parameters are:
** `source`: the source string being parsed
** `pos`: the current parse position within the string
** Any further parameters are used to identify the token that is being parsed
* The return value is:
** null if the token was not found at the specified position
** an object representing the token with the following standard fields:
*** `type`: string indicating the type of the token
*** `start`: start position of the token in the source string
*** `end`: end position of the token in the source string
*** Any further fields required to describe the token

The exception is `skipWhiteSpace`, which just returns the position after the whitespace.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Look for a whitespace token. Returns null if not found, otherwise returns {type: "whitespace", start:, end:,}
*/
exports.parseWhiteSpace = function(source,pos) {
	var p = pos,c;
	while(true) {
		c = source.charAt(p);
		if((c === " ") || (c === "\f") || (c === "\n") || (c === "\r") || (c === "\t") || (c === "\v") || (c === "\u00a0")) { // Ignores some obscure unicode spaces
			p++;
		} else {
			break;
		}
	}
	if(p === pos) {
		return null;
	} else {
		return {
			type: "whitespace",
			start: pos,
			end: p
		}
	}
};

/*
Convenience wrapper for parseWhiteSpace. Returns the position after the whitespace
*/
exports.skipWhiteSpace = function(source,pos) {
	var c;
	while(true) {
		c = source.charAt(pos);
		if((c === " ") || (c === "\f") || (c === "\n") || (c === "\r") || (c === "\t") || (c === "\v") || (c === "\u00a0")) { // Ignores some obscure unicode spaces
			pos++;
		} else {
			return pos;
		}
	}
};

/*
Look for a given string token. Returns null if not found, otherwise returns {type: "token", value:, start:, end:,}
*/
exports.parseTokenString = function(source,pos,token) {
	var match = source.indexOf(token,pos) === pos;
	if(match) {
		return {
			type: "token",
			value: token,
			start: pos,
			end: pos + token.length
		};
	}
	return null;
};

/*
Look for a token matching a regex. Returns null if not found, otherwise returns {type: "regexp", match:, start:, end:,}
*/
exports.parseTokenRegExp = function(source,pos,reToken) {
	var node = {
		type: "regexp",
		start: pos
	};
	reToken.lastIndex = pos;
	node.match = reToken.exec(source);
	if(node.match && node.match.index === pos) {
		node.end = pos + node.match[0].length;
		return node;
	} else {
		return null;
	}
};

/*
Look for a string literal. Returns null if not found, otherwise returns {type: "string", value:, start:, end:,}
*/
exports.parseStringLiteral = function(source,pos) {
	var node = {
		type: "string",
		start: pos
	};
	var reString = /(?:"""([\s\S]*?)"""|"([^"]*)")|(?:'([^']*)')/g;
	reString.lastIndex = pos;
	var match = reString.exec(source);
	if(match && match.index === pos) {
		node.value = match[1] !== undefined ? match[1] :(
			match[2] !== undefined ? match[2] : match[3] 
					);
		node.end = pos + match[0].length;
		return node;
	} else {
		return null;
	}
};

exports.parseMacroParameters = function(node,source,pos) {
	// Process parameters
	var parameter = $tw.utils.parseMacroParameter(source,pos);
	while(parameter) {
		node.params.push(parameter);
		pos = parameter.end;
		// Get the next parameter
		parameter = $tw.utils.parseMacroParameter(source,pos);
	}
	node.end = pos;
	return node;
}

/*
Look for a macro invocation parameter. Returns null if not found, or {type: "macro-parameter", name:, value:, start:, end:}
*/
exports.parseMacroParameter = function(source,pos) {
	var node = {
		type: "macro-parameter",
		start: pos
	};
	// Define our regexp
	var reMacroParameter = /(?:([A-Za-z0-9\-_]+)\s*:)?(?:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|((?:(?:>(?!>))|[^\s>"'])+)))/g;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for the parameter
	var token = $tw.utils.parseTokenRegExp(source,pos,reMacroParameter);
	if(!token) {
		return null;
	}
	pos = token.end;
	// Get the parameter details
	node.value = token.match[2] !== undefined ? token.match[2] : (
					token.match[3] !== undefined ? token.match[3] : (
						token.match[4] !== undefined ? token.match[4] : (
							token.match[5] !== undefined ? token.match[5] : (
								token.match[6] !== undefined ? token.match[6] : (
									""
								)
							)
						)
					)
				);
	if(token.match[1]) {
		node.name = token.match[1];
	}
	// Update the end position
	node.end = pos;
	return node;
};

/*
Look for a macro invocation. Returns null if not found, or {type: "macrocall", name:, parameters:, start:, end:}
*/
exports.parseMacroInvocation = function(source,pos) {
	var node = {
		type: "macrocall",
		start: pos,
		params: []
	};
	// Define our regexps
	var reMacroName = /([^\s>"'=]+)/g;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for a double less than sign
	var token = $tw.utils.parseTokenString(source,pos,"<<");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Get the macro name
	var name = $tw.utils.parseTokenRegExp(source,pos,reMacroName);
	if(!name) {
		return null;
	}
	node.name = name.match[1];
	pos = name.end;
	node = $tw.utils.parseMacroParameters(node,source,pos);
	pos = node.end;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for a double greater than sign
	token = $tw.utils.parseTokenString(source,pos,">>");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Update the end position
	node.end = pos;
	return node;
};

exports.parseFilterVariable = function(source) {
	var node = {
			name: "",
			params: [],
		},
		pos = 0,
		reName = /([^\s"']+)/g;
	// If there is no whitespace or it is an empty string then there are no macro parameters
	if(/^\S*$/.test(source)) {
		node.name = source;
		return node;
	}
	// Get the variable name
	var nameMatch = $tw.utils.parseTokenRegExp(source,pos,reName);
	if(nameMatch) {
		node.name = nameMatch.match[1];
		pos = nameMatch.end;
		node = $tw.utils.parseMacroParameters(node,source,pos);
		delete node.end;
	}
	return node;
};

/*
Look for an HTML attribute definition. Returns null if not found, otherwise returns {type: "attribute", name:, valueType: "string|indirect|macro", value:, start:, end:,}
*/
exports.parseAttribute = function(source,pos) {
	var node = {
		start: pos
	};
	// Define our regexps
	var reAttributeName = /([^\/\s>"'=]+)/g,
		reUnquotedAttribute = /([^\/\s<>"'=]+)/g,
		reFilteredValue = /\{\{\{(.+?)\}\}\}/g,
		reIndirectValue = /\{\{([^\}]+)\}\}/g;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Get the attribute name
	var name = $tw.utils.parseTokenRegExp(source,pos,reAttributeName);
	if(!name) {
		return null;
	}
	node.name = name.match[1];
	pos = name.end;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for an equals sign
	var token = $tw.utils.parseTokenString(source,pos,"=");
	if(token) {
		pos = token.end;
		// Skip whitespace
		pos = $tw.utils.skipWhiteSpace(source,pos);
		// Look for a string literal
		var stringLiteral = $tw.utils.parseStringLiteral(source,pos);
		if(stringLiteral) {
			pos = stringLiteral.end;
			node.type = "string";
			node.value = stringLiteral.value;
		} else {
			// Look for a filtered value
			var filteredValue = $tw.utils.parseTokenRegExp(source,pos,reFilteredValue);
			if(filteredValue) {
				pos = filteredValue.end;
				node.type = "filtered";
				node.filter = filteredValue.match[1];
			} else {
				// Look for an indirect value
				var indirectValue = $tw.utils.parseTokenRegExp(source,pos,reIndirectValue);
				if(indirectValue) {
					pos = indirectValue.end;
					node.type = "indirect";
					node.textReference = indirectValue.match[1];
				} else {
					// Look for a unquoted value
					var unquotedValue = $tw.utils.parseTokenRegExp(source,pos,reUnquotedAttribute);
					if(unquotedValue) {
						pos = unquotedValue.end;
						node.type = "string";
						node.value = unquotedValue.match[1];
					} else {
						// Look for a macro invocation value
						var macroInvocation = $tw.utils.parseMacroInvocation(source,pos);
						if(macroInvocation) {
							pos = macroInvocation.end;
							node.type = "macro";
							node.value = macroInvocation;
						} else {
							node.type = "string";
							node.value = "true";
						}
					}
				}
			}
		}
	} else {
		node.type = "string";
		node.value = "true";
	}
	// Update the end position
	node.end = pos;
	return node;
};

})();
