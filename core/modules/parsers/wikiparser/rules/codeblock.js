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
	// Regexp to match the opening fence and its info string
	this.matchRegExp = /(`{3,})([^`\r\n]*)\r?\n/mg;
};

exports.parse = function() {
	var fence = this.match[1],
		info = this.match[2],
		// The language comes from the first word of the info string
		leading = info.length - info.replace(/^[ \t]+/,"").length,
		language = info.replace(/^[ \t]+|[ \t]+$/g,"").split(/[ \t]+/)[0] || "";
	// Regexp to match a closing fence at least as long as the opening one
	var reEnd = new RegExp("(^|\\r?\\n)[ \\t]{0,3}`{" + fence.length + ",}[ \\t]*(?=\\r?\\n|$)","mg");
	var languageStart = this.parser.pos + fence.length + leading,
		languageEnd = languageStart + language.length;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;

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
		this.parser.addDiagnostic({
			from: codeStart,
			to: this.parser.sourceLength,
			severity: "warning",
			code: "unterminated-codeblock",
			message: "Unterminated code block"
		});
		this.parser.pos = this.parser.sourceLength;
	}
	// Return the $codeblock widget
	return [{
		type: "codeblock",
		attributes: {
			code: {type: "string", value: text, start: codeStart, end: this.parser.pos},
			language: {type: "string", value: language, start: languageStart, end: languageEnd}
		}
	}];
};
