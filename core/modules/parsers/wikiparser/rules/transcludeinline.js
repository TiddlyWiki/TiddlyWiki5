/*\
title: $:/core/modules/parsers/wikiparser/rules/transcludeinline.js
type: application/javascript
module-type: wikirule

Wiki text rule for inline-level transclusion. For example:

```
{{MyTiddler}}
{{MyTiddler||TemplateTitle}}
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
	this.matchRegExp = /\{\{([^\{\}\|]*)(?:\|\|([^\|\{\}]+))?\}\}/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var template = $tw.utils.trim(this.match[2]),
		textRef = $tw.utils.trim(this.match[1]);
	// Prepare the transclude widget
	var transcludeNode = {
			type: "element",
			tag: "$transclude",
			attributes: {}
		};
	// Prepare the tiddler widget
	if(textRef) {
		var tr = $tw.utils.parseTextReference(textRef),
			targetTitle = tr.title,
			targetField = tr.field,
			targetIndex = tr.index,
			tiddlerNode = {
				type: "element",
				tag: "$tiddler",
				attributes: {
					tiddler: {type: "string", value: targetTitle}
				},
				children: [transcludeNode]
			};
	}
	if(template) {
		transcludeNode.attributes.tiddler = {type: "string", value: template};
		if(textRef) {
			return [tiddlerNode];
		} else {
			return [transcludeNode];
		}
	} else {
		if(textRef) {
			transcludeNode.attributes.tiddler = {type: "string", value: targetTitle};
			if(targetField) {
				transcludeNode.attributes.field = {type: "string", value: targetField};
			}
			if(targetIndex) {
				transcludeNode.attributes.index = {type: "string", value: targetIndex};
			}
			return [tiddlerNode];
		} else {
			return [transcludeNode];
		}
	}
};

})();
