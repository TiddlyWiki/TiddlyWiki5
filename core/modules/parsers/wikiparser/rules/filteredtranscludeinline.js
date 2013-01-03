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
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "filteredtranscludeinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\{\{\{([^\{\}\|]+)(?:\|([^\|\{\}]+))?(?:\|\|([^\|\{\}]+))?\}\}([^\}]*)\}(?:\.(\S+))?/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var filter = this.match[1],
		tooltip = this.match[2],
		template = $tw.utils.trim(this.match[3]),
		style = this.match[4],
		classes = this.match[5];
	// Return the list widget
	var node = {
		type: "element",
		tag: "$list",
		attributes: {
			filter: {type: "string", value: filter}
		}
	};
	if(tooltip) {
		node.attributes.tooltip = {type: "string", value: tooltip};
	}
	if(template) {
		node.attributes.template = {type: "string", value: template};
	}
	if(style) {
		node.attributes.style = {type: "string", value: style};
	}
	if(classes) {
		node.attributes["itemClass"] = {type: "string", value: classes.split(".").join(" ")};
	}
	return [node];
};

})();
