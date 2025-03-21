/*\
title: $:/core/modules/parsers/wikiparser/rules/horizrule.js
type: application/javascript
module-type: wikirule

Wiki text block rule for rules. For example:

```
---
```

\*/

"use strict";

exports.name = "horizrule";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /-{3,}\r?(?:\n|$)/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	return [{type: "element", tag: "hr"}];
};
