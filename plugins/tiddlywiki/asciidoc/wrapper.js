/*\
title: $:/plugins/tiddlywiki/asciidoc/wrapper.js
type: application/javascript
module-type: parser

Wraps up the asciidoctor-all.js parser for use in TiddlyWiki5

\*/

(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	var lib = "$:/plugins/tiddlywiki/asciidoc/files/asciidoctor-all.js";
	var code = $tw.wiki.getTiddler(lib).fields.text;
	if (typeof window != 'undefined') {
		window.eval(code);
	}

var AsciidocParser = function(type,text) {
	var WikiParser = require("$:/core/modules/parsers/wikiparser/wikiparser.js")["text/vnd.tiddlywiki"];
	this.tree = new WikiParser(null, Opal.Asciidoctor.$render(text), {}).tree;
	console.log(this.tree);
};

exports["text/x-asciidoc"] = AsciidocParser;

})();

