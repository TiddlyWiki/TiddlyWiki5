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
	var reString = /(?:"""([\s\S]*?)"""|"([^"]*)")|(?:'([^']*)')|\[\[([^\]]*)\]\]/g;
	reString.lastIndex = pos;
	var match = reString.exec(source);
	if(match && match.index === pos) {
		node.value = match[1] !== undefined ? match[1] :(
			match[2] !== undefined ? match[2] : (
				match[3] !== undefined ? match[3] : match[4]
					));
		node.end = pos + match[0].length;
		return node;
	} else {
		return null;
	}
};

/*
Returns an array of {name:} with an optional "default" property. Options include:
requireParenthesis: require the parameter definition to be wrapped in parenthesis
*/
exports.parseParameterDefinition = function(paramString,options) {
	options = options || {};
	if(options.requireParenthesis) {
		var parenMatch = /^\s*\((.*)\)\s*$/g.exec(paramString);
		if(!parenMatch) {
			return [];
		}
		paramString = parenMatch[1];
	}
	var params = [],
		reParam = /\s*([^:),\s]+)(?:\s*:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|([^,"'\s]+)))?/mg,
		paramMatch = reParam.exec(paramString);
	while(paramMatch) {
		// Save the parameter details
		var paramInfo = {name: paramMatch[1]},
			defaultValue = paramMatch[2] || paramMatch[3] || paramMatch[4] || paramMatch[5];
		if(defaultValue !== undefined) {
			paramInfo["default"] = defaultValue;
		}
		params.push(paramInfo);
		// Look for the next parameter
		paramMatch = reParam.exec(paramString);
	}
	return params;
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
Look for a macro invocation. Returns null if not found, or {type: "transclude", attributes:, start:, end:}
*/
exports.parseMacroInvocationAsTransclusion = function(source,pos) {
// console.log("parseMacroInvocationAsTransclusion",source,pos);
	var node = {
			type: "transclude",
			start: pos,
			attributes: {},
			orderedAttributes: []
		};
	// Define our regexps
	var reVarName = /([^\s>"'=:]+)/g;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for a double opening angle bracket
	var token = $tw.utils.parseTokenString(source,pos,"<<");
	if(!token) {
// console.log("No opening << in",source,"at",pos);
		return null;
	}
	pos = token.end;
	// Get the variable name for the macro
	token = $tw.utils.parseTokenRegExp(source,pos,reVarName);
	if(!token) {
// console.log("No macro name");
		return null;
	}
	$tw.utils.addAttributeToParseTreeNode(node,"$variable",token.match[1]);
	pos = token.end;
	// Check that the tag is terminated by a space or >>
	if(!$tw.utils.parseWhiteSpace(source,pos) && !(source.charAt(pos) === ">" && source.charAt(pos + 1) === ">") ) {
// console.log("No space or >> after macro name");
		return null;
	}
	// Process attributes
	pos = $tw.utils.parseMacroParametersAsAttributes(node,source,pos);
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for a double closing angle bracket
	token = $tw.utils.parseTokenString(source,pos,">>");
	if(!token) {
// console.log("No closing >>");
		return null;
	}
	node.end = token.end;
	return node;
};

/*
Parse macro parameters as attributes. Returns the position after the last attribute
*/
exports.parseMacroParametersAsAttributes = function(node,source,pos) {
	var position = 0,
		attribute = $tw.utils.parseMacroParameterAsAttribute(source,pos);
	while(attribute) {
		if(!attribute.name) {
			attribute.name = (position++) + "";
			attribute.isPositional = true;
		}
		node.orderedAttributes.push(attribute);
		node.attributes[attribute.name] = attribute;
		pos = attribute.end;
		// Get the next attribute
		attribute = $tw.utils.parseMacroParameterAsAttribute(source,pos);
	}
	node.end = pos;
	return pos;
}

/*
Parse a macro parameter as an attribute. Returns null if not found, otherwise returns {name:, type: "filtered|string|indirect|macro", value|filter|textReference:, start:, end:,}, with the name being optional
*/
exports.parseMacroParameterAsAttribute = function(source,pos) {
	var node = {
		start: pos
	};
	// Define our regexps
	var reAttributeName = /([^\/\s>"'`=:]+)/g,
		reUnquotedAttribute = /((?:(?:>(?!>))|[^\s>"'])+)/g,
		reFilteredValue = /\{\{\{([\S\s]+?)\}\}\}/g,
		reIndirectValue = /\{\{([^\}]+)\}\}/g,
		reSubstitutedValue = /(?:```([\s\S]*?)```|`([^`]|[\S\s]*?)`)/g;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Get the attribute name and the separator token
	var nameToken = $tw.utils.parseTokenRegExp(source,pos,reAttributeName),
		namePos = nameToken && $tw.utils.skipWhiteSpace(source,nameToken.end),
		separatorToken = nameToken && $tw.utils.parseTokenRegExp(source,namePos,/=|:/g);
// console.log(`parseMacroParametersAtAttribute source is ${source} at ${pos} and namepos is ${namePos} with nameToken as ${JSON.stringify(nameToken)} and separatorToken as ${JSON.stringify(separatorToken)}`);
	// If we have a name and a separator then we have a named attribute
	if(nameToken && separatorToken) {
		node.name = nameToken.match[1];
		pos = separatorToken.end;
	}
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for a string literal
	var stringLiteral = $tw.utils.parseStringLiteral(source,pos);
	if(stringLiteral) {
		pos = stringLiteral.end;
		node.type = "string";
		node.value = stringLiteral.value;
	} else {
// console.log(`Failed to parse string literal ${source} at ${pos} with node as ${JSON.stringify(node)}`);
		// Look for a filtered value
		var filteredValue = $tw.utils.parseTokenRegExp(source,pos,reFilteredValue);
		if(filteredValue) {
			pos = filteredValue.end;
			node.type = "filtered";
			node.filter = filteredValue.match[1];
		} else {
// console.log(`Failed to parse filtered value ${source} at ${pos} with node as ${JSON.stringify(node)}`);
			// Look for an indirect value
			var indirectValue = $tw.utils.parseTokenRegExp(source,pos,reIndirectValue);
			if(indirectValue) {
				pos = indirectValue.end;
				node.type = "indirect";
				node.textReference = indirectValue.match[1];
			} else {
// console.log(`Failed to parse indirect value ${source} at ${pos} with node as ${JSON.stringify(node)}`);
				// Look for a unquoted value
				var unquotedValue = $tw.utils.parseTokenRegExp(source,pos,reUnquotedAttribute);
				if(unquotedValue) {
					pos = unquotedValue.end;
					node.type = "string";
					node.value = unquotedValue.match[1];
// console.log(`Parsed unquoted value ${source} at ${pos} with node as ${JSON.stringify(node)}`);
				} else {
// console.log(`Failed to parse unquoted value ${source} at ${pos} with node as ${JSON.stringify(node)}`);
					// Look for a macro invocation value
					var macroInvocation = $tw.utils.parseMacroInvocationAsTransclusion(source,pos);
					if(macroInvocation) {
						pos = macroInvocation.end;
						node.type = "macro";
						node.value = macroInvocation;
// console.log(`Parsed macro invocation ${source} at ${pos} with node as ${JSON.stringify(node)}`);
					} else {
// console.log(`Failed to parse macro invocation ${source} at ${pos} with node as ${JSON.stringify(node)}`);
						var substitutedValue = $tw.utils.parseTokenRegExp(source,pos,reSubstitutedValue);
						if(substitutedValue) {
							pos = substitutedValue.end;
							node.type = "substituted";
							node.rawValue = substitutedValue.match[1] || substitutedValue.match[2];
						} else {
// console.log(`Failed to parse substituted value ${source} at ${pos} with node as ${JSON.stringify(node)}`);
						}
					}
				}
			}
		}
	}
	// Bail if we don't have a value
	if(!node.type) {
		return null;
	}
	// Update the end position
	node.end = pos;
	return node;
};

/*
Look for a macro invocation. Returns null if not found, or {type: "macrocall", name:, params:, start:, end:}
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
Look for an HTML attribute definition. Returns null if not found, otherwise returns {name:, type: "filtered|string|indirect|macro", value|filter|textReference:, start:, end:,}
*/
exports.parseAttribute = function(source,pos) {
	var node = {
		start: pos
	};
	// Define our regexps
	var reAttributeName = /([^\/\s>"'`=]+)/g,
		reUnquotedAttribute = /([^\/\s<>"'`=]+)/g,
		reFilteredValue = /\{\{\{([\S\s]+?)\}\}\}/g,
		reIndirectValue = /\{\{([^\}]+)\}\}/g,
		reSubstitutedValue = /(?:```([\s\S]*?)```|`([^`]|[\S\s]*?)`)/g;
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
						var macroInvocation = $tw.utils.parseMacroInvocationAsTransclusion(source,pos);
						if(macroInvocation) {
							pos = macroInvocation.end;
							node.type = "macro";
							node.value = macroInvocation;
						} else {
							var substitutedValue = $tw.utils.parseTokenRegExp(source,pos,reSubstitutedValue);
							if(substitutedValue) {
								pos = substitutedValue.end;
								node.type = "substituted";
								node.rawValue = substitutedValue.match[1] || substitutedValue.match[2];
							} else {
								node.type = "string";
								node.value = "true";
							}
						}
					}
				}
			}
		}
	} else {
		// If there is no equals sign or colon, then this is an attribute with no value, defaulting to "true"
		node.type = "string";
		node.value = "true";
	}
	// Update the end position
	node.end = pos;
	return node;
};
