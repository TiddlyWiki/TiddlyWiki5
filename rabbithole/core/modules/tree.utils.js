/*\
title: $:/core/modules/tree.utils.js
type: application/javascript
module-type: treeutils

Static utility methods for the $tw.Tree class

\*/
(function(){

/*jshint node: true, browser: true */
"use strict";

/*
Construct an error message
*/
exports.errorNode = function(text) {
	return $tw.Tree.Element("span",{
		"class": ["label","label-important"]
	},[
		new TextNode(text)
	]);
};

/*
Construct a label
*/
exports.labelNode = function(type,value,classes) {
	classes = (classes || []).slice(0);
	classes.push("label");
	return $tw.Tree.Element("span",{
		"class": classes,
		"data-tw-label-type": type
	},value);
};

/*
Construct a split label
*/
exports.splitLabelNode = function(type,left,right,classes) {
	classes = (classes || []).slice(0);
	classes.push("splitLabel");
	return $tw.Tree.Element("span",{
		"class": classes
	},[
		$tw.Tree.Element("span",{
			"class": ["splitLabelLeft"],
			"data-tw-label-type": type
		},left),
		$tw.Tree.Element("span",{
			"class": ["splitLabelRight"]
		},right)
	]);
};

})();
