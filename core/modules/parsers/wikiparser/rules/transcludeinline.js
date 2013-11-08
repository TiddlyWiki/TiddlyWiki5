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
	// Prepare the transclude widget
	var transcludeNode = {
			type: "element",
			tag: "$transclude",
			attributes: {
				tiddler: {type: "string", value: template || targetTitle}
			}
		};
	var tiddlerNode = {
		type: "element",
		tag: "$tiddler",
		attributes: {
			tiddler: {type: "string", value: targetTitle}
		},
		children: [transcludeNode]
	};
	if(targetField) {
		transcludeNode.attributes.field = {type: "string", value: targetField};
	}
	if(targetIndex) {
		transcludeNode.attributes.index = {type: "string", value: targetIndex};
	}
	if(tooltip) {
		transcludeNode.attributes.tooltip = {type: "string", value: tooltip};
	}
	if(style) {
		transcludeNode.attributes.style = {type: "string", value: style};
	}
	if(classes) {
		transcludeNode.attributes["class"] = {type: "string", value: classes.split(".").join(" ")};
	}
	return [tiddlerNode];
};

})();
