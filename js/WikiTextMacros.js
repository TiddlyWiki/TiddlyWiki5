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
	annotations: {
		handler: function(macroNode,store) {
		}
	},
	backstage: {
		handler: function(macroNode,store) {
		}
	},
	br: {
		handler: function(macroNode,store) {
		}
	},
	closeAll: {
		handler: function(macroNode,store) {
		}
	},
	download: {
		handler: function(macroNode,store) {
		}
	},
	edit: {
		handler: function(macroNode,store) {
		}
	},
	gradient: {
		handler: function(macroNode,store) {
		}
	},
	importTiddlers: {
		handler: function(macroNode,store) {
		}
	},
	list: {
		handler: function(macroNode,store) {
		}
	},
	message: {
		handler: function(macroNode,store) {
		}
	},
	newJournal: {
		handler: function(macroNode,store) {
		}
	},
	newTiddler: {
		handler: function(macroNode,store) {
		}
	},
	option: {
		handler: function(macroNode,store) {
		}
	},
	options: {
		handler: function(macroNode,store) {
		}
	},
	permaview: {
		handler: function(macroNode,store) {
		}
	},
	plugins: {
		handler: function(macroNode,store) {
		}
	},
	refreshDisplay: {
		handler: function(macroNode,store) {
		}
	},
	saveChanges: {
		handler: function(macroNode,store) {
		}
	},
	search: {
		handler: function(macroNode,store) {
		}
	},
	slider: {
		handler: function(macroNode,store) {
		}
	},
	sync: {
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
	tagChooser: {
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

