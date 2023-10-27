/*\
title: $:/core/modules/parsers/wikiparser/rules/filteredtranscludeblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for block-level filtered transclusion. For example:

```
{{{ [tag[docs]] }}}
{{{ [tag[docs]] ||TemplateTitle}}}
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "filteredtranscludeblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	// this.matchRegExp = /\{\{\{([^\|]+?)(?:\|([^\|\{\}]+))?(?:\|\|([^\|\{\}]+))?\}\}([^\}]*)\}(?:\.(\S+))?(?:\r?\n|$)/mg;
	this.matchRegExp = /\{\{\{([^\|]+?)(?:\|\|([^\|\{\}]+))?\}\}\}(?:\r?\n|$)/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var filter = this.match[1],
		template = $tw.utils.trim(this.match[2]);
	// Return the list widget
	var node = {
		type: "list",
		attributes: {
			filter: {type: "string", value: filter}
		},
		isBlock: true
	};
	if(template) {
		node.attributes.template = {type: "string", value: template};
	}
	return [node];
};

})();
