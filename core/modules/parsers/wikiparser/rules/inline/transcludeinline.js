/*\
title: $:/core/modules/parsers/wikiparser/rules/inline/transcludeinline.js
type: application/javascript
module-type: wiki-inline-rule

Wiki text rule for inline-level transclusion. For example:

{{{
{{MyTiddler}}
{{MyTiddler|tooltip}}
{{MyTiddler}width:40;height:50;}.class.class
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "transclude";

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\{\{([^\{\}\|]+)(?:\|([^\{\}]+))?\}([^\}]*)\}(?:\.(\S+))?/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var targetTitle = this.match[1],
		tooltip = this.match[2],
		style = this.match[3],
		classes = this.match[4];
	// Return the transclude widget
	var node = {
		type: "widget",
		tag: "transclude",
		attributes: {
			target: {type: "string", value: targetTitle}
		}
	};
	if(tooltip) {
		node.attributes.tooltip = {type: "string", value: tooltip};
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
