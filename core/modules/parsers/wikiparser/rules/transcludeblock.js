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

exports.serialize = function(tree, serialize) {
	var result = "{{";
	function handleTransclude(transcludeNode) {
		// Handle field
		if(transcludeNode.attributes.$field) {
			result += "!!" + transcludeNode.attributes.$field.value;
		}
		// Check for index attribute
		if(transcludeNode.attributes.$index) {
			result += "##" + transcludeNode.attributes.$index.value;
		}
		// Handle template
		var tiddlerTitle = tree.attributes.tiddler ? tree.attributes.tiddler.value : undefined;
		if(transcludeNode.attributes.$tiddler && transcludeNode.attributes.$tiddler.value !== tiddlerTitle) {
			result += "||" + transcludeNode.attributes.$tiddler.value;
		}
		// Check for parameters
		var params = [];
		var excludedAttributes = ["tiddler", "$tiddler", "$field", "$index", "$template"];
		for(var key in transcludeNode.attributes) {
			if(excludedAttributes.indexOf(key) === -1) {
				params.push(transcludeNode.attributes[key].value);
			}
		}
		if(params.length > 0) {
			result += "|" + params.join("|");
		}
	}
	function handleTiddler(tiddlerNode) {
		// Check for tiddler attribute
		if(tree.attributes.tiddler.value) { 
			result += tree.attributes.tiddler.value;
		}
		$tw.utils.each(tree.children, function(child) {
			if(child.type === "transclude") {
				handleTransclude(child);
			}
		});
	}
	if(tree.type === "tiddler") {
		handleTiddler(tree);
	} else if(tree.type === "transclude") {
		handleTransclude(tree);
	}
	result += "}}\n\n";
	return result;
};

})();
