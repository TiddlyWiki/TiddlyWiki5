/*\
title: $:/core/modules/parsers/htmlparser.js
type: application/javascript
module-type: parser

The HTML parser displays text as raw HTML

\*/

"use strict";

var HtmlParser = function(type,text,options) {
	var src;
	if(options._canonical_uri) {
		src = options._canonical_uri;
	} else if(text) {
		src = "data:text/html;charset=utf-8," + encodeURIComponent(text);
	}
	this.tree = [{
		type: "element",
		tag: "iframe",
		attributes: {
			src: {type: "string", value: src}
		}
	}];
	if($tw.wiki.getTiddlerText("$:/config/HtmlParser/DisableSandbox","no") !== "yes") {
		this.tree[0].attributes.sandbox = {type: "string", value: $tw.wiki.getTiddlerText("$:/config/HtmlParser/SandboxTokens","")};
	}
	this.source = text;
	this.type = type;
};

exports["text/html"] = HtmlParser;
