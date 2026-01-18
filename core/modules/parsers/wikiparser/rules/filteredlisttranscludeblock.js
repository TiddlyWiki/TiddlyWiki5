/*\
title: $:/core/modules/parsers/wikiparser/rules/filteredlisttranscludeblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for block-level filtered transclusion using ((( ))) syntax. For example:

```
((( [tag[docs]] )))
((( [tag[docs]] ||TemplateTitle)))
```

\*/

"use strict";

exports.name = "filteredlisttranscludeblock";

exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match ((( ))) syntax using negative lookahead to allow complex filter expressions
	this.matchRegExp = /\(\(\(((?:(?!(?:\)\)\)|\|\|)).)+?)(?:\|\|((?:(?!\)\)\)).)+?))?\)\)\)(?:\r?\n|$)/mg;
};

exports.parse = function() {
	// Move past the match
	var filterStart = this.parser.pos + 3;
	var filterEnd = filterStart + this.match[1].length;
	var templateStart = filterEnd + 2;
	var templateEnd = templateStart + (this.match[2] ? this.match[2].length : 0);
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var filter = this.match[1],
		template = $tw.utils.trim(this.match[2]);
	// Return the list widget
	var node = {
		type: "list",
		attributes: {
			filter: {type: "string", value: filter, start: filterStart, end: filterEnd},
		},
		isBlock: true
	};
	if(template) {
		node.attributes.template = {type: "string", value: template, start: templateStart, end: templateEnd};
	}
	return [node];
};
