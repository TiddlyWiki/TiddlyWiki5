/*\
title: $:/core/modules/parsers/wikiparser/rules/macrocallblock.js
type: application/javascript
module-type: wikirule

Wiki rule for block macro calls

```
<<name value value2>>
```

\*/

"use strict";

exports.name = "macrocallblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	var nextStart = startPos;
	// Try parsing at all possible macrocall openers until we match
	while((nextStart = this.parser.source.indexOf("<<",nextStart)) >= 0) {
		var nextCall = $tw.utils.parseMacroInvocationAsTransclusion(this.parser.source,nextStart);
		if(nextCall) {
			var c = this.parser.source.charAt(nextCall.end);
			// Ensure EOL after parsed macro
			// If we didn't need to support IE, we'd just use /(?:\r?\n|$)/ym
			if ((c === "") || (c === "\n") || ((c === "\r") && this.parser.source.charAt(nextCall.end+1) === "\n")) {
				this.nextCall = nextCall;
				return nextStart;
			}
		}
		nextStart += 2;
	}
	return undefined;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	var call = this.nextCall;
	call.isBlock = true;
	this.nextCall = null;
	this.parser.pos = call.end;
	return [call];
};
