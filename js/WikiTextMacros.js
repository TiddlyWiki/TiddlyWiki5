/*
Wiki text macro implementation
*/


/*global require: false, exports: false */
"use strict";

var util = require("util");

var wikiTextMacros = exports;

wikiTextMacros.executeMacros = function(tree,store) {
	for(var t=0; t<tree.length; t++) {
		if(tree[t].type === "macro") {
			wikiTextMacros.executeMacro(tree[t],store);
		}
		if(tree[t].children) {
			wikiTextMacros.executeMacros(tree[t].children,store);
		}
	}
};

wikiTextMacros.executeMacro = function(macroNode,store) {
	var macroInfo = wikiTextMacros.macros[macroNode.name];
	macroNode.output = [];
	if(macroInfo) {
		macroInfo.handler(macroNode,store);
	} else {
		macroNode.output.push({type: "text", value: "Unknown macro " + macroNode.name});
	}
};

wikiTextMacros.macros = {
	version: {
		handler: function(macroNode,store) {
			macroNode.output.push({type: "text", value: "0.0.0"});
		}
	}
};
