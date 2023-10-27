/*\
title: $:/core/modules/parsers/wikiparser/rules/filteredtranscludeinline.js
type: application/javascript
module-type: wikirule

Wiki text rule for inline filtered transclusion. For example:

```
{{{ [tag[docs]] }}}
{{{ [tag[docs]] ||TemplateTitle}}}
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "filteredtranscludeinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	// this.matchRegExp = /\{\{\{([^\|]+?)(?:\|([^\|\{\}]+))?(?:\|\|([^\|\{\}]+))?\}\}([^\}]*)\}(?:\.(\S+))?/mg;
	this.matchRegExp = /\{\{\{([^\|]+?)(?:\|\|([^\|\{\}]+))?\}\}\}/mg;
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
		}
	};
	if(template) {
		node.attributes.template = {type: "string", value: template};
	}
	return [node];
};

})();
