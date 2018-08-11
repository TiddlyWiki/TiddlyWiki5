/*\
title: $:/plugins/tiddlywiki/katex/latex-parser.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for LaTeX. For example:

```
	$$latex-goes-here$$
```

This wikiparser can be modified using the rules eg:

```
\rules except latex-parser 
\rules only latex-parser 
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "latex-parser";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\$\$(?!\$)/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	var reEnd = /\$\$/mg;
	// Look for the end marker
	reEnd.lastIndex = this.parser.pos;
	var match = reEnd.exec(this.parser.source),
		text,
		displayMode;
	// Process the text
	if(match) {
		text = this.parser.source.substring(this.parser.pos,match.index);
		displayMode = text.indexOf('\n') != -1;
		this.parser.pos = match.index + match[0].length;
	} else {
		text = this.parser.source.substr(this.parser.pos);
		displayMode = false;
		this.parser.pos = this.parser.sourceLength;
	}
	return [{
		type: "latex",
		attributes: {
			text: {
				type: "text",
				value: text
			},
			displayMode: {
				type: "text",
				value: displayMode ? "true" : "false"
			}
		}
	}];
};

})();
