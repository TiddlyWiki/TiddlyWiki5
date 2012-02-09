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

var utils = require("./Utils.js");

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
	var output = [];
	if(this.tree instanceof Array) {
		this.compileSubTree(output,this.tree);
	} else {
		this.compileNode(output,this.tree);	
	}
	var r = output.join("");
	return {render: eval(r)};
};

// Compile a subtree of the parse tree to an array of fragments of JavaScript source code
JavaScriptParseTree.prototype.compileSubTree = function(output,tree) {
	for(var t=0; t<tree.length; t++) {
		if(t) {
			this.output.push(";\n");
		}
		this.compileNode(output,tree[t]);
	}
};

/*
Compile a JavaScript node to an array of fragments of JavaScript source code

The code currently inserts some unneeded parenthesis because it doesn't look
at the binding order of operators to determine if they are needed.
*/
JavaScriptParseTree.prototype.compileNode = function(output,node) {
	var p;
	switch(node.type) {
		case "StringLiteral":
			output.push('"' + utils.stringify(node.value) + '"');
			break;
		case "StringLiterals":
			output.push('"' + utils.stringify(node.value.join("")) + '"');
			break;
		case "FunctionCall":
			output.push("(");
			this.compileNode(output,node.name);
			output.push(")(");
			for(p=0; p<node["arguments"].length; p++) {
				if(p) {
					output.push(",");
				}
				this.compileNode(output,node["arguments"][p]);
			}
			output.push(")");
			break;
		case "PropertyAccess":
			this.compileNode(output,node.base);
			if(typeof node.name === "string") {
				output.push("." + node.name);
			} else {
				output.push("[");
				this.compileNode(output,node.name);
				output.push("]");	
			}
			break;
		case "ArrayLiteral":
			output.push("[");
			for(p=0; p<node.elements.length; p++) {
				if(p) {
					output.push(",");
				}
				this.compileNode(output,node.elements[p]);
			}
			output.push("]");
			break;
		case "Variable":
			output.push(node.name);
			break;
		case "ObjectLiteral":
			output.push("{");
			for(p=0; p<node.properties.length; p++) {
				if(p) {
					output.push(",");
				}
				this.compileNode(output,node.properties[p]);
			}
			output.push("}");
			break;
		case "PropertyAssignment":
			output.push("'");
			output.push(node.name);
			output.push("':");
			this.compileNode(output,node.value);
			break;
		case "BinaryExpression":
			output.push("(");
			this.compileNode(output,node.left);
			output.push(")");
			output.push(node.operator);
			output.push("(");
			this.compileNode(output,node.right);
			output.push(")");
			break;
		case "NumericLiteral":
			output.push(node.value);
			break;
		case "Function":
			output.push("(function ");
			if(node.name !== null) {
				output.push(node.name);
			}
			output.push("(");
			output.push(node.params.join(","));
			output.push("){");
			this.compileSubTree(output,node.elements);
			output.push("})");
			break;
		case "ReturnStatement":
			output.push("return ");
			this.compileNode(output,node.value);
			break;
		case "This":
			output.push("this");
			break;
		default:
			console.log(node);
			throw "Unknown JavaScript node type: " + node.type;
			//break;
	}
};

exports.JavaScriptParseTree = JavaScriptParseTree;

})();
