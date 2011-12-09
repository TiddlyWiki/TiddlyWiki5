/*
Wiki text macro implementation
*/


/*global require: false, exports: false */
"use strict";

var ArgParser = require("./ArgParser.js").ArgParser,
	WikiTextParserModule = require("./WikiTextParser.js"),
	utils = require("./Utils.js"),
	util = require("util");

var wikiTextMacros = exports;

wikiTextMacros.executeMacros = function(tree,store,tiddler) {
	for(var t=0; t<tree.length; t++) {
		if(tree[t].type === "macro") {
			wikiTextMacros.executeMacro(tree[t],store,tiddler);
		}
		if(tree[t].children) {
			wikiTextMacros.executeMacros(tree[t].children,store,tiddler);
		}
	}
};

wikiTextMacros.executeMacro = function(macroNode,store,tiddler) {
	var macroInfo = wikiTextMacros.macros[macroNode.name];
	macroNode.output = [];
	if(macroInfo) {
		macroInfo.handler(macroNode,store,tiddler);
	} else {
		macroNode.output.push({type: "text", value: "Unknown macro " + macroNode.name});
	}
};

wikiTextMacros.macros = {
	allTags: {
		handler: function(macroNode,store,tiddler) {
		}
	},
	br: {
		handler: function(macroNode,store,tiddler) {
		}
	},
	list: {
		handler: function(macroNode,store,tiddler) {
		}
	},
	slider: {
		handler: function(macroNode,store,tiddler) {
		}
	},
	tabs: {
		handler: function(macroNode,store,tiddler) {
		}
	},
	tag: {
		handler: function(macroNode,store,tiddler) {
		}
	},
	tagging: {
		handler: function(macroNode,store,tiddler) {
		}
	},
	tags: {
		handler: function(macroNode,store,tiddler) {
		}
	},
	tiddler: {
		handler: function(macroNode,store,tiddler) {
			var args = new ArgParser(macroNode.params,{defaultName:"name"}),
				targetTitle = args.getValueByName("name",null),
				withTokens = args.getValuesByName("with",[]),
				text = store.getTiddlerText(targetTitle,"");
			for(t=0; t<withTokens.length; t++) {
				var placeholderRegExp = new RegExp("\\$"+(t+1),"mg");
				text = text.replace(placeholderRegExp,withTokens[t]);
			}
			var parseTree = new WikiTextParserModule.WikiTextParser(text);
			for(var t=0; t<parseTree.tree.length; t++) {
				macroNode.output.push(parseTree.tree[t]);
			}
			// Execute any macros in the copy
			wikiTextMacros.executeMacros(macroNode.output,store,tiddler);
		}
	},
	timeline: {
		handler: function(macroNode,store,tiddler) {
		}
	},
	today: {
		handler: function(macroNode,store,tiddler) {
			var now = new Date(),
				args = new ArgParser(macroNode.params,{noNames:true}),
				value = args.byPos[0] ? utils.formatDateString(now,args.byPos[0].v) : now.toLocaleString();
			macroNode.output.push({type: "text", value: value});
		}
	},
	version: {
		handler: function(macroNode,store,tiddler) {
			macroNode.output.push({type: "text", value: "0.0.0"});
		}
	},
	view: {
		handler: function(macroNode,store,tiddler) {
		}
	}
};
