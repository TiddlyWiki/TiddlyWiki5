/*\
title: $:/core/modules/parsers/wikiparser/rules/blockidentifier.js
type: application/javascript
module-type: wikirule

Use hash as a tag for paragraph, we call it block identifier.

1. Hash won't change, it can be written by hand or be generated, and it is a ` \^\S+$` string after line: `text ^cb9d485` or `text ^1`, so it can be human readable (while without space), here are the parse rule for this.
2. When creating widgets for rendering, omit this hash, so it's invisible in view mode. But this widget will create an anchor to jump to.

\*/
exports.name = "blockid";
exports.types = {inline: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match the block identifier
	// 1. located on the end of the line, with a space before it, means it's the id of the current block.
	// 2. located at start of the line, no space, means it's the id of the previous block. Because some block can't have id suffix, otherwise id break the block mode parser like codeblock.
	this.matchRegExp = /[ ]\^(\S+)$|^\^(\S+)$/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// will be one of following case, another will be undefined
	var blockId = this.match[1];
	var blockBeforeId = this.match[2];
	// Parse tree nodes to return
	return [{
		type: "blockid",
		attributes: {
			id: {type: "string", value: blockId || blockBeforeId},
			// `true` means the block is before this node, in parent node's children list.
			// `false` means the block is this node's parent node.
			previousSibling: {type: "boolean", value: Boolean(blockBeforeId)},
		},
		children: []
	}];
};
