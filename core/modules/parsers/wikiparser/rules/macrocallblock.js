/*\
title: $:/core/modules/parsers/wikiparser/rules/macrocallblock.js
type: application/javascript
module-type: wikirule

Wiki rule for block macro calls

```
<<name value value2>>
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "macrocallblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	var nextStart = startPos;
	while((nextStart = this.parser.source.indexOf("<<",nextStart)) >= 0) {
		var nextCall = $tw.utils.parseMacroInvocation(this.parser.source,nextStart);
		if(nextCall) {
			// If we didn't need to support IE, we'd just use /(?:\r?\n|$)/ym
			switch(this.parser.source.charAt(nextCall.end)) {
				case "\r":
					if (this.parser.source.charAt(nextCall.end+1) !== "\n") {
						break;
					}
					// no break;
				case "\n":
				case "":
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

})();
