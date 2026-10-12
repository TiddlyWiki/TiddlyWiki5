/*\
title: $:/core/modules/parsers/wikiparser/rules/emphasis/italic.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for emphasis - italic. For example:

```
	This is //italic// text
```

This wikiparser can be modified using the rules eg:

```
\rules except italic
\rules only italic
```

\*/

"use strict";

/*
Check whether a slash run follows a URI scheme, including when the candidate
delimiter starts partway through the run.
*/
function followsUriScheme(source,pos) {
	while(pos > 0 && source.charAt(pos - 1) === "/") {
		pos--;
	}
	if(source.charAt(pos - 1) !== ":") {
		return false;
	}
	var schemeEnd = pos - 1,
		schemeStart = schemeEnd;
	while(schemeStart > 0 && /[A-Za-z0-9+.-]/.test(source.charAt(schemeStart - 1))) {
		schemeStart--;
	}
	return schemeStart < schemeEnd &&
		/[A-Za-z]/.test(source.charAt(schemeStart)) &&
		source.charAt(schemeStart - 1) !== "_";
}

/*
Use the same URI guard for opening and closing italic delimiters. The inline
parser calls exec() on its terminator, so keep the guard on the regexp itself.
*/
function makeItalicRegExp() {
	var cachedSource, cachedStart, cachedMatch,
		regexp = /\/\//mg;
	regexp.exec = function(source) {
		var searchStart = this.lastIndex;
		// The parser retries as inner rules advance. The next eligible delimiter
		// remains valid through its start, or through EOF when none was found.
		// Cache hits restore lastIndex as native exec does, including failure.
		if(cachedSource === source && cachedStart <= searchStart && (!cachedMatch || searchStart <= cachedMatch.index)) {
			this.lastIndex = cachedMatch ? cachedMatch.index + cachedMatch[0].length : 0;
			return cachedMatch;
		}
		var match = RegExp.prototype.exec.call(this,source);
		while(match && followsUriScheme(source,match.index)) {
			// Skip the whole run so additional URI slashes cannot open italics.
			while(source.charAt(this.lastIndex) === "/") {
				this.lastIndex++;
			}
			match = RegExp.prototype.exec.call(this,source);
		}
		cachedSource = source;
		cachedStart = searchStart;
		cachedMatch = match;
		return match;
	};
	return regexp;
}

exports.name = "italic";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = makeItalicRegExp();
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;

	// Parse the run including the terminator
	var tree = this.parser.parseInlineRun(makeItalicRegExp(),{eatTerminator: true});

	// Return the classed span
	return [{
		type: "element",
		tag: "em",
		children: tree
	}];
};
