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

var renderObject = function(obj) {
    var children = [],t;
    if(obj instanceof Array) {
        for(t=0; t<obj.length; t++) {
            children.push(Renderer.ElementNode("li",{
                "class": ["jsonArrayMember"]
            },[renderObject(obj[t])]));
        }
        return Renderer.ElementNode("ul",{
            "class": ["jsonArray"]
        },children);
    } else if(typeof obj === "object") {
        for(t in obj) {
            children.push(Renderer.ElementNode("li",{
                "class": ["jsonObjectMember"]
            },[Renderer.SplitLabelNode("JSON",[Renderer.TextNode(t)],[renderObject(obj[t])])]));
        }
        return Renderer.ElementNode("ul",{
            "class": ["jsonObject"]
        },children);
    } else {
        return Renderer.LabelNode("JSON" + (typeof obj),[Renderer.TextNode(JSON.stringify(obj))],["jsonValue"]);
    }
};

// Initialise the parser
var JavaScriptParser = function(options) {
    this.store = options.store;
};

// Parse a string of JavaScript code and return the parse tree as a wikitext parse tree
JavaScriptParser.prototype.parse = function(type,code) {
	if(type === "application/json") {
		code = "(" + code + ")";
	}
	return new WikiTextParseTree([
		renderObject(esprima.parse(code))
	],new Dependencies(),this.store);
};

exports.JavaScriptParser = JavaScriptParser;

})();
