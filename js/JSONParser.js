/*\
title: js/JSONParser.js

Compiles JSON objects into JavaScript functions that render them in HTML and plain text

\*/
(function(){

/*jslint node: true */
"use strict";

var WikiTextParseTree = require("./WikiTextParseTree.js").WikiTextParseTree,
    HTML = require("./HTML.js").HTML,
    utils = require("./Utils.js");

var renderObject = function(obj) {
    var children = [],t;
    if(obj instanceof Array) {
        for(t=0; t<obj.length; t++) {
            children.push(HTML.elem("li",{
                "class": ["jsonArrayMember"]
            },[renderObject(obj[t])]));
        }
        return HTML.elem("ul",{
            "class": ["jsonArray"]
        },children);
    } else if(typeof obj === "object") {
        for(t in obj) {
            children.push(HTML.elem("li",{
                "class": ["jsonObjectMember"]
            },[HTML.splitLabel("JSON",[HTML.text(t)],[renderObject(obj[t])])]));
        }
        return HTML.elem("ul",{
            "class": ["jsonObject"]
        },children);
    } else {
        return HTML.label("JSON" + (typeof obj),[HTML.text(JSON.stringify(obj))],["jsonValue"]);
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
