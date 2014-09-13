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

var CONFIG_DIALECT_TIDDLER = "$:/config/markdown/dialect",
	DEFAULT_DIALECT = "Gruber";

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
		// Massage images into the image widget
		if(widget.tag === "img") {
			widget.type = "image";
			if(widget.attributes.alt) {
				widget.attributes.tooltip = widget.attributes.alt;
				delete widget.attributes.alt;
			}
			if(widget.attributes.src) {
				widget.attributes.source = widget.attributes.src;
				delete widget.attributes.src;
			}
		}
		return widget;
	} else {
		return {type: "text", text: node};
	}
}

var MarkdownParser = function(type,text,options) {
	var dialect = options.wiki.getTiddlerText(CONFIG_DIALECT_TIDDLER,DEFAULT_DIALECT),
		markdownTree = markdown.toHTMLTree(text,dialect);
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

