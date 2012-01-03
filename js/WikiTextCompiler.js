/*\
title: js/WikiTextCompiler.js

\*/
(function(){

/*jslint node: true */
"use strict";

var ArgParser = require("./ArgParser.js").ArgParser,
	utils = require("./Utils.js"),
	util = require("util");

var WikiTextCompiler = function(store,title,parser) {
	this.parser = parser;
	this.store = store;
	this.title = title;
};

WikiTextCompiler.prototype.compile = function(type,treenode) {
	if(type === "text/html") {
		return this.compileAsHtml(treenode);
	} else if(type === "text/plain") {
		return this.compileAsHtml(treenode);
	} else {
		return null;
	}
};

WikiTextCompiler.prototype.compileAsHtml = function(treenode) {
	var me = this,
		output = [],
		compileSubTree;
	var pushString = function(s) {
		var last = output[output.length-1];
		if(output.length > 0 && last.type === "StringLiterals") {
			last.value.push(s);
		} else if (output.length > 0 && last.type === "StringLiteral") {
			last.type = "StringLiterals";
			last.value = [last.value,s];
		} else {
			output.push({type: "StringLiteral", value: s});
		}
	};
	var compileElement = function(element, options) {
		options = options || {};
		var tagBits = [element.type];
		if(element.attributes) {
			for(var a in element.attributes) {
				var r = element.attributes[a];
				if(a === "style") {
					var s = [];
					for(var t in r) {
						s.push(t + ":" + r[t] + ";");
					}
					r = s.join("");
				}
				tagBits.push(a + "=\"" + utils.htmlEncode(r) + "\"");
			}
		}
		pushString("<" + tagBits.join(" ") + (options.selfClosing ? " /" : ""));
		if(options.insertAfterAttributes) {
			output.push(options.insertAfterAttributes);
		}
		pushString(">");
		if(!options.selfClosing) {
			if(element.children) {
				compileSubTree(element.children);
			}
			pushString("</" + element.type + ">");
		}
	};
	var compileMacroCall = function(name,params) {
		var macro = me.store.macros[name];
		if(macro) {
			var args = new ArgParser(params,{defaultName: "anon"}),
				paramsProps = {};
			var insertParam = function(name,arg) {
				if(arg.evaluated) {
					var prog = me.store.sandbox.parse(arg.string);
					paramsProps[name] = prog.elements[0];
				} else {
					paramsProps[name] = {type: "StringLiteral", value: arg.string};
				}
			};
			for(var m in macro.params) {
				var param = macro.params[m];
				if("byPos" in param && args.byPos[param.byPos]) {
					insertParam(m,args.byPos[param.byPos].v);
				} else if("byName" in param) {
					var arg = args.getValueByName(m);
					if(!arg && param.byName === "default") {
						arg = args.getValueByName("anon");
					}
					if(arg) {
						insertParam(m,arg);
					}
				}
			}
			var macroCall = {
				type: "FunctionCall",
				name: {
					type: "Function",
					name: null,
					params: ["params"],
					elements: []},
				"arguments": [ {
					type: "ObjectLiteral",
					properties: []	
				}]
			};
			macroCall.name.elements = macro.code["text/html"].elements;
			for(m in paramsProps) {
				macroCall["arguments"][0].properties.push({
					type: "PropertyAssignment",
					name: m,
					value: paramsProps[m]
				});
			}
			output.push(macroCall);
		} else {
			pushString("<span class='error errorUnknownMacro'>Unknown macro '" + name + "'</span>");
		}
	};
	compileSubTree = function(tree) {
		for(var t=0; t<tree.length; t++) {
			switch(tree[t].type) {
				case "text":
					pushString(utils.htmlEncode(tree[t].value));
					break;
				case "entity":
					pushString(tree[t].value);
					break;
				case "br":
				case "img":
					compileElement(tree[t],{selfClosing: true}); // Self closing elements
					break;
				case "context":
					//compileSubTree(tree[t].children);
					break;
				case "macro":
					compileMacroCall(tree[t].name,tree[t].params);
					break;
				case "a":
					compileElement(tree[t],{
						insertAfterAttributes: {
							"type": "FunctionCall",
							"name": {
								"type": "PropertyAccess",
								"base": {
									"type": "Variable",
									"name": "store"},
								"name": "classesForLink"},
							"arguments":[{
								"type": "StringLiteral",
								"value": tree[t].attributes.href}]}
					});
					break;
				default:
					compileElement(tree[t]);
					break;
			}
		}
	};
	// Compile the wiki parse tree into a javascript parse tree
	compileSubTree(treenode);
	// And then render the javascript parse tree back into JavaScript code
	return compileJavaScript(
		[
			{
				type: "Function",
				name: null,
				params: ["tiddler","store","utils"],
				elements: [
					{
					type: "ReturnStatement",
					value: {
						type: "FunctionCall",
						name: {
							type: "PropertyAccess",
							base: {
								type: "ArrayLiteral",
								elements: output
							},
							name: "join"
						},
						"arguments": [ {
							type: "StringLiteral",
							value: ""
							}
						]
						}
					}
				]
			}
		]
	).join("");
};

// Compile a javascript tree into an array of string fragments
var compileJavaScript = function(tree) {
	var output = [];
	var compileJavaScriptNode = function(node) {
		var p;
		switch(node.type) {
			case "StringLiteral":
				output.push(utils.stringify(node.value));
				break;
			case "StringLiterals":
				output.push(utils.stringify(node.value.join("")));
				break;
			case "FunctionCall":
				output.push("(");
				compileJavaScriptNode(node.name);
				output.push(")");
				output.push("(");
				for(p=0; p<node["arguments"].length; p++) {
					if(p) {
						output.push(",");
					}
					compileJavaScriptNode(node["arguments"][p]);
				}
				output.push(")");
				break;
			case "PropertyAccess":
				compileJavaScriptNode(node.base);
				if(typeof node.name === "string") {
					output.push("." + node.name);
				} else {
					output.push("[");
					compileJavaScriptNode(node.name);
					output.push("]");	
				}
				break;
			case "ArrayLiteral":
				output.push("[");
				for(p=0; p<node.elements.length; p++) {
					if(p) {
						output.push(",");
					}
					compileJavaScriptNode(node.elements[p]);
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
					compileJavaScriptNode(node.properties[p]);
				}
				output.push("}");
				break;
			case "PropertyAssignment":
				output.push(node.name);
				output.push(":");
				compileJavaScriptNode(node.value);
				break;
			case "BinaryExpression":
				output.push("(");
				compileJavaScriptNode(node.left);
				output.push(")");
				output.push(node.operator);
				output.push("(");
				compileJavaScriptNode(node.right);
				output.push(")");
				break;
			case "NumericLiteral":
				output.push(node.value);
				break;
			case "Function":
				output.push("(");
				output.push("function ");
				if(node.name !== null) {
					output.push(node.name);
				}
				output.push("(");
				output.push(node.params.join(","));
				output.push(")");
				output.push("{");
				compileJavaScriptTree(node.elements);
				output.push("}");
				output.push(")");
				break;
			case "ReturnStatement":
				output.push("return ");
				compileJavaScriptNode(node.value);
				break;
			case "This":
				output.push("this");
				break;
			default:
				console.log(node);
				throw "Unknown JavaScript node type: " + node.type;
				break;
		}
	};
	var compileJavaScriptTree = function(tree) {
		for(var t=0; t<tree.length; t++) {
			if(t) {
				output.push(";\n");
			}
			compileJavaScriptNode(tree[t]);
		}
	};
	compileJavaScriptTree(tree);
	return output;
};

exports.WikiTextCompiler = WikiTextCompiler;

})();
