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
	this.matchRegExp = /\{\{([^\{\}\|]*)(?:\|\|([^\|\{\}]+))?(?:\|([^\{\}]+))?\}\}(?:\r?\n|$)/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var template = $tw.utils.trim(this.match[2]),
		textRef = $tw.utils.trim(this.match[1]),
		params = this.match[3] ? this.match[3].split("|") : [];
	// Prepare the transclude widget
	var transcludeNode = {
			type: "transclude",
			attributes: {},
			isBlock: true
		};
	$tw.utils.each(params,function(paramValue,index) {
		var name = "" + index;
		transcludeNode.attributes[name] = {
			name: name,
			type: "string",
			value: paramValue
		}
	});
	// Prepare the tiddler widget
	var tr, targetTitle, targetField, targetIndex, tiddlerNode;
	if(textRef) {
		tr = $tw.utils.parseTextReference(textRef);
		targetTitle = tr.title;
		targetField = tr.field;
		targetIndex = tr.index;
		tiddlerNode = {
			type: "tiddler",
			attributes: {
				tiddler: {name: "tiddler", type: "string", value: targetTitle}
			},
			isBlock: true,
			children: [transcludeNode]
		};
	}
	if(template) {
		transcludeNode.attributes["$tiddler"] = {name: "$tiddler", type: "string", value: template};
		if(textRef) {
			return [tiddlerNode];
		} else {
			return [transcludeNode];
		}
	} else {
		if(textRef) {
			transcludeNode.attributes["$tiddler"] = {name: "$tiddler", type: "string", value: targetTitle};
			if(targetField) {
				transcludeNode.attributes["$field"] = {name: "$field", type: "string", value: targetField};
			}
			if(targetIndex) {
				transcludeNode.attributes["$index"] = {name: "$index", type: "string", value: targetIndex};
			}
			return [tiddlerNode];
		} else {
			return [transcludeNode];
		}
	}
};

})();
