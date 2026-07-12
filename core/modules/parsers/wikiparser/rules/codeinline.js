/*\
title: $:/core/modules/parsers/wikiparser/rules/codeinline.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for code runs. For example:

```
	This is a `code run`.
	This is another ``code run``
```

\*/

"use strict";

exports.name = "codeinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /(``?)/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	var reEnd = new RegExp(this.match[1], "mg");
	// Look for the end marker
	reEnd.lastIndex = this.parser.pos;
	var match = reEnd.exec(this.parser.source),
		text,
		start = this.parser.pos,
		textEnd;
	// Process the text
	if(match) {
		text = this.parser.source.substring(this.parser.pos,match.index);
		textEnd = match.index;
		this.parser.pos = match.index + match[0].length;
	} else {
		// An unmatched delimiter renders as literal text and inline parsing resumes after it, so a stray backtick cannot swallow the rest of the source (CommonMark section 6.1)
		var delimiterStart = start - this.match[1].length;
		this.parser.addDiagnostic({
			from: delimiterStart,
			to: start,
			severity: "warning",
			code: "unterminated-codeinline",
			message: "Unmatched inline code delimiter rendered as literal text"
		});
		return [{type: "text", text: this.match[1], start: delimiterStart, end: start, isRecovered: true}];
	}
	return [{
		type: "element",
		tag: "code",
		children: [{
			type: "text",
			text: text,
			start: start,
			end: textEnd
		}]
	}];
};
