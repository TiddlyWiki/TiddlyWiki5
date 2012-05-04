/*\
title: $:/core/modules/parsers/plaintextparser.js
type: application/javascript
module-type: parser

Renders plain text tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var PlainTextParser = function(options) {
    this.wiki = options.wiki;
};

PlainTextParser.prototype.parse = function(type,text) {
	return new $tw.Renderer([$tw.Tree.Element("pre",{},[$tw.Tree.Text(text)])],new $tw.Dependencies());
};

exports["text/plain"] = PlainTextParser;

})();