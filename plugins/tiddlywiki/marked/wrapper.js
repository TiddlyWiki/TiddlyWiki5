/*\
title: $:/plugins/tiddlywiki/marked/wrapper.js
type: application/javascript
module-type: parser

Wraps up the marked parser for use in TiddlyWiki5

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var marked = require("$:/plugins/tiddlywiki/marked/marked.js");


function transformNodes(nodes) {
	var results = [];
	var widget = {type: "raw", html: marked.parser(nodes)};
	return [widget];
}

var MarkdownParser = function(type,text,options) {
	var markdownTree = marked.lexer(text);
	this.tree = transformNodes(markdownTree);
};

/*

[ 'html',
  [ 'p', 'something' ],
  [ 'h1',
    'heading and ',
    [ 'strong', 'other' ] ] ]

*/

exports["text/x-markdown"] = MarkdownParser;

})();

