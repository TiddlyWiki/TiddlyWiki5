/*\
title: $:/core/modules/parsers/wikiparser/rules/comment.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for HTML comments. For example:

```
<!-- This is a comment -->
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "comment";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match - HTML comment regexp by Stephen Ostermiller, http://ostermiller.org/findhtmlcomment.html
	this.matchRegExp = /\<![ \r\n\t]*(?:--(?:[^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)\>/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Don't return any elements
	return [];
};

})();
