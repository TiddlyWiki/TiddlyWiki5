/*\
title: $:/core/modules/parsers/wikiparser/rules/filteredtranscludeinline.js
type: application/javascript
module-type: wikirule

Wiki text rule for inline filtered transclusion. For example:

```
((( [tag[docs]] )))
((( [tag[docs]] ||TemplateTitle)))
```

Original syntax is deprecated and will be changed to output only the first result in a future release:

```
{{{ [tag[docs]] }}}
{{{ [tag[docs]] ||TemplateTitle}}}
```

\*/

"use strict";

exports.name = "filteredtranscludeinline";

exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match both {{{ }}} and ((( ))) syntax
	this.matchRegExp = /(?:\{\{\{|\(\(\()([^\|\{\}\(\)]+?)(?:\|\|([^\|\{\}\(\)]+))?(?:\}\}\}|\)\)\))/mg;
};

exports.parse = function() {
	var filterStart = this.parser.pos + 3;
	var filterEnd = filterStart + this.match[1].length;
	var templateStart = filterEnd + 2;
	var templateEnd = templateStart + (this.match[2] ? this.match[2].length : 0);
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var filter = this.match[1],
		template = $tw.utils.trim(this.match[2]);
	// Return the list widget
	var node = {
		type: "list",
		attributes: {
			filter: {type: "string", value: filter, start: filterStart, end: filterEnd},
		}
	};
	if(template) {
		node.attributes.template = {type: "string", value: template, start: templateStart, end: templateEnd};
	}
	return [node];
};