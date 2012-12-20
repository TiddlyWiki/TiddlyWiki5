/*\
title: $:/core/modules/utils/parsetree.js
type: application/javascript
module-type: utils

Parse tree utility functions.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.addAttributeToParseTreeNode = function(node,name,value) {
	if(node.type === "element") {
		node.attributes = node.attributes || {};
		node.attributes[name] = {type: "string", value: value};
	}
};

exports.addClassToParseTreeNode = function(node,classString) {
	if(node.type === "element") {
		node.attributes = node.attributes || {};
		node.attributes["class"] = node.attributes["class"] || {type: "string", value: ""};
		if(node.attributes["class"].type === "string") {
			node.attributes["class"].value += " " + classString;
		}
	}
};

exports.addStyleToParseTreeNode = function(node,name,value) {
	if(node.type === "element") {
		node.attributes = node.attributes || {};
		node.attributes["style"] = node.attributes["style"] || {type: "string", value: ""};
		if(node.attributes["style"].type === "string") {
			node.attributes["style"].value += name + ":" + value + ";";
		}
	}
};

})();
