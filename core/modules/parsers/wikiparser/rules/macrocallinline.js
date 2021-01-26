/*\
title: $:/core/modules/parsers/wikiparser/rules/macrocallinline.js
type: application/javascript
module-type: wikirule

Wiki rule for macro calls

```
<<name value value2>>
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "macrocallinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	var nextStart = startPos;
	while ((nextStart = this.parser.source.indexOf("<<",nextStart)) >= 0) {
		this.nextCall = $tw.utils.parseMacroInvocation(this.parser.source,nextStart);
		if (this.nextCall) {
			// Can't this just be "nextStart"?
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
	var call = this.nextCall;
	this.nextCall = null;
	this.parser.pos = call.end;
	return [call];
};

})();
