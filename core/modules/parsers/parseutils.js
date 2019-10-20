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
exports.parseStringLiteral = (function() {
	// define the regex outside of the function.
	var stringRegex = /([snd]{1,2})?(?:(?:"""([\s\S]*?)"""|"([^"]*)")|(?:'([^']*)'))/g;
	return function (source,pos) {
		stringRegex.lastIndex = pos;
		var match = stringRegex.exec(source);
		if(match && match.index === pos) {
			var stringContents = match[2] !== undefined ? match[2]
				: match[3] !== undefined ? match[3]
					: match[4];
			var modifiers = match[1];
			if (stringContents && modifiers) {
				stringContents = $tw.utils.modifyStringLiteral(stringContents, modifiers);
			}
			return {
				type: "string",
				value : stringContents,
				start: pos,
				end : pos + match[0].length
			};
		}
		return null;
	};
})();

/*
Look for a macro invocation parameter. Returns null if not found, or {type: "macro-parameter", name:, value:, start:, end:}
*/
exports.parseMacroParameter = function(source,pos) {
	var node = {
		type: "macro-parameter",
		start: pos
	};
	// Define our regexp
	var reMacroParameter = /(?:([A-Za-z0-9\-_]+)\s*:)?(?:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^\s>"'=]+)))/g;
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
	// Process parameters
	var parameter = $tw.utils.parseMacroParameter(source,pos);
	while(parameter) {
		node.params.push(parameter);
		pos = parameter.end;
		// Get the next parameter
		parameter = $tw.utils.parseMacroParameter(source,pos);
	}
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

/*
Look for an HTML attribute definition. Returns null if not found, otherwise returns {type: "attribute", name:, valueType: "string|indirect|macro", value:, start:, end:,}
*/
exports.parseAttribute = (function() {
	// define the regexes outside of the function.
	var reAttributeName = /([^\/\s>"'=]+)/g;		// myattribute
	var reUnquotedAttribute = /([^\/\s<>"'=]+)/g;	// myattributevalue
	var reFilteredValue = /\{\{\{(.+?)\}\}\}/g;		// {{{filter expression}}}
	var reIndirectValue = /\{\{([^\}]+)\}\}/g;		// {{transclude}}
	return function(source,pos){
		// make these locally available, for performance
		var utils = $tw.utils;
		var skipWhitespace = utils.skipWhiteSpace;
		var parseTokenRegExp = utils.parseTokenRegExp;
		// remember the start position
		var start = pos;
		// Skip whitespace
		pos = skipWhitespace(source,pos);
		// Get the attribute name
		var name = parseTokenRegExp(source,pos,reAttributeName);
		if(!name) {
			return null;
		}
		pos = name.end;
		name = name.match[1];
		// Skip whitespace
		pos = skipWhitespace(source,pos);
		// Look for an equals sign
		var token = utils.parseTokenString(source,pos,"=");
		// fill these node attributes depending on the type of the attribute value
		var typ = "string";
		var value = "true";
		var filter;
		var reference;
		if(token) {
			pos = token.end;
			// Skip whitespace
			pos = skipWhitespace(source,pos);
			// Look for a string literal
			if(token = utils.parseStringLiteral(source,pos)) {
				pos = token.end;
				value = token.value;
			}
			// Look for a filtered value
			else if(token = parseTokenRegExp(source,pos,reFilteredValue)) {
				pos = token.end;
				typ = "filtered";
				filter = token.match[1];
			}
			// Look for an indirect value
			else if(token = parseTokenRegExp(source,pos,reIndirectValue)) {
				pos = token.end;
				typ = "indirect";
				reference = token.match[1];
			}
			// Look for a unquoted value
			else if(token = parseTokenRegExp(source,pos,reUnquotedAttribute)) {
				pos = token.end;
				value = token.match[1];
			}
			// Look for a macro invocation value
			else if(token = utils.parseMacroInvocation(source,pos)) {
				pos = token.end;
				typ = "macro";
				value = token;
			}
		}
		// Construct the node and return it
		var node = {
			name: name,
			type: typ,
			start: start,
			end: pos
		};
		if (filter !== undefined) {
			node.filter = filter;
		} else if (reference !== undefined) {
			node.textReference = reference;
		} else {
			node.value = value;
		}
		return node;
	}
})();

})();
