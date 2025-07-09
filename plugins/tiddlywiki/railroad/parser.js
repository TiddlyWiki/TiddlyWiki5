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

"use strict";

const {components} = require("$:/plugins/tiddlywiki/railroad/components.js");

const Parser = function(widget,source,options) {
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
	const content = [];
	// Parse zero or more components
	while(true) {
		const component = this.parseComponent();
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
	let component = null;
	if(this.token) {
		if(this.at("string")) {
			component = this.parseTerminal();
		} else if(this.at("name")) {
			component = this.parseName();
		} else if(this.at("pragma")) {
			component = this.parsePragma();
		} else {
			switch(this.token.value) {
				case "[": {
					component = this.parseOptional();
					break;
				}
				case "{": {
					component = this.parseRepeated();
					break;
				}
				case "<": {
					component = this.parseNonterminal();
					break;
				}
				case "(": {
					component = this.parseChoice();
					break;
				}
				case "/": {
					component = this.parseComment();
					break;
				}
				case "[[": {
					component = this.parseLink();
					break;
				}
				case "{{": {
					component = this.parseTransclusion();
					break;
				}
				case "<-": {
					component = this.parseSequence();
					break;
				}
				case "-": {
					component = this.parseDummy();
					break;
				}
			}
		}
	}
	return component;
};

/////////////////////////// Specific components

Parser.prototype.parseChoice = function() {
	// Consume the (
	this.advance();
	const content = [];
	let colon = -1;
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
	const content = this.expectString("after /");
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
	const content = this.parseContent();
	// Consume the |
	this.expect("|");
	// Consume the target
	const target = this.expectNameOrString("as link target");
	// Prepare some attributes for the SVG "a" element to carry
	const options = {"data-tw-target": target};
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
	const component = new components.Nonterminal(this.token.value);
	// Consume the name
	this.advance();
	return component;
};

Parser.prototype.parseNonterminal = function() {
	// Consume the <
	this.advance();
	// The nonterminal's name should be in a string literal
	const content = this.expectString("after <");
	// Consume the closing bracket
	this.close(">");
	// Create a component
	return new components.Nonterminal(content);
};

Parser.prototype.parseOptional = function() {
	const wantArrow = this.options.arrow;
	// Consume the [
	this.advance();
	// Consume the { if there is one
	const repeated = this.eat("{");
	// Note whether omission is the normal route
	const normal = this.eat(":");
	// Parse the content
	const content = this.parseContent();
	let separator = null;
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
	const wantArrow = this.options.arrow;
	// Consume the {
	this.advance();
	// Parse the content
	const content = this.parseContent();
	let separator = null;
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
	const content = this.parseContent();
	// Consume the closing ->
	this.close("->");
	// Create a component
	return new components.Sequence(content);
};

Parser.prototype.parseTerminal = function() {
	const component = new components.Terminal(this.token.value);
	// Consume the string literal
	this.advance();
	return component;
};

Parser.prototype.parseTransclusion = function() {
	// Consume the {{
	this.advance();
	// Consume the text reference
	const textRef = this.expectNameOrString("as transclusion source");
	// Consume the closing }}
	this.close("}}");
	// Retrieve the content of the text reference
	const source = this.widget.wiki.getTextReference(textRef,"",this.widget.getVariable("currentTiddler"));
	// Parse the content
	const {content} = new Parser(this.widget,source);
	// Create a component
	return new components.Transclusion(content);
};

/////////////////////////// Pragmas

Parser.prototype.parsePragma = function() {
	// Create a dummy component
	const component = {isPragma: true};
	// Consume the pragma
	const pragma = this.token.value;
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
};

Parser.prototype.parseTerminusStyle = function(pragma) {
	return this.parseSetting(["single","double","none"],pragma);
};

Parser.prototype.parseSetting = function(options,pragma) {
	if(this.at("name") && options.includes(this.token.value)) {
		return this.tokenValueEaten();
	}
	throw `${options.join(" or ")} expected after \\${pragma}`;
};

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
	const at = this.at(token);
	if(at) {
		this.advance();
	}
	return at;
};

Parser.prototype.tokenValueEaten = function() {
	const output = this.token.value;
	this.advance();
	return output;
};

Parser.prototype.close = function(token) {
	if(!this.eat(token)) {
		throw `Closing ${token} expected`;
	}
};

Parser.prototype.checkFinished = function() {
	if(this.token) {
		throw `Syntax error at ${this.token.value}`;
	}
};

Parser.prototype.expect = function(token) {
	if(!this.eat(token)) {
		throw `${token} expected`;
	}
};

Parser.prototype.expectString = function(context,token) {
	if(!this.at("string")) {
		token = token || "String";
		throw `${token} expected ${context}`;
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
	const tokens = [];
	let pos = 0;
	let c; let s; let token;
	while(pos < source.length) {
		// Initialise this iteration
		s = token = null;
		// Skip whitespace
		pos = $tw.utils.skipWhiteSpace(source,pos);
		// Avoid falling off the end of the string
		if(pos >= source.length) {
			break;
		}
		// Examine the next character
		c = source.charAt(pos);
		if("\"'".includes(c)) {
			// String literal
			token = $tw.utils.parseStringLiteral(source,pos);
			if(!token) {
				throw "Unterminated string literal";
			}
		} else if("[]{}".includes(c)) {
			// Single or double character
			s = source.charAt(pos + 1) === c ? c + c : c;
		} else if(c === "<") {
			// < or <-
			s = source.charAt(pos + 1) === "-" ? "<-" : "<";
		} else if(c === "-") {
			// - or ->
			s = source.charAt(pos + 1) === ">" ? "->" : "-";
		} else if("()>+/:|".includes(c)) {
			// Single character
			s = c;
		} else if(c.match(/[a-zA-Z]/)) {
			// Name
			token = this.readName(source,pos);
		} else if(c.match(/\\/)) {
			// Pragma
			token = this.readPragma(source,pos);
		} else {
			throw `Syntax error at ${c}`;
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
	const re = /([a-zA-Z0-9_.-]+)/g;
	re.lastIndex = pos;
	const match = re.exec(source);
	if(match && match.index === pos) {
		return {type: "name",value: match[1],start: pos,end: pos + match[1].length};
	} else {
		throw "Invalid name";
	}
};

Parser.prototype.readPragma = function(source,pos) {
	const re = /([a-z]+)/g;
	pos++;
	re.lastIndex = pos;
	const match = re.exec(source);
	if(match && match.index === pos) {
		return {type: "pragma",value: match[1],start: pos,end: pos + match[1].length};
	} else {
		throw "Invalid pragma";
	}
};

/////////////////////////// Exports

exports.parser = Parser;
