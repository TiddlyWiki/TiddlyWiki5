/*\
title: js/JavaScriptParser.js

Parses JavaScript source code into a parse tree using PEGJS

\*/
(function(){

/*jslint node: true */
"use strict";

var WikiTextParseTree = require("./WikiTextParseTree.js").WikiTextParseTree,
    Renderer = require("./Renderer.js").Renderer,
    Dependencies = require("./Dependencies.js").Dependencies,
    esprima = require("esprima");

// Initialise the parser
var JavaScriptParser = function(options) {
    this.store = options.store;
};

// Parse a string of JavaScript code or JSON and return the parse tree as a wikitext parse tree
JavaScriptParser.prototype.parse = function(type,code) {
	// Get the parse tree
	var parseTree = esprima.parse(code,{
			tokens: true,
			range: true
		}),
		result = [],
		t,endLastToken = 0;
	for(t=0; t<parseTree.tokens.length; t++) {
		var token = parseTree.tokens[t];
		if(token.range[0] > endLastToken) {
			result.push(Renderer.TextNode(code.substring(endLastToken,token.range[0])));
		}
		result.push(Renderer.ElementNode("span",{
			"class": "javascript-" + token.type.toLowerCase()
		},[
			Renderer.TextNode(token.value)
		]));
		endLastToken = token.range[1] + 1;
	}
	if(endLastToken < code.length) {
		result.push(Renderer.TextNode(code.substring(endLastToken)));
	}
	return new WikiTextParseTree([
			Renderer.ElementNode("pre",{"class": "javascript-source"},result)
		],new Dependencies(),this.store);
};

exports.JavaScriptParser = JavaScriptParser;

})();
