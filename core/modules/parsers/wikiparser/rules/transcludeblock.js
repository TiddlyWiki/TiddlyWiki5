/*\
title: $:/core/modules/parsers/wikiparser/rules/transcludeblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for block-level transclusion. For example:

```
{{MyTiddler}}
{{MyTiddler||TemplateTitle}}
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "transcludeblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\{\{([^\{\}\|]+)(?:\|\|([^\|\{\}]+))?\}\}(?:\r?\n|$)/mg;
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
		template = $tw.utils.trim(this.match[2]);
	// Prepare the transclude widget
	var transcludeNode = {
			type: "element",
			tag: "$transclude",
			attributes: {
				tiddler: {type: "string", value: template || targetTitle}
			},
			isBlock: true
		};
	var tiddlerNode = {
		type: "element",
		tag: "$tiddler",
		attributes: {
			tiddler: {type: "string", value: targetTitle}
		},
		isBlock: true,
		children: [transcludeNode]
	};
	if(targetField) {
		transcludeNode.attributes.field = {type: "string", value: targetField};
	}
	if(targetIndex) {
		transcludeNode.attributes.index = {type: "string", value: targetIndex};
	}
	return [tiddlerNode];
};

})();
