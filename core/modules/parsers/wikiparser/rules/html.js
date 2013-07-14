/*\
title: $:/core/modules/parsers/wikiparser/rules/html.js
type: application/javascript
module-type: wikirule

Wiki rule for HTML elements and widgets. For example:

{{{
<aside>
This is an HTML5 aside element
</aside>

<$slider target="MyTiddler">
This is a widget invocation
</$slider>

}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "html";
exports.types = {inline: true, block: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	// Find the next tag
	this.nextTag = this.findNextTag(this.parser.source,startPos,{
		requireLineBreak: this.is.block
	});
	return this.nextTag ? this.nextTag.start : undefined;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Retrieve the most recent match so that recursive calls don't overwrite it
	var tag = this.nextTag;
	this.nextTag = null;
	// Advance the parser position to past the tag
	this.parser.pos = tag.end;
	// Check for a following linebreak
	var hasLineBreak = !tag.isSelfClosing && !!this.parseTokenRegExp(this.parser.source,this.parser.pos,/(\r?\n)/g);
	// Set whether we're in block mode
	tag.isBlock = this.is.block || hasLineBreak;
	// Parse the body if we need to
	if(!tag.isSelfClosing && $tw.config.htmlVoidElements.indexOf(tag.tag) === -1) {
			var reEndString = "</" + $tw.utils.escapeRegExp(tag.tag) + ">",
				reEnd = new RegExp("(" + reEndString + ")","mg");
		if(hasLineBreak) {
			tag.children = this.parser.parseBlocks(reEndString);
		} else {
			tag.children = this.parser.parseInlineRun(reEnd);
		}
		reEnd.lastIndex = this.parser.pos;
		var endMatch = reEnd.exec(this.parser.source);
		if(endMatch && endMatch.index === this.parser.pos) {
			this.parser.pos = endMatch.index + endMatch[0].length;
		}
	}
	// Return the tag
	return [tag];
};

/*
Look for a whitespace token. Returns null if not found, otherwise returns {type: "whitespace", start:, end:,}
*/
exports.parseWhiteSpace = function(source,pos) {
	var node = {
		type: "whitespace",
		start: pos
	};
	var re = /(\s)+/g;
	re.lastIndex = pos;
	var match = re.exec(source);
	if(match && match.index === pos) {
		node.end = pos + match[0].length;
		return node;
	}
	return null;
};

/*
Convenience wrapper for parseWhiteSpace
*/
exports.skipWhiteSpace = function(source,pos) {
	var whitespace = this.parseWhiteSpace(source,pos);
	if(whitespace) {
		return whitespace.end;
	}
	return pos;
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
	var reString = /(?:"([^"]*)")|(?:'([^']*)')/g;
	reString.lastIndex = pos;
	var match = reString.exec(source);
	if(match && match.index === pos) {
		node.value = match[1] === undefined ? match[2] : match[1];
		node.end = pos + match[0].length;
		return node;
	} else {
		return null;
	}
};

/*
Look for a macro invocation parameter. Returns null if not found, or {type: "macro-parameter", name:, value:, start:, end:}
*/
exports.parseMacroParameter = function(source,pos) {
	var node = {
		type: "macro-parameter",
		start: pos
	};
	// Define our regexp
	var reMacroParameter = /(?:([A-Za-z0-9\-_]+)\s*:)?(?:\s*(?:"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^\s>"'=]+)))/g;
	// Skip whitespace
	pos = this.skipWhiteSpace(source,pos);
	// Look for the parameter
	var token = this.parseTokenRegExp(source,pos,reMacroParameter);
	if(!token) {
		return null;
	}
	pos = token.end;
	// Get the parameter details
	node.value = token.match[2] !== undefined ? token.match[2] : (
					token.match[3] !== undefined ? token.match[3] : (
						token.match[4] !== undefined ? token.match[4] : (
							token.match[5] !== undefined ? token.match[5] : (
								""
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
	pos = this.skipWhiteSpace(source,pos);
	// Look for a double less than sign
	var token = this.parseTokenString(source,pos,"<<");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Get the macro name
	var name = this.parseTokenRegExp(source,pos,reMacroName);
	if(!name) {
		return null;
	}
	node.name = name.match[1];
	pos = name.end;
	// Process parameters
	var parameter = this.parseMacroParameter(source,pos);
	while(parameter) {
		node.params.push(parameter);
		pos = parameter.end;
		// Get the next parameter
		parameter = this.parseMacroParameter(source,pos);
	}
	// Skip whitespace
	pos = this.skipWhiteSpace(source,pos);
	// Look for a double greater than sign
	token = this.parseTokenString(source,pos,">>");
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
exports.parseAttribute = function(source,pos) {
	var node = {
		start: pos
	};
	// Define our regexps
	var reAttributeName = /([^\/\s>"'=]+)/g,
		reUnquotedAttribute = /([^\/\s<>"'=]+)/g,
		reIndirectValue = /\{\{([^\}]+)\}\}/g;
	// Skip whitespace
	pos = this.skipWhiteSpace(source,pos);
	// Get the attribute name
	var name = this.parseTokenRegExp(source,pos,reAttributeName);
	if(!name) {
		return null;
	}
	node.name = name.match[1];
	pos = name.end;
	// Skip whitespace
	pos = this.skipWhiteSpace(source,pos);
	// Look for an equals sign
	var token = this.parseTokenString(source,pos,"=");
	if(token) {
		pos = token.end;
		// Skip whitespace
		pos = this.skipWhiteSpace(source,pos);
		// Look for a string literal
		var stringLiteral = this.parseStringLiteral(source,pos);
		if(stringLiteral) {
			pos = stringLiteral.end;
			node.type = "string";
			node.value = stringLiteral.value;
		} else {
			// Look for an indirect value
			var indirectValue = this.parseTokenRegExp(source,pos,reIndirectValue);
			if(indirectValue) {
				pos = indirectValue.end;
				node.type = "indirect";
				node.textReference = indirectValue.match[1];
			} else {
				// Look for a unquoted value
				var unquotedValue = this.parseTokenRegExp(source,pos,reUnquotedAttribute);
				if(unquotedValue) {
					pos = unquotedValue.end;
					node.type = "string";
					node.value = unquotedValue.match[1];
				} else {
					// Look for a macro invocation value
					var macroInvocation = this.parseMacroInvocation(source,pos);
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
	} else {
		node.type = "string";
		node.value = "true";
	}
	// Update the end position
	node.end = pos;
	return node;
};

/*
Look for an HTML tag. Returns null if not found, otherwise returns {type: "tag", name:, attributes: [], isSelfClosing:, start:, end:,}
*/
exports.parseTag = function(source,pos,options) {
	options = options || {};
	var token,
		node = {
			type: "element",
			start: pos,
			attributes: {}
		};
	// Define our regexps
	var reTagName = /([a-zA-Z0-9\-\$]+)/g;
	// Skip whitespace
	pos = this.skipWhiteSpace(source,pos);
	// Look for a less than sign
	token = this.parseTokenString(source,pos,"<");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Get the tag name
	token = this.parseTokenRegExp(source,pos,reTagName);
	if(!token) {
		return null;
	}
	node.tag = token.match[1];
	pos = token.end;
	// Process attributes
	var attribute = this.parseAttribute(source,pos);
	while(attribute) {
		node.attributes[attribute.name] = attribute;
		pos = attribute.end;
		// Get the next attribute
		attribute = this.parseAttribute(source,pos);
	}
	// Skip whitespace
	pos = this.skipWhiteSpace(source,pos);
	// Look for a closing slash
	token = this.parseTokenString(source,pos,"/");
	if(token) {
		pos = token.end;
		node.isSelfClosing = true;
	}
	// Look for a greater than sign
	token = this.parseTokenString(source,pos,">");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Check for a required line break
	if(options.requireLineBreak) {
		token = this.parseTokenRegExp(source,pos,/(\r?\n)/g);
		if(!token) {
			return null;
		}
	}
	// Update the end position
	node.end = pos;
	return node;
};

exports.findNextTag = function(source,pos,options) {
	// A regexp for finding candidate HTML tags
	var reLookahead = /<([a-zA-Z\-\$]+)/g;
	// Find the next candidate
	reLookahead.lastIndex = pos;
	var match = reLookahead.exec(source);
	while(match) {
		// Try to parse the candidate as a tag
		var tag = this.parseTag(source,match.index,options);
		// Return success
		if(tag) {
			return tag;
		}
		// Look for the next match
		reLookahead.lastIndex = match.index + 1;
		match = reLookahead.exec(source);
	}
	// Failed
	return null;
};

})();
