/*\
title: $:/core/modules/parsers/htmlfragmentparser.js
type: application/javascript
module-type: parser

Inherits from the base wikitext parser but is forced into inline mode

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var WikiParser = require("$:/core/modules/parsers/wikiparser/wikiparser.js")["text/vnd.tiddlywiki"];

var PRAGMAS = "\\rules only html entity\n";

var HtmlFragmentWikiParser = function(type,text,options) {
	var parser = new WikiParser(type,PRAGMAS + text,$tw.utils.extend({},options,{parseAsInline: true}));
	this.tree = parser.tree;
	this.prototype = parser.prototype;
};

exports["text/html+fragment"] = HtmlFragmentWikiParser;

})();

