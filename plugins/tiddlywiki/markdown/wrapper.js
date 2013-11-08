/*\
title: $:/plugins/tiddlywiki/markdown/wrapper.js
type: application/javascript
module-type: parser

Wraps up the markdown-js parser for use in TiddlyWiki5

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var markdown = require("$:/plugins/tiddlywiki/markdown/markdown.js");

function transformNodes(nodes) {
	var results = [];
	for(var index=0; index<nodes.length; index++) {
		results.push(transformNode(nodes[index]));
	}
	return results;
}

function transformNode(node) {
	if($tw.utils.isArray(node)) {
		var p = 0,
			widget = {type: "element", tag: node[p++]};
		if(!$tw.utils.isArray(node[p]) && typeof(node[p]) === "object") {
			widget.attributes = {};
			$tw.utils.each(node[p++],function(value,name) {
				widget.attributes[name] = {type: "string", value: value};
			});
		}
		widget.children = transformNodes(node.slice(p++));
		return widget;
	} else {
		return {type: "text", text: node};
	}
}

var MarkdownParser = function(type,text,options) {
	var markdownTree = markdown.toHTMLTree(text);
	this.tree = transformNodes(markdownTree.slice(1));
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

