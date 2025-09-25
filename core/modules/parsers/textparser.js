/*\
title: $:/core/modules/parsers/textparser.js
type: application/javascript
module-type: parser

The plain text parser processes blocks of source text into a degenerate parse tree consisting of a single text node

\*/

"use strict";

var TextParser = function(type,text,options) {
	this.tree = [{
		type: "genesis",
		attributes: {
			$type: {name: "$type", type: "string", value: "$codeblock"},
			code: {name: "code", type: "string", value: text},
			language: {name: "language", type: "string", value: type},
			$remappable: {name: "$remappable", type:"string", value: "no"}
		}
	}];
	this.source = text;
	this.type = type;
};

exports["text/plain"] = TextParser;
exports["text/x-tiddlywiki"] = TextParser;
exports["application/javascript"] = TextParser;
exports["application/json"] = TextParser;
exports["text/css"] = TextParser;
exports["application/x-tiddler-dictionary"] = TextParser;
