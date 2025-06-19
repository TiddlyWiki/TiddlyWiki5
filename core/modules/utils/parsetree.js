/*\
title: $:/core/modules/utils/parsetree.js
type: application/javascript
module-type: utils

Parse tree utility functions.

\*/

"use strict";

/*
Add attribute to parse tree node
Can be invoked as (node,name,value) or (node,attr)
*/
exports.addAttributeToParseTreeNode = function(node,name,value) {
	var attribute = typeof name === "object" ? name : {name: name, type: "string", value: value};
	name = attribute.name;
	node.attributes = node.attributes || {};
	node.orderedAttributes = node.orderedAttributes || [];
	node.attributes[name] = attribute;
	var foundIndex = -1;
	$tw.utils.each(node.orderedAttributes,function(attr,index) {
		if(attr.name === name) {
			foundIndex = index;
		}
	});
	if(foundIndex === -1) {
		node.orderedAttributes.push(attribute);
	} else {
		node.orderedAttributes[foundIndex] = attribute;
	}
};

exports.getOrderedAttributesFromParseTreeNode = function(node) {
	if(node.orderedAttributes) {
		return node.orderedAttributes;
	} else {
		var attributes = [];
		$tw.utils.each(node.attributes,function(attribute) {
			attributes.push(attribute);
		});
		return attributes.sort(function(a,b) {
			return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
		});
	}
};

exports.getAttributeValueFromParseTreeNode = function(node,name,defaultValue) {
	if(node.attributes && node.attributes[name] && node.attributes[name].value !== undefined) {
		return node.attributes[name].value;
	}
	return defaultValue;
};

exports.addClassToParseTreeNode = function(node,classString) {
	var classes = [],
		attribute;
	node.attributes = node.attributes || {};
	attribute = node.attributes["class"];
	if(!attribute) {
		// If the class attribute does not exist, we must create it first.
		attribute = {name: "class", type: "string", value: ""};
		node.attributes["class"] = attribute;
		node.orderedAttributes = node.orderedAttributes || [];
		node.orderedAttributes.push(attribute);
	}
	if(attribute.type === "string") {
		if(attribute.value !== "") {
			classes = attribute.value.split(" ");
		}
		if(classString !== "") {
			$tw.utils.pushTop(classes,classString.split(" "));
		}
		attribute.value = classes.join(" ");
	}
};

exports.addStyleToParseTreeNode = function(node,name,value) {
	var attribute;
	node.attributes = node.attributes || {};
	attribute = node.attributes.style;
	if(!attribute) {
		attribute = {name: "style", type: "string", value: ""};
		node.attributes.style = attribute;
		node.orderedAttributes = node.orderedAttributes || [];
		node.orderedAttributes.push(attribute);
	}
	if(attribute.type === "string") {
		attribute.value += name + ":" + value + ";";
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
