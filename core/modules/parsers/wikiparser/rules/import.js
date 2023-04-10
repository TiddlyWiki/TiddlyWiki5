/*\
title: $:/core/modules/parsers/wikiparser/rules/import.js
type: application/javascript
module-type: wikirule

Wiki pragma rule for importing variable definitions

```
\import [[$:/core/ui/PageMacros]] [all[shadows+tiddlers]tag[$:/tags/Macro]!has[draft.of]]
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "import";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /^\\import[^\S\n]/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	var self = this;
	// Move past the pragma invocation
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the filter terminated by a line break
	var reMatch = /(.*)(?:$|\r?\n)/mg;
	reMatch.lastIndex = this.parser.pos;
	var match = reMatch.exec(this.parser.source);
	this.parser.pos = reMatch.lastIndex;
	// Parse tree nodes to return
	return [{
		type: "importvariables",
		attributes: {
			filter: {type: "string", value: match[1]}
		},
		children: []
	}];
};

})();
