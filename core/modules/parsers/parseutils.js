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
	let p = pos; let c;
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
		};
	}
};

/*
Convenience wrapper for parseWhiteSpace. Returns the position after the whitespace
*/
exports.skipWhiteSpace = function(source,pos) {
	let c;
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
	const match = source.indexOf(token,pos) === pos;
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
	const node = {
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
	const node = {
		type: "string",
		start: pos
	};
	const reString = /(?:"""([\s\S]*?)"""|"([^"]*)")|(?:'([^']*)')/g;
	reString.lastIndex = pos;
	const match = reString.exec(source);
	if(match && match.index === pos) {
		node.value = match[1] !== undefined ? match[1] : (
			match[2] !== undefined ? match[2] : match[3]
		);
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
		const parenMatch = /^\s*\((.*)\)\s*$/g.exec(paramString);
		if(!parenMatch) {
			return [];
		}
		paramString = parenMatch[1];
	}
	const params = [];
	const reParam = /\s*([^:),\s]+)(?:\s*:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|([^,"'\s]+)))?/mg;
	let paramMatch = reParam.exec(paramString);
	while(paramMatch) {
		// Save the parameter details
		const paramInfo = {name: paramMatch[1]};
		const defaultValue = paramMatch[2] || paramMatch[3] || paramMatch[4] || paramMatch[5];
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
	let parameter = $tw.utils.parseMacroParameter(source,pos);
	while(parameter) {
		node.params.push(parameter);
		pos = parameter.end;
		// Get the next parameter
		parameter = $tw.utils.parseMacroParameter(source,pos);
	}
	node.end = pos;
	return node;
};

/*
Look for a macro invocation parameter. Returns null if not found, or {type: "macro-parameter", name:, value:, start:, end:}
*/
exports.parseMacroParameter = function(source,pos) {
	const node = {
		type: "macro-parameter",
		start: pos
	};
	// Define our regexp
	const reMacroParameter = /(?:([A-Za-z0-9\-_]+)\s*:)?(?:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|((?:(?:>(?!>))|[^\s>"'])+)))/g;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for the parameter
	const token = $tw.utils.parseTokenRegExp(source,pos,reMacroParameter);
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
	const node = $tw.utils.parseMacroInvocation(source,pos);
	if(node) {
		let positionalName = 0;
		const transclusion = {
			type: "transclude",
			start: node.start,
			end: node.end
		};
		$tw.utils.addAttributeToParseTreeNode(transclusion,"$variable",node.name);
		$tw.utils.each(node.params,(param) => {
			let {name} = param;
			if(name) {
				if(name.charAt(0) === "$") {
					name = `$${name}`;
				}
				$tw.utils.addAttributeToParseTreeNode(transclusion,{name,type: "string",value: param.value,start: param.start,end: param.end});
			} else {
				$tw.utils.addAttributeToParseTreeNode(transclusion,{name: `${positionalName++}`,type: "string",value: param.value,start: param.start,end: param.end});
			}
		});
		return transclusion;
	}
	return node;
};

/*
Look for a macro invocation. Returns null if not found, or {type: "macrocall", name:, params:, start:, end:}
*/
exports.parseMacroInvocation = function(source,pos) {
	let node = {
		type: "macrocall",
		start: pos,
		params: []
	};
	// Define our regexps
	const reMacroName = /([^\s>"'=]+)/g;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for a double less than sign
	let token = $tw.utils.parseTokenString(source,pos,"<<");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Get the macro name
	const name = $tw.utils.parseTokenRegExp(source,pos,reMacroName);
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
	let node = {
		name: "",
		params: [],
	};
	let pos = 0;
	const reName = /([^\s"']+)/g;
	// If there is no whitespace or it is an empty string then there are no macro parameters
	if(/^\S*$/.test(source)) {
		node.name = source;
		return node;
	}
	// Get the variable name
	const nameMatch = $tw.utils.parseTokenRegExp(source,pos,reName);
	if(nameMatch) {
		node.name = nameMatch.match[1];
		pos = nameMatch.end;
		node = $tw.utils.parseMacroParameters(node,source,pos);
		delete node.end;
	}
	return node;
};

/*
Look for an HTML attribute definition. Returns null if not found, otherwise returns {type: "attribute", name:, type: "filtered|string|indirect|macro", value|filter|textReference:, start:, end:,}
*/
exports.parseAttribute = function(source,pos) {
	const node = {
		start: pos
	};
	// Define our regexps
	const reAttributeName = /([^\/\s>"'`=]+)/g;
	const reUnquotedAttribute = /([^\/\s<>"'`=]+)/g;
	const reFilteredValue = /\{\{\{([\S\s]+?)\}\}\}/g;
	const reIndirectValue = /\{\{([^\}]+)\}\}/g;
	const reSubstitutedValue = /(?:```([\s\S]*?)```|`([^`]|[\S\s]*?)`)/g;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Get the attribute name
	const name = $tw.utils.parseTokenRegExp(source,pos,reAttributeName);
	if(!name) {
		return null;
	}
	node.name = name.match[1];
	pos = name.end;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for an equals sign
	const token = $tw.utils.parseTokenString(source,pos,"=");
	if(token) {
		pos = token.end;
		// Skip whitespace
		pos = $tw.utils.skipWhiteSpace(source,pos);
		// Look for a string literal
		const stringLiteral = $tw.utils.parseStringLiteral(source,pos);
		if(stringLiteral) {
			pos = stringLiteral.end;
			node.type = "string";
			node.value = stringLiteral.value;
		} else {
			// Look for a filtered value
			const filteredValue = $tw.utils.parseTokenRegExp(source,pos,reFilteredValue);
			if(filteredValue) {
				pos = filteredValue.end;
				node.type = "filtered";
				node.filter = filteredValue.match[1];
			} else {
				// Look for an indirect value
				const indirectValue = $tw.utils.parseTokenRegExp(source,pos,reIndirectValue);
				if(indirectValue) {
					pos = indirectValue.end;
					node.type = "indirect";
					node.textReference = indirectValue.match[1];
				} else {
					// Look for a unquoted value
					const unquotedValue = $tw.utils.parseTokenRegExp(source,pos,reUnquotedAttribute);
					if(unquotedValue) {
						pos = unquotedValue.end;
						node.type = "string";
						node.value = unquotedValue.match[1];
					} else {
						// Look for a macro invocation value
						const macroInvocation = $tw.utils.parseMacroInvocation(source,pos);
						if(macroInvocation) {
							pos = macroInvocation.end;
							node.type = "macro";
							node.value = macroInvocation;
						} else {
							const substitutedValue = $tw.utils.parseTokenRegExp(source,pos,reSubstitutedValue);
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
		node.type = "string";
		node.value = "true";
	}
	// Update the end position
	node.end = pos;
	return node;
};
