/*\
title: $:/core/modules/parsers/jsonparser.js
type: application/javascript
module-type: parser

Parses a JSON object into a parse tree

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var renderObject = function(obj) {
    var children = [],t;
    if($tw.utils.isArray(obj)) {
        for(t=0; t<obj.length; t++) {
            children.push($tw.Tree.Element("li",{
                "class": ["jsonArrayMember"]
            },[renderObject(obj[t])]));
        }
        return $tw.Tree.Element("ul",{
            "class": ["jsonArray"]
        },children);
    } else if(typeof obj === "object") {
        for(t in obj) {
            children.push($tw.Tree.Element("li",{
                "class": ["jsonObjectMember"]
            },[$tw.Tree.splitLabelNode("JSON",[$tw.Tree.Text(t)],[renderObject(obj[t])])]));
        }
        return $tw.Tree.Element("ul",{
            "class": ["jsonObject"]
        },children);
    } else {
        return $tw.Tree.labelNode("JSON" + (typeof obj),[$tw.Tree.Text(JSON.stringify(obj))],["jsonValue"]);
    }
};

var JSONParser = function(options) {
    this.wiki = options.wiki;
};

JSONParser.prototype.parse = function(type,text) {
	return new $tw.Renderer([renderObject(JSON.parse(text))],new $tw.Dependencies());
};

exports["application/json"] = JSONParser;

})();
