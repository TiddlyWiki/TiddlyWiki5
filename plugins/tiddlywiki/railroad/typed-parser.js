/*\
title: $:/plugins/tiddlywiki/railroad/typed-parser.js
type: application/javascript
module-type: parser

This parser wraps unadorned railroad syntax into a railroad widget

\*/

"use strict";

const RailroadParser = function(type,text,options) {
	const element = {
		type: "railroad",
		tag: "$railroad",
		text
	};
	this.tree = [element];
	console.log(text);
};

exports["text/vnd.tiddlywiki.railroad"] = RailroadParser;
