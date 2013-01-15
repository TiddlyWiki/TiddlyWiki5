/*\
title: $:/core/modules/parsers/wikiparser/rules/transcludeinline.js
type: application/javascript
module-type: wikirule

Wiki text rule for inline-level transclusion. For example:

```
{{MyTiddler}}
{{MyTiddler|tooltip}}
{{MyTiddler||TemplateTitle}}
{{MyTiddler|tooltip||TemplateTitle}}
{{MyTiddler}width:40;height:50;}.class.class
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "transcludeinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\{\{([^\{\}\|]+)(?:\|([^\|\{\}]+))?(?:\|\|([^\|\{\}]+))?\}([^\}]*)\}(?:\.(\S+))?/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var textRef = $tw.utils.trim(this.match[1]),
		tr = $tw.utils.parseTextReference(textRef),
		targetTitle = tr.title,
		targetField = tr.field,
		targetIndex = tr.index,
		tooltip = this.match[2],
		template = $tw.utils.trim(this.match[3]),
		style = this.match[4],
		classes = this.match[5];
	// Return the transclude widget
	var node = {
		type: "element",
		tag: "$transclude",
		attributes: {
			target: {type: "string", value: targetTitle}
		}
	};
	if(targetField) {
		node.attributes.field = {type: "string", value: targetField};
	}
	if(targetIndex) {
		node.attributes.index = {type: "string", value: targetIndex};
	}
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
		node.attributes["class"] = {type: "string", value: classes.split(".").join(" ")};
	}
	return [node];
};

})();
