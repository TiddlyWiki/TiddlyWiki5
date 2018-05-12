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


const brushes = ["apache", "bash", "coffeescript", "cpp", "cs", "css", "diff", "http", "ini", "java", "javascript", "json", "makefile", "markdown", "nginx", "objectivec", "perl", "php", "python", "ruby", "sql", "xml"]
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
		// Respect code sections
		if(widget.tag === "code") {
                        console.log(node);
                        if (node[1].indexOf("\n") > 0) {
                                // Multi line
                                // Beware of empty lines! :-(
                                // Let's keep track of an eventual fix at:
                                // https://github.com/evilstreak/markdown-js/issues/292
                                var lines = node[1].split("\n");
                                var language = lines[0];
                                if (brushes.indexOf(language) > 0) {
                                    var code = lines.slice(1).join("\n");
                                }
                                else {
                                    var code = lines.join("\n");
                                    language = "";
                                }
                                widget.type = "codeblock";
                                widget.attributes = {
                                                code: {type: "string", value: code},
                                                language: {type: "string", value: language}
                                }
                                delete widget.children;
                                delete widget.tag;
                        }
                        else {
                                widget.children = [{type: "text", text: node[1]}];
                        }
		}
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
		// Convert internal links to proper wikilinks
		if (widget.tag === "a" && widget.attributes.href.value[0] === "#") {
			widget.type = "link";
			widget.attributes.to = widget.attributes.href;
			if (widget.attributes.to.type === "string") {
				//Remove '#' before conversion to wikilink
				widget.attributes.to.value = widget.attributes.to.value.substr(1);
			}
			//Children is fine
			delete widget.tag;
			delete widget.attributes.href;
		}
		return widget;
	} else {
		return {type: "raw", html: node};
	}
}

var MarkdownParser = function(type,text,options) {
	var dialect = options.wiki.getTiddlerText(CONFIG_DIALECT_TIDDLER,DEFAULT_DIALECT),
		markdownTree = markdown.toHTMLTree(text,dialect),
		node = $tw.utils.isArray(markdownTree[1]) ? markdownTree.slice(1) : markdownTree.slice(2);
	this.tree = transformNodes(node);
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

