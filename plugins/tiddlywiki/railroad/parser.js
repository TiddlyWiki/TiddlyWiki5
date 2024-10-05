/*\
title: $:/plugins/tiddlywiki/railroad/parser.js
type: application/javascript
module-type: library

Parser for the source of a railroad diagram.

x y z			sequence
<-x y z->		explicit sequence
[:x]			optional, normally included
[x]				optional, normally omitted
{x}				one or more
{x +","}		one or more, comma-separated
[{:x}]			zero or more, normally included
[{:x +","}]		zero or more, comma-separated, normally included
[{x}]			zero or more, normally omitted
[{x +","}]		zero or more, comma-separated, normally omitted
(x|y|z)			alternatives
(x|:y|z)		alternatives, normally y
"x"				terminal
<"x">			nonterminal
/"blah"/		comment
-				dummy
[[x|"tiddler"]]	link
{{"tiddler"}}	transclusion

"x" can also be written 'x' or """x"""

pragmas:
	\arrow yes|no
	\debug yes|no
	\start single|double|none
	\end single|double|none

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var components = require("$:/plugins/tiddlywiki/railroad/components.js").components;

var Parser = function(widget,source,options) {
	this.widget = widget;
	this.source = source;
	this.options = options;
	this.tokens = this.tokenise(source);
	this.tokenPos = 0;
	this.advance();
	this.content = this.parseContent();
	this.root = new components.Root(this.content);
	this.checkFinished();
};

/////////////////////////// Parser dispatch

Parser.prototype.parseContent = function() {
	var content = [];
	// Parse zero or more components
	while(true) {
		var component = this.parseComponent();
		if(!component) {
			break;
		}
		if(!component.isPragma) {
			content.push(component);
		}
	}
	return content;
};

Parser.prototype.parseComponent = function() {
	var component = null;
	if(this.token) {
		if(this.at("string")) {
			component = this.parseTerminal();
		} else if(this.at("name")) {
			component = this.parseName();
		} else if(this.at("pragma")) {
			component = this.parsePragma();
		} else {
			switch(this.token.value) {
				case "[":
					component = this.parseOptional();
					break;
				case "{":
					component = this.parseRepeated();
					break;
				case "<":
					component = this.parseNonterminal();
					break;
				case "(":
					component = this.parseChoice();
					break;
				case "/":
					component = this.parseComment();
					break;
				case "[[":
					component = this.parseLink();
					break;
				case "{{":
					component = this.parseTransclusion();
					break;
				case "<-":
					component = this.parseSequence();
					break;
				case "-":
					component = this.parseDummy();
					break;
			}
		}
	}
	return component;
};

/////////////////////////// Specific components

Parser.prototype.parseChoice = function() {
	// Consume the (
	this.advance();
	var content = [],
		colon = -1;
	do {
		// Allow at most one branch to be prefixed with a colon
		if(colon === -1 && this.eat(":")) {
			colon = content.length;
		}
		// Parse the next branch
		content.push(this.parseContent());
	} while(this.eat("|"));
	// Consume the closing bracket
	this.close(")");
	// Create a component
	return new components.Choice(content,colon === -1 ? 0 : colon);
};

Parser.prototype.parseComment = function() {
	// Consume the /
	this.advance();
	// The comment's content should be in a string literal
	var content = this.expectString("after /");
	// Consume the closing /
	this.close("/");
	// Create a component
	return new components.Comment(content);
};

Parser.prototype.parseDummy = function() {
	// Consume the -
	this.advance();
	// Create a component
	return new components.Dummy();
};

Parser.prototype.parseLink = function() {
	// Consume the [[
	this.advance();
	// Parse the content
	var content = this.parseContent();
	// Consume the |
	this.expect("|");
	// Consume the target
	var target = this.expectNameOrString("as link target");
	// Prepare some attributes for the SVG "a" element to carry
	var options = {"data-tw-target": target};
	if($tw.utils.isLinkExternal(target)) {
		options["data-tw-external"] = true;
	}
	// Consume the closing ]]
	this.close("]]");
	// Create a component
	return new components.Link(content,options);
};

Parser.prototype.parseName = function() {
	// Create a component
	var component = new components.Nonterminal(this.token.value);
	// Consume the name
	this.advance();
	return component;
};

Parser.prototype.parseNonterminal = function() {
	// Consume the <
	this.advance();
	// The nonterminal's name should be in a string literal
	var content = this.expectString("after <");
	// Consume the closing bracket
	this.close(">");
	// Create a component
	return new components.Nonterminal(content);
};

Parser.prototype.parseOptional = function() {
	var wantArrow = this.options.arrow;
	// Consume the [
	this.advance();
	// Consume the { if there is one
	var repeated = this.eat("{");
	// Note whether omission is the normal route
	var normal = this.eat(":");
	// Parse the content
	var content = this.parseContent(),
		separator = null;
	// Parse the separator if there is one
	if(repeated && this.eat("+")) {
		separator = this.parseContent();
	}
	// Consume the closing brackets
	if(repeated) {
		this.close("}");
	}
	this.close("]");
	// Create a component
	return repeated ? new components.OptionalRepeated(content,separator,normal,wantArrow)
		: new components.Optional(content,normal);
};

Parser.prototype.parseRepeated = function() {
	var wantArrow = this.options.arrow;
	// Consume the {
	this.advance();
	// Parse the content
	var content = this.parseContent(),
		separator = null;
	// Parse the separator if there is one
	if(this.eat("+")) {
		separator = this.parseContent();
	}
	// Consume the closing bracket
	this.close("}");
	// Create a component
	return new components.Repeated(content,separator,wantArrow);
};

Parser.prototype.parseSequence = function() {
	// Consume the <-
	this.advance();
	// Parse the content
	var content = this.parseContent();
	// Consume the closing ->
	this.close("->");
	// Create a component
	return new components.Sequence(content);
};

Parser.prototype.parseTerminal = function() {
	var component = new components.Terminal(this.token.value);
	// Consume the string literal
	this.advance();
    return component;
};

Parser.prototype.parseTransclusion = function() {
	// Consume the {{
	this.advance();
	// Consume the text reference
	var textRef = this.expectNameOrString("as transclusion source");
	// Consume the closing }}
	this.close("}}");
	// Retrieve the content of the text reference
	var source = this.widget.wiki.getTextReference(textRef,"",this.widget.getVariable("currentTiddler"));
	// Parse the content
	var content = new Parser(this.widget,source).content;
	// Create a component
	return new components.Transclusion(content);
};

/////////////////////////// Pragmas

Parser.prototype.parsePragma = function() {
	// Create a dummy component
	var component = { isPragma: true };
	// Consume the pragma
	var pragma = this.token.value;
	this.advance();
	// Apply the setting
	if(pragma === "arrow") {
		this.options.arrow = this.parseYesNo(pragma);		
	} else if(pragma === "debug") {
		this.options.debug = true;
	} else if(pragma === "start") {
		this.options.start = this.parseTerminusStyle(pragma);		
	} else if(pragma === "end") {
		this.options.end = this.parseTerminusStyle(pragma);		
	} else {
		throw "Invalid pragma";
	}
	return component;
};

Parser.prototype.parseYesNo = function(pragma) {
	return this.parseSetting(["yes","no"],pragma) === "yes";
}

Parser.prototype.parseTerminusStyle = function(pragma) {
	return this.parseSetting(["single","double","none"],pragma);
}

Parser.prototype.parseSetting = function(options,pragma) {
	if(this.at("name") && options.indexOf(this.token.value) !== -1) {
		return this.tokenValueEaten();		
	}
	throw options.join(" or ") + " expected after \\" + pragma;
}

/////////////////////////// Token manipulation

Parser.prototype.advance = function() {
	if(this.tokenPos >= this.tokens.length) {
		this.token = null;
	}
	this.token = this.tokens[this.tokenPos++];
};

Parser.prototype.at = function(token) {
	return this.token && (this.token.type === token || this.token.type === "token" && this.token.value === token);
};

Parser.prototype.eat = function(token) {
	var at = this.at(token);
	if(at) {
		this.advance();
	}
	return at;
};

Parser.prototype.tokenValueEaten = function() {
	var output = this.token.value;
	this.advance();
	return output;
};

Parser.prototype.close = function(token) {
	if(!this.eat(token)) {
		throw "Closing " + token + " expected";
	}
};

Parser.prototype.checkFinished = function() {
	if(this.token) {
		throw "Syntax error at " + this.token.value;
	}
};

Parser.prototype.expect = function(token) {
	if(!this.eat(token)) {
		throw token + " expected";
	}
};

Parser.prototype.expectString = function(context,token) {
	if(!this.at("string")) {
		token = token || "String";
		throw token + " expected " + context;
	}
	return this.tokenValueEaten();
};

Parser.prototype.expectNameOrString = function(context) {
	if(this.at("name")) {
		return this.tokenValueEaten();
	}
	return this.expectString(context,"Name or string");
};

/////////////////////////// Tokenisation

Parser.prototype.tokenise = function(source) {
	var tokens = [],
		pos = 0,
		c, s, token;
	while(pos < source.length) {
		// Initialise this iteration
		s = token = null;
		// Skip whitespace
		pos = $tw.utils.skipWhiteSpace(source,pos);
		// Avoid falling off the end of the string
		if (pos >= source.length) {
			break;
		}
		// Examine the next character
		c = source.charAt(pos);
		if("\"'".indexOf(c) !== -1) {
			// String literal
			token = $tw.utils.parseStringLiteral(source,pos);
			if(!token) {
				throw "Unterminated string literal";
			}
		} else if("[]{}".indexOf(c) !== -1) {
			// Single or double character
			s = source.charAt(pos+1) === c ? c + c : c;
		} else if(c === "<") {
			// < or <-
			s = source.charAt(pos+1) === "-" ? "<-" : "<";
		} else if(c === "-") {
			// - or ->
			s = source.charAt(pos+1) === ">" ? "->" : "-";
		} else if("()>+/:|".indexOf(c) !== -1) {
			// Single character
			s = c;
		} else if(c.match(/[a-zA-Z]/)) {
			// Name
			token = this.readName(source,pos);
		} else if(c.match(/\\/)) {
			// Pragma
			token = this.readPragma(source,pos);
		} else {
			throw "Syntax error at " + c;
		}
		// Add our findings to the return array
		if(token) {
			tokens.push(token);
		} else {
			token = $tw.utils.parseTokenString(source,pos,s);
			tokens.push(token);
		}
		// Prepare for the next character
		pos = token.end;
	}
	return tokens;
};

Parser.prototype.readName = function(source,pos) {
	var re = /([a-zA-Z0-9_.-]+)/g;
	re.lastIndex = pos;
	var match = re.exec(source);
	if(match && match.index === pos) {
		return {type: "name", value: match[1], start: pos, end: pos+match[1].length};
	} else {
		throw "Invalid name";
	}
};

Parser.prototype.readPragma = function(source,pos) {
	var re = /([a-z]+)/g;
	pos++;
	re.lastIndex = pos;
	var match = re.exec(source);
	if(match && match.index === pos) {
		return {type: "pragma", value: match[1], start: pos, end: pos+match[1].length};
	} else {
		throw "Invalid pragma";
	}
};

/////////////////////////// Exports

exports.parser = Parser;

})();