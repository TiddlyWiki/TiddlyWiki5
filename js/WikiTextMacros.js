/*
Wiki text macro implementation
*/


/*global require: false, exports: false */
"use strict";

var ArgParser = require("./ArgParser.js").ArgParser,
	utils = require("./Utils.js"),
	util = require("util");

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
	allTags: {
		handler: function(macroNode,store) {
		}
	},
	br: {
		handler: function(macroNode,store) {
		}
	},
	list: {
		handler: function(macroNode,store) {
		}
	},
	slider: {
		handler: function(macroNode,store) {
		}
	},
	tabs: {
		handler: function(macroNode,store) {
		}
	},
	tag: {
		handler: function(macroNode,store) {
		}
	},
	tagging: {
		handler: function(macroNode,store) {
		}
	},
	tags: {
		handler: function(macroNode,store) {
		}
	},
	tiddler: {
		handler: function(macroNode,store) {
		}
	},
	timeline: {
		handler: function(macroNode,store) {
		}
	},
	today: {
		handler: function(macroNode,store) {
			var now = new Date(),
				args = new ArgParser(macroNode.params,{noNames:true}),
				value = args.byPos[0] ? utils.formatDateString(now,args.byPos[0].v) : now.toLocaleString();
			macroNode.output.push({type: "text", value: value});
		}
	},
	version: {
		handler: function(macroNode,store) {
			macroNode.output.push({type: "text", value: "0.0.0"});
		}
	},
	view: {
		handler: function(macroNode,store) {
		}
	}
};

