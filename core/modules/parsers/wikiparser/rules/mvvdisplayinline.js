/*\
title: $:/core/modules/parsers/wikiparser/rules/mvvdisplayinline.js
type: application/javascript
module-type: wikirule

Wiki rule for inline display of multi-valued variables and filter results.

Variable display: ((varname)) or ((varname||separator))
Filter display: (((filter))) or (((filter||separator)))

The default separator is ", " (comma space).

\*/

"use strict";

exports.name = "mvvdisplayinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	var source = this.parser.source;
	var nextStart = startPos;
	while((nextStart = source.indexOf("((",nextStart)) >= 0) {
		if(source.charAt(nextStart + 2) === "(") {
			// Filter mode: (((filter))) or (((filter||sep)))
			var match = /^\(\(\(([\s\S]+?)\)\)\)/.exec(source.substring(nextStart));
			if(match) {
				// Check for separator: split on last || before )))
				var inner = match[1];
				var sepIndex = inner.lastIndexOf("||");
				if(sepIndex >= 0) {
					this.nextMatch = {
						type: "filter",
						filter: inner.substring(0,sepIndex),
						separator: inner.substring(sepIndex + 2),
						start: nextStart,
						end: nextStart + match[0].length
					};
				} else {
					this.nextMatch = {
						type: "filter",
						filter: inner,
						separator: ", ",
						start: nextStart,
						end: nextStart + match[0].length
					};
				}
				return nextStart;
			}
		} else {
			// Variable mode: ((varname)) or ((varname||sep))
			var match = /^\(\(([^()|]+?)(?:\|\|([^)]*))?\)\)/.exec(source.substring(nextStart));
			if(match) {
				this.nextMatch = {
					type: "variable",
					varName: match[1],
					separator: match[2] !== undefined ? match[2] : ", ",
					start: nextStart,
					end: nextStart + match[0].length
				};
				return nextStart;
			}
		}
		nextStart += 2;
	}
	return undefined;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	var match = this.nextMatch;
	this.nextMatch = null;
	this.parser.pos = match.end;
	var filter, sep = match.separator;
	if(match.type === "variable") {
		filter = "[(" + match.varName + ")join[" + sep + "]]";
	} else {
		filter = match.filter + " +[join[" + sep + "]]";
	}
	return [{
		type: "text",
		attributes: {
			text: {name: "text", type: "filtered", filter: filter}
		},
		orderedAttributes: [
			{name: "text", type: "filtered", filter: filter}
		]
	}];
};
