/*\
title: $:/core/modules/parsers/wikiparser/rules/filteredtranscludeinline.js
type: application/javascript
module-type: wikirule

Wiki text rule for inline filtered transclusion. For example:

```
{{{ [tag[docs]] }}}
{{{ [tag[docs]] |tooltip}}}
{{{ [tag[docs]] ||TemplateTitle}}}
{{{ [tag[docs]] |tooltip||TemplateTitle}}}
{{{ [tag[docs]] }}width:40;height:50;}.class.class
```

\*/

"use strict";

exports.name = "filteredtranscludeinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\{\{\{([^\|]+?)(?:\|([^\|\{\}]+))?(?:\|\|([^\|\{\}]+))?\}\}([^\}]*)\}(?:\.(\S+))?/mg;
};

exports.parse = function() {
	const filterStart = this.parser.pos + 3;
	const filterEnd = filterStart + this.match[1].length;
	const toolTipStart = filterEnd + 1;
	const toolTipEnd = toolTipStart + (this.match[2] ? this.match[2].length : 0);
	const templateStart = toolTipEnd + 2;
	const templateEnd = templateStart + (this.match[3] ? this.match[3].length : 0);
	const styleStart = templateEnd + 2;
	const styleEnd = styleStart + (this.match[4] ? this.match[4].length : 0);
	const classesStart = styleEnd + 1;
	const classesEnd = classesStart + (this.match[5] ? this.match[5].length : 0);
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	const filter = this.match[1];
	const tooltip = this.match[2];
	const template = $tw.utils.trim(this.match[3]);
	const style = this.match[4];
	const classes = this.match[5];
	// Return the list widget
	const node = {
		type: "list",
		attributes: {
			filter: {type: "string",value: filter,start: filterStart,end: filterEnd},
		}
	};
	if(tooltip) {
		node.attributes.tooltip = {type: "string",value: tooltip,start: toolTipStart,end: toolTipEnd};
	}
	if(template) {
		node.attributes.template = {type: "string",value: template,start: templateStart,end: templateEnd};
	}
	if(style) {
		node.attributes.style = {type: "string",value: style,start: styleStart,end: styleEnd};
	}
	if(classes) {
		node.attributes.itemClass = {type: "string",value: classes.split(".").join(" "),start: classesStart,end: classesEnd};
	}
	return [node];
};
