/*\
title: js/JavaScriptParser.js

Parses JavaScript source code into a parse tree using PEGJS

\*/
(function(){

/*jslint node: true */
"use strict";

var JavaScriptParseTree = require("./JavaScriptParseTree.js").JavaScriptParseTree,
	pegjs = require("pegjs");

// Initialise the parser
var JavaScriptParser = function(parserText) {
	this.parser = pegjs.buildParser(parserText);
};

// Parse a string of JavaScript code and return the parse tree
JavaScriptParser.prototype.parse = function(code) {
	return new JavaScriptParseTree(this.parser.parse(code),this);
};

// Create a parse tree object from a raw tree
JavaScriptParser.prototype.createTree = function(tree) {
	return new JavaScriptParseTree(tree);
};

exports.JavaScriptParser = JavaScriptParser;

})();
