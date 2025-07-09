/*\
title: $:/core/modules/parsers/wikiparser/rules/macrocallinline.js
type: application/javascript
module-type: wikirule

Wiki rule for macro calls

```
<<name value value2>>
```

\*/

"use strict";

exports.name = "macrocallinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	let nextStart = startPos;
	// Try parsing at all possible macrocall openers until we match
	while((nextStart = this.parser.source.indexOf("<<",nextStart)) >= 0) {
		this.nextCall = $tw.utils.parseMacroInvocationAsTransclusion(this.parser.source,nextStart);
		if(this.nextCall) {
			return nextStart;
		}
		nextStart += 2;
	}
	return undefined;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	const call = this.nextCall;
	this.nextCall = null;
	this.parser.pos = call.end;
	return [call];
};
