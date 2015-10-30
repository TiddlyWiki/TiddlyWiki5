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
	node.attributes = node.attributes || {};
	node.attributes[name] = {type: "string", value: value};
};

exports.getAttributeValueFromParseTreeNode = function(node,name,defaultValue) {
	if(node.attributes && node.attributes[name] && node.attributes[name].value !== undefined) {
		return node.attributes[name].value;
	}
	return defaultValue;
};

exports.addClassToParseTreeNode = function(node,classString) {
	var classes = [];
	node.attributes = node.attributes || {};
	node.attributes["class"] = node.attributes["class"] || {type: "string", value: ""};
	if(node.attributes["class"].type === "string") {
		if(node.attributes["class"].value !== "") {
			classes = node.attributes["class"].value.split(" ");
		}
		if(classString !== "") {
			$tw.utils.pushTop(classes,classString.split(" "));
		}
		node.attributes["class"].value = classes.join(" ");
	}
};

exports.addStyleToParseTreeNode = function(node,name,value) {
		node.attributes = node.attributes || {};
		node.attributes.style = node.attributes.style || {type: "string", value: ""};
		if(node.attributes.style.type === "string") {
			node.attributes.style.value += name + ":" + value + ";";
		}
};

exports.findParseTreeNode = function(nodeArray,search) {
	for(var t=0; t<nodeArray.length; t++) {
		if(nodeArray[t].type === search.type && nodeArray[t].tag === search.tag) {
			return nodeArray[t];
		}
	}
	return undefined;
};

/*
Helper to get the text of a parse tree node or array of nodes
*/
exports.getParseTreeText = function getParseTreeText(tree) {
	var output = [];
	if($tw.utils.isArray(tree)) {
		$tw.utils.each(tree,function(node) {
			output.push(getParseTreeText(node));
		});
	} else {
		if(tree.type === "text") {
			output.push(tree.text);
		}
		if(tree.children) {
			return getParseTreeText(tree.children);
		}
	}
	return output.join("");
};

})();
