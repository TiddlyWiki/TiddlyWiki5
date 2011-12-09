/*
Wiki text macro implementation
*/


/*global require: false, exports: false */
"use strict";

var ArgParser = require("./ArgParser.js").ArgParser,
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
				title = args.getValueByName("name",null),
				withTokens = args.getValuesByName("with",[]);
			if(withTokens.length > 0) {
				
			} else {
				// There are no substitution tokens, so just copy the parse tree of the tiddler
				var copy = utils.deepCopy(store.getTiddler(title).getParseTree().tree);
				for(var t=0; t<copy.length; t++) {
					macroNode.output.push(copy[t]);
				}
			}
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
