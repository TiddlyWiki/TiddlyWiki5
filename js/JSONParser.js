/*\
title: js/JSONParser.js

Compiles JSON objects into JavaScript functions that render them in HTML and plain text

\*/
(function(){

/*jslint node: true */
"use strict";

var WikiTextParseTree = require("./WikiTextParseTree.js").WikiTextParseTree,
    Renderer = require("./Renderer.js").Renderer,
    utils = require("./Utils.js");

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

var JSONParser = function(options) {
    this.store = options.store;
};

JSONParser.prototype.parse = function(type,text) {
	return new WikiTextParseTree([renderObject(JSON.parse(text))],{},this.store);
};

exports.JSONParser = JSONParser;

})();
