/*\
title: $:/core/modules/parsers/wikiparser/rules/inline/extlink.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for external links. For example:

{{{
An external link: http://www.tiddlywiki.com/

A suppressed external link: ~http://www.tiddlyspace.com/
}}}

External links can be suppressed by preceding them with `~`.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "extlink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /~?(?:file|http|https|mailto|ftp|irc|news|data):[^\s'"]+(?:\/|\b)/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Create the link unless it is suppressed
	if(this.match[0].substr(0,1) === "~") {
		return [{type: "text", text: this.match[0].substr(1)}];
	} else {
		return [{
			type: "widget",
			tag: "link",
			attributes: {
				to: {type: "string", value: this.match[0]}
			},
			children: [{
				type: "text", text: this.match[0]
			}]
		}];
	}
};

})();
