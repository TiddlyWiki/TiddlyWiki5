/*\
title: $:/core/modules/parsers/wikiparser/rules/blockidentifier.js
type: application/javascript
module-type: wikirule

Use hash as a tag for paragraph, we call it block identifier.

1. Hash won't change, it can be written by hand or be generated, and it is a ` \^\S+$` string after line: `text ^cb9d485` or `text ^1`, so it can be human readable (while without space), here are the parse rule for this.
2. When creating widgets for rendering, omit this hash, so it's invisible in view mode. But this widget will create an anchor to jump to.

\*/
exports.name = "blockidentifier";
exports.types = {inline: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match the block identifier located on the end of the line.
	this.matchRegExp = /[ ]\^\S+$/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	var id = this.match[0].slice(2);
	// Parse tree nodes to return
	return [{
		type: "blockidentifier",
		attributes: {
			id: {type: "string", value: id}
		},
		children: []
	}];
};
