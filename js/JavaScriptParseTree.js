/*\
title: js/JavaScriptParseTree.js

This object stores a JavaScript parse tree in the format produced by the pegjs JavaScript parser.

The parse tree represents the syntactical structure of a JavaScript program, represented as a tree
structure built from JavaScript arrays and objects. The nodes of the tree are objects with a "type"
field that indicates the type of the node (see the function renderNode() for a list of the types).
Depending on the type, other fields provide further details about the node.

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js");

// Create a new JavaScript tree object
var JavaScriptParseTree = function(tree) {
	this.tree = tree;
};

// Render the entire JavaScript tree object to JavaScript source code
JavaScriptParseTree.prototype.render = function() {
	this.output = [];
	this.renderSubTree(this.tree);
	return this.output.join("");
};

// Render a subtree of the parse tree to an array of fragments of JavaScript source code
JavaScriptParseTree.prototype.renderSubTree = function(tree) {
	for(var t=0; t<tree.length; t++) {
		if(t) {
			this.output.push(";\n");
		}
		this.renderNode(tree[t]);
	}
};

// Compile a JavaScript node to an array of fragments of JavaScript source code
JavaScriptParseTree.prototype.renderNode = function(node) {
	var p;
	switch(node.type) {
		case "StringLiteral":
			this.output.push(utils.stringify(node.value));
			break;
		case "StringLiterals":
			this.output.push(utils.stringify(node.value.join("")));
			break;
		case "FunctionCall":
			this.output.push("(");
			this.renderNode(node.name);
			this.output.push(")(");
			for(p=0; p<node["arguments"].length; p++) {
				if(p) {
					this.output.push(",");
				}
				this.renderNode(node["arguments"][p]);
			}
			this.output.push(")");
			break;
		case "PropertyAccess":
			this.renderNode(node.base);
			if(typeof node.name === "string") {
				this.output.push("." + node.name);
			} else {
				this.output.push("[");
				this.renderNode(node.name);
				this.output.push("]");	
			}
			break;
		case "ArrayLiteral":
			this.output.push("[");
			for(p=0; p<node.elements.length; p++) {
				if(p) {
					this.output.push(",");
				}
				this.renderNode(node.elements[p]);
			}
			this.output.push("]");
			break;
		case "Variable":
			this.output.push(node.name);
			break;
		case "ObjectLiteral":
			this.output.push("{");
			for(p=0; p<node.properties.length; p++) {
				if(p) {
					this.output.push(",");
				}
				this.renderNode(node.properties[p]);
			}
			this.output.push("}");
			break;
		case "PropertyAssignment":
			this.output.push(node.name);
			this.output.push(":");
			this.renderNode(node.value);
			break;
		case "BinaryExpression":
			this.output.push("(");
			this.renderNode(node.left);
			this.output.push(")");
			this.output.push(node.operator);
			this.output.push("(");
			this.renderNode(node.right);
			this.output.push(")");
			break;
		case "NumericLiteral":
			this.output.push(node.value);
			break;
		case "Function":
			this.output.push("(function ");
			if(node.name !== null) {
				this.output.push(node.name);
			}
			this.output.push("(");
			this.output.push(node.params.join(","));
			this.output.push("){");
			this.renderSubTree(node.elements);
			this.output.push("})");
			break;
		case "ReturnStatement":
			this.output.push("return ");
			this.renderNode(node.value);
			break;
		case "This":
			this.output.push("this");
			break;
		default:
			console.log(node);
			throw "Unknown JavaScript node type: " + node.type;
			//break;
	}
};

exports.JavaScriptParseTree = JavaScriptParseTree;

})();
