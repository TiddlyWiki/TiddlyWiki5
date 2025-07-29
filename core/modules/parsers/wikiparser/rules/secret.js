/*\
title: $:/core/modules/parsers/wikiparser/rules/secret.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for secret references using §[secret:name] syntax

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "secret";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match §[secret:name]
	this.matchRegExp = /§\[secret:([^\]]+)\]/mg;
};

exports.parse = function() {
	// Extract the secret name
	var secretName = this.match[1];
	
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	
	// Return the secret widget
	return [{
		type: "secret",
		attributes: {
			name: {type: "string", value: secretName}
		}
	}];
};
