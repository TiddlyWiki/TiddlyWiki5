/*\
title: $:/core/modules/parsers/wikiparser/rules/filteredtranscludeblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for block-level filtered transclusion. For example:

```
{{{ [tag[docs]] }}}
{{{ [tag[docs]] |tooltip}}}
{{{ [tag[docs]] ||TemplateTitle}}}
{{{ [tag[docs]] |tooltip||TemplateTitle}}}
{{{ [tag[docs]] }}width:40;height:50;}.class.class
```

\*/

"use strict";

exports.name = "filteredtranscludeblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\{\{\{([^\|]+?)(?:\|([^\|\{\}]+))?(?:\|\|([^\|\{\}]+))?\}\}([^\}]*)\}(?:\.(\S+))?(?:\r?\n|$)/mg;
};

exports.parse = function() {
	// Move past the match
	var filterStart = this.parser.pos + 3;
	var filterEnd = filterStart + this.match[1].length;
	var toolTipStart = filterEnd + 1;
	var toolTipEnd = toolTipStart + (this.match[2] ? this.match[2].length : 0);
	var templateStart = toolTipEnd + 2;
	var templateEnd = templateStart + (this.match[3] ? this.match[3].length : 0);
	var styleStart = templateEnd + 2;
	var styleEnd = styleStart + (this.match[4] ? this.match[4].length : 0);
	var classesStart = styleEnd + 1;
	var classesEnd = classesStart + (this.match[5] ? this.match[5].length : 0);
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var filter = this.match[1],
		tooltip = this.match[2],
		template = $tw.utils.trim(this.match[3]),
		style = this.match[4],
		classes = this.match[5];
	// Return the list widget
	var node = {
		type: "list",
		attributes: {
			filter: {type: "string", value: filter, start: filterStart, end: filterEnd},
		},
		isBlock: true
	};
	if(tooltip) {
		node.attributes.tooltip = {type: "string", value: tooltip, start: toolTipStart, end: toolTipEnd};
	}
	if(template) {
		node.attributes.template = {type: "string", value: template, start: templateStart, end: templateEnd};
	}
	if(style) {
		node.attributes.style = {type: "string", value: style, start: styleStart, end: styleEnd};
	}
	if(classes) {
		node.attributes.itemClass = {type: "string", value: classes.split(".").join(" "), start: classesStart, end: classesEnd};
	}
	return [node];
};
