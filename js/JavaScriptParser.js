/*\
title: js/JavaScriptParser.js

Parses JavaScript source code into a parse tree using Esprima

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("./Renderer.js").Renderer,
    Dependencies = require("./Dependencies.js").Dependencies,
    esprima = require("esprima");

// Initialise the parser
var JavaScriptParser = function(options) {
    this.store = options.store;
};

// Parse a string of JavaScript code and return the parse tree as a wikitext parse tree
JavaScriptParser.prototype.parse = function(type,code) {
	// Simplisticly replace tabs with spaces. Browsers will happily render tabs but most default to 8 character tab stops
	code = code.replace(/\t/mg,"    ");
	// Try to parse the code
	var parseTree;
	try {
		parseTree = esprima.parse(code,{comment: true,tokens: true,range: true});
	} catch(ex) {
		// Return a helpful error if the parse failed
		return new Renderer([
			Renderer.ElementNode("pre",{"class": "javascript-source"},[
				Renderer.TextNode(code.substring(0,ex.index)),
				Renderer.ErrorNode(ex),
				Renderer.TextNode(code.substring(ex.index))
			])
		],new Dependencies(),this.store);
	}
	// Helpers to render the comments and tokens with the appropriate classes
	var self = this,
		result = [],
		nextComment = 0,
		nextToken = 0,
		currPos = 0;
	var renderWhitespace = function(nextPos) {
			if(currPos < nextPos) {
				result.push(Renderer.TextNode(code.substring(currPos,nextPos)));
			}
		},
		renderComment = function(comment) {
			var text = comment.value,
				element,
				classes = ["javascript-comment"],
				content = [];
			renderWhitespace(comment.range[0]);
			if(comment.type === "Block") {
				element = "div";
				classes.push("javascript-block-comment");
				content.push(Renderer.TextNode("/*"));
			} else {
				element = "span";
				classes.push("javascript-line-comment");
				content.push(Renderer.TextNode("//"));
			}
			content.push.apply(content,self.store.parseText("text/x-tiddlywiki",text).nodes);
			if(comment.type === "Block") {
				content.push(Renderer.TextNode("*/"));
			} else {
				content.push(Renderer.TextNode("\n"));
			}
			result.push(Renderer.ElementNode(element,{"class": classes},content));
			currPos = comment.range[1] + 1;
		},
		renderToken = function(token) {
			renderWhitespace(token.range[0]);
			result.push(Renderer.ElementNode("span",{
				"class": "javascript-" + token.type.toLowerCase()
			},[
				Renderer.TextNode(token.value)
			]));
			currPos = token.range[1] + 1;
		};
	// Process the tokens interleaved with the comments
	while(nextComment < parseTree.comments.length || nextToken < parseTree.tokens.length) {
		if(nextComment < parseTree.comments.length && nextToken < parseTree.tokens.length) {
			if(parseTree.comments[nextComment].range[0] < parseTree.tokens[nextToken].range[0]) {
				renderComment(parseTree.comments[nextComment++]);
			} else {
				renderToken(parseTree.tokens[nextToken++]);
			}
		} else if(nextComment < parseTree.comments.length) {
			renderComment(parseTree.comments[nextComment++]);
		} else {
			renderToken(parseTree.tokens[nextToken++]);
		}
	}
	renderWhitespace(code.length);
	// Wrap the whole lot in a `<PRE>`
	return new Renderer([
			Renderer.ElementNode("pre",{"class": "javascript-source"},result)
		],new Dependencies(),this.store);
};

exports.JavaScriptParser = JavaScriptParser;

})();
