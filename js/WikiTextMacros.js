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

wikiTextMacros.versionTiddlyWiki = "2.6.5";

wikiTextMacros.executeMacros = function(tree,store,title) {
	for(var t=0; t<tree.length; t++) {
		if(tree[t].type === "macro") {
			wikiTextMacros.executeMacro(tree[t],store,title);
		}
		if(tree[t].children) {
			wikiTextMacros.executeMacros(tree[t].children,store,title);
		}
	}
};

wikiTextMacros.executeMacro = function(macroNode,store,title) {
	var macroInfo = wikiTextMacros.macros[macroNode.name];
console.error("Executing macro %s with params %s in tiddler %s",macroNode.name,0,title);
	macroNode.output = [];
	if(macroInfo) {
		macroInfo.handler(macroNode,store,title);
	} else {
		macroNode.output.push({type: "text", value: "Unknown macro " + macroNode.name});
	}
};

wikiTextMacros.macros = {
	allTags: {
		handler: function(macroNode,store,title) {
		}
	},
	br: {
		handler: function(macroNode,store,title) {
		}
	},
	list: {
		handler: function(macroNode,store,title) {
		}
	},
	slider: {
		handler: function(macroNode,store,title) {
		}
	},
	tabs: {
		handler: function(macroNode,store,title) {
		}
	},
	tag: {
		handler: function(macroNode,store,title) {
		}
	},
	tagging: {
		handler: function(macroNode,store,title) {
		}
	},
	tags: {
		handler: function(macroNode,store,title) {
		}
	},
	tiddler: {
		handler: function(macroNode,store,title) {
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
			wikiTextMacros.executeMacros(macroNode.output,store,title);
		}
	},
	timeline: {
		handler: function(macroNode,store,title) {
		}
	},
	today: {
		handler: function(macroNode,store,title) {
			var now = new Date(),
				args = new ArgParser(macroNode.params,{noNames:true}),
				value = args.byPos[0] ? utils.formatDateString(now,args.byPos[0].v) : now.toLocaleString();
			macroNode.output.push({type: "text", value: value});
		}
	},
	version: {
		handler: function(macroNode,store,title) {
			macroNode.output.push({type: "text", value: wikiTextMacros.versionTiddlyWiki});
		}
	},
	view: {
		handler: function(macroNode,store,title) {
		}
	}
};
