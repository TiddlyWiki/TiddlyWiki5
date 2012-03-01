/*\
title: js/JavaScriptParser.js

Parses JavaScript source code into a parse tree using PEGJS

\*/
(function(){

/*jslint node: true */
"use strict";

var JavaScriptParseTree = require("./JavaScriptParseTree.js").JavaScriptParseTree,
	esprima = require("esprima");

// Initialise the parser
var JavaScriptParser = function() {
};

// Parse a string of JavaScript code and return the parse tree
JavaScriptParser.prototype.parse = function(code) {
	return new JavaScriptParseTree(esprima.parse(code));
};

// Create a parse tree object from a raw tree
JavaScriptParser.prototype.createTree = function(tree) {
	return new JavaScriptParseTree(tree);
};

exports.JavaScriptParser = JavaScriptParser;

})();
