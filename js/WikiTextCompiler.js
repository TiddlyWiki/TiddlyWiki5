/*\
title: js/WikiTextCompiler.js

\*/
(function(){

/*jslint node: true */
"use strict";

var ArgParser = require("./ArgParser.js").ArgParser,
	JavaScriptParseTree = require("./JavaScriptParseTree.js").JavaScriptParseTree,
	utils = require("./Utils.js"),
	util = require("util");

var WikiTextCompiler = function(store,title,parser) {
	this.parser = parser;
	this.store = store;
	this.title = title;
};

WikiTextCompiler.prototype.compile = function(type,treenode) {
	this.output = [];
	if(type === "text/html") {
		this.compileSubTreeHtml(treenode);
	} else if(type === "text/plain") {
		this.compileSubTreePlain(treenode);
	} else {
		return null;
	}
	// And then wrap the javascript tree and render it back into JavaScript code
	var parseTree = this.store.jsParser.createTree(
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
								elements: this.output
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
		]);
	return parseTree.render();
};

WikiTextCompiler.prototype.pushString = function(s) {
	var last = this.output[this.output.length-1];
	if(this.output.length > 0 && last.type === "StringLiterals") {
		last.value.push(s);
	} else if (this.output.length > 0 && last.type === "StringLiteral") {
		last.type = "StringLiterals";
		last.value = [last.value,s];
	} else {
		this.output.push({type: "StringLiteral", value: s});
	}
};

WikiTextCompiler.prototype.compileMacroCall = function(type,name,params) {
	var me = this,
		macro = this.store.macros[name];
	if(macro) {
		var args = new ArgParser(params,{defaultName: "anon"}),
			paramsProps = {};
		var insertParam = function(name,arg) {
			if(arg.evaluated) {
				paramsProps[name] = me.store.jsParser.parse(arg.string).tree.elements[0];
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
		macroCall.name.elements = macro.code[type].tree.elements;
		for(m in paramsProps) {
			macroCall["arguments"][0].properties.push({
				type: "PropertyAssignment",
				name: m,
				value: paramsProps[m]
			});
		}
		this.output.push(macroCall);
	} else {
		this.pushString("<span class='error errorUnknownMacro'>Unknown macro '" + name + "'</span>");
	}
};

WikiTextCompiler.prototype.compileElementHtml = function(element, options) {
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
	this.pushString("<" + tagBits.join(" ") + (options.selfClosing ? " /" : ""));
	if(options.insertAfterAttributes) {
		this.pushString(" ");
		this.output.push(options.insertAfterAttributes);
	}
	this.pushString(">");
	if(!options.selfClosing) {
		if(element.children) {
			this.compileSubTreeHtml(element.children);
		}
		this.pushString("</" + element.type + ">");
	}
};

WikiTextCompiler.prototype.compileSubTreeHtml = function(tree) {
	for(var t=0; t<tree.length; t++) {
		switch(tree[t].type) {
			case "text":
				this.pushString(utils.htmlEncode(tree[t].value));
				break;
			case "entity":
				this.pushString(tree[t].value);
				break;
			case "br":
			case "img":
				this.compileElementHtml(tree[t],{selfClosing: true}); // Self closing elements
				break;
			case "context":
				//compileSubTree(tree[t].children);
				break;
			case "macro":
				this.compileMacroCall("text/html",tree[t].name,tree[t].params);
				break;
			case "a":
				this.compileElementHtml(tree[t],{
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
				this.compileElementHtml(tree[t]);
				break;
		}
	}
};

WikiTextCompiler.prototype.compileElementPlain = function(element, options) {
	options = options || {};
	if(!options.selfClosing) {
		if(element.children) {
			this.compileSubTreePlain(element.children);
		}
	}
};

WikiTextCompiler.prototype.compileSubTreePlain = function(tree) {
	for(var t=0; t<tree.length; t++) {
		switch(tree[t].type) {
			case "text":
				this.pushString(utils.htmlEncode(tree[t].value));
				break;
			case "entity":
				this.pushString(tree[t].value);
				break;
			case "br":
			case "img":
				this.compileElementPlain(tree[t],{selfClosing: true}); // Self closing elements
				break;
			case "context":
				//compileSubTree(tree[t].children);
				break;
			case "macro":
				this.compileMacroCall("text/plain",tree[t].name,tree[t].params);
				break;
			default:
				this.compileElementPlain(tree[t]);
				break;
		}
	}
};

exports.WikiTextCompiler = WikiTextCompiler;

})();
