/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/registry.js
type: application/javascript
module-type: library
\*/

"use strict";

const element = require("$:/plugins/tiddlywiki/prosemirror/ast/to/element.js");
const text = require("$:/plugins/tiddlywiki/prosemirror/ast/to/text.js");
const codeblock = require("$:/plugins/tiddlywiki/prosemirror/ast/to/codeblock.js");
const image = require("$:/plugins/tiddlywiki/prosemirror/ast/to/image.js");
const transclude = require("$:/plugins/tiddlywiki/prosemirror/ast/to/transclude.js");
const link = require("$:/plugins/tiddlywiki/prosemirror/ast/to/link.js");
const entity = require("$:/plugins/tiddlywiki/prosemirror/ast/to/entity.js");
const pragma = require("$:/plugins/tiddlywiki/prosemirror/ast/to/pragma.js");

module.exports = {
	element: element,
	text: text,
	codeblock: codeblock,
	image: image,
	transclude: transclude,
	link: link.buildLink,
	entity: entity,
	set: pragma.pragmaNode,
	importvariables: pragma.pragmaNode,
	parameters: pragma.pragmaNode,
	void: pragma.voidNode
};
