/*\
title: js/JavaScriptParser.js

JavaScript processing

\*/
(function(){

/*jslint node: true */
"use strict";

var JavaScriptParseTree = require("./JavaScriptParseTree.js").JavaScriptParseTree,
	pegjs = require("pegjs");

var JavaScriptParser = function(parserText) {
	this.parser = pegjs.buildParser(parserText);
};

JavaScriptParser.prototype.parse = function(code) {
	return new JavaScriptParseTree(this.parser.parse(code),this);
};

JavaScriptParser.prototype.createTree = function(tree) {
	return new JavaScriptParseTree(tree,this);
};

exports.JavaScriptParser = JavaScriptParser;

})();
