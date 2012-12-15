/*\
title: $:/core/modules/parsers/wikiparser/rules/block/transcludeblock.js
type: application/javascript
module-type: wikiblockrule

Wiki text rule for block-level transclusion. For example:

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
	this.matchRegExp = /\{\{([^\{\}\|]+)(?:\|([^\{\}]+))?\}([^\}]*)\}/mg;
};

exports.parse = function(match,isBlock) {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var targetTitle = this.match[1],
		tooltip = this.match[2],
		style = this.match[3];
	// Parse any class definitions
	var classes = this.parser.parseClasses();
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
	if(classes.length > 0) {
		node.attributes["class"] = {type: "string", value: classes.join(" ")};
	}
	return [node];
};

})();
