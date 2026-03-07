/*\
title: $:/core/modules/parsers/wikiparser/rules/codeblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for code blocks. For example:

```
	```
	This text will not be //wikified//
	```
```

\*/

"use strict";

exports.name = "codeblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match opening ```. The rest of the opening line (language, optional anchor)
	// is parsed by parseInlineRun so that the inline anchor rule can process ^id.
	this.matchRegExp = /```/mg;
};

exports.parse = function() {
	var reEnd = /(\r?\n```$)/mg;
	var languageStart = this.parser.pos + 3;
	// Move past the ``` marker
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the rest of the opening line (language + optional ^anchor) using inline rules
	var openingLineNodes = this.parser.parseInlineRun(/(\r?\n)/mg);
	// Skip past the terminating newline so it doesn't become part of the code content
	if(this.parser.pos < this.parser.sourceLength && this.parser.source[this.parser.pos] === "\n") {
		this.parser.pos++;
	} else if(this.parser.pos + 1 < this.parser.sourceLength && this.parser.source.substr(this.parser.pos, 2) === "\r\n") {
		this.parser.pos += 2;
	}
	// Extract language from the first text node
	var language = "";
	if(openingLineNodes.length > 0 && openingLineNodes[0].type === "text" && openingLineNodes[0].text) {
		var langMatch = openingLineNodes[0].text.match(/^[\w-]*/);
		language = langMatch ? langMatch[0] : "";
		// Remove the language text from the node (keep remaining text if any)
		openingLineNodes[0].text = openingLineNodes[0].text.substring(language.length);
		if(!openingLineNodes[0].text) {
			openingLineNodes.splice(0, 1);
		}
	}
	var languageEnd = languageStart + language.length;

	// Look for the end of the block
	reEnd.lastIndex = this.parser.pos;
	var match = reEnd.exec(this.parser.source),
		text,
		codeStart = this.parser.pos;
	// Process the block
	if(match) {
		text = this.parser.source.substring(this.parser.pos,match.index);
		this.parser.pos = match.index + match[0].length;
	} else {
		text = this.parser.source.substr(this.parser.pos);
		this.parser.pos = this.parser.sourceLength;
	}
	// Return the $codeblock widget
	var node = {
		type: "codeblock",
		attributes: {
			code: {type: "string", value: text, start: codeStart, end: this.parser.pos},
			language: {type: "string", value: language, start: languageStart, end: languageEnd}
		}
	};
	// Store opening line nodes (may contain name anchor) for wrapAnchorsInTree
	if(openingLineNodes.length > 0) {
		node.openingLineNodes = openingLineNodes;
	}
	return [node];
};
