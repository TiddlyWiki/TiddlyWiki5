/*\
title: $:/plugins/tiddlywiki/railroad/typed-parser.js
type: application/javascript
module-type: parser

This parser wraps unadorned railroad syntax into a railroad widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var RailroadParser = function(type,text,options) {
	var element = {
			type: "railroad",
			tag: "$railroad",
			text: text
		};
	this.tree = [element];
console.log(text);
};

exports["text/vnd.tiddlywiki.railroad"] = RailroadParser;

})();

