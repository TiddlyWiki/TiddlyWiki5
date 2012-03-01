/*\
title: js/JavaScriptParseTree.js

This object stores a JavaScript parse tree in the format produced by the pegjs JavaScript parser.

The parse tree represents the syntactical structure of a JavaScript program, represented as a tree
structure built from JavaScript arrays and objects. The nodes of the tree are objects with a "type"
field that indicates the type of the node (see the function compileNode() for a list of the types).
Depending on the type, other fields provide further details about the node.

The pegjs parser uses "StringLiteral" nodes to represent individual string literals. TiddlyWiki adds
support for nodes of type "StringLiterals" that represent a contiguous sequence of string constants.
This simplifies coalescing adjacent constants into a single string.

\*/
(function(){

/*jslint node: true */
"use strict";

var esprima = require("esprima"),
	utils = require("./Utils.js");

// Create a new JavaScript tree object
var JavaScriptParseTree = function(tree) {
	this.tree = tree;
};

JavaScriptParseTree.prototype.compile = function(targetType) {
	if(targetType === "application/javascript") {
		return this.compileJS();
	} else if(targetType === "text/html") {
		return {render: this.toString};
	} else {
		return null;
	}
};

JavaScriptParseTree.prototype.toString = function() {
	return JSON.stringify(this.tree);	
};

// Compile the entire JavaScript tree object to a renderer object
JavaScriptParseTree.prototype.compileJS = function() {
	/*jslint evil: true */
	return {render: eval(esprima.generate(this.tree))};
};

exports.JavaScriptParseTree = JavaScriptParseTree;

})();
