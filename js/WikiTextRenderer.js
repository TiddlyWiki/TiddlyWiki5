/*
Wiki text macro implementation
*/

/*jslint node: true */
"use strict";

var ArgParser = require("./ArgParser.js").ArgParser,
	WikiTextParserModule = require("./WikiTextParser.js"),
	utils = require("./Utils.js"),
	util = require("util");

var WikiTextRenderer = function(store,title,parser) {
	this.parser = parser;
	this.store = store;
	this.title = title;
};

WikiTextRenderer.prototype.render = function(type,treenode) {
	if(type === "text/html") {
		return this.renderAsHtml(treenode);
	} else if (type === "text/plain") {
		return this.renderAsText(treenode);
	} else {
		return null;
	}
};

WikiTextRenderer.prototype.renderAsHtml = function(treenode) {
	var output = [],
		renderSubTree;
	var renderElement = function(element, selfClosing) {
		var tagBits = [element.type];
		if(element.attributes) {
			for(var a in element.attributes) {
				var r = element.attributes[a];
				if(a === "style") {
					var s = [];
					for(var t in r) {
						s.push(t + ":" + r[t] + ";");
					}
					r = s.join("");
				}
				tagBits.push(a + "=\"" + utils.htmlEncode(r) + "\"");
			}
		}
		output.push("<" + tagBits.join(" ") + (selfClosing ? " /" : "") + ">");
		if(!selfClosing) {
			if(element.children) {
				renderSubTree(element.children);
			}
			output.push("</" + element.type + ">");
		}
	};
	renderSubTree = function(tree) {
		for(var t=0; t<tree.length; t++) {
			switch(tree[t].type) {
				case "text":
					output.push(utils.htmlEncode(tree[t].value));
					break;
				case "entity":
					output.push(tree[t].value);
					break;
				case "br":
				case "img":
					renderElement(tree[t],true); // Self closing elements
					break;
				case "macro":
					renderSubTree(tree[t].output);
					break;
				default:
					renderElement(tree[t]);
					break;
			}
		}
	};
	this.executeMacros(treenode);
	renderSubTree(treenode);
	return output.join("");	
};

WikiTextRenderer.prototype.renderAsText = function(treenode) {
	var output = [];
	var renderSubTree = function(tree) {
		for(var t=0; t<tree.length; t++) {
			switch(tree[t].type) {
				case "text":
					output.push(tree[t].value);
					break;
				case "entity":
					var c = utils.entityDecode(tree[t].value);
					if(c) {
						output.push(c);
					} else {
						output.push(tree[t].value);
					}
					break;
				case "macro":
					renderSubTree(tree[t].output);
					break;
			}
			if(tree[t].children) {
				renderSubTree(tree[t].children);
			}
		}
	};
	this.executeMacros(treenode);
	renderSubTree(treenode);
	return output.join("");	
};

WikiTextRenderer.prototype.executeMacros = function(tree) {
	for(var t=0; t<tree.length; t++) {
		if(tree[t].type === "macro") {
			this.executeMacro(tree[t]);
		}
		if(tree[t].children) {
			this.executeMacros(tree[t].children);
		}
	}
};

WikiTextRenderer.prototype.executeMacro = function(macroNode) {
	var macroInfo = WikiTextRenderer.macros[macroNode.name];
	macroNode.output = [];
	if(macroInfo) {
		macroInfo.handler.call(this,macroNode);
	} else {
		macroNode.output.push({type: "text", value: "Unknown macro " + macroNode.name});
	}
};

WikiTextRenderer.versionTiddlyWiki = "2.6.5";

WikiTextRenderer.macros = {
	allTags: {
		handler: function(macroNode) {
		}
	},
	br: {
		handler: function(macroNode) {
		}
	},
	list: {
		handler: function(macroNode) {
		}
	},
	slider: {
		handler: function(macroNode) {
		}
	},
	tabs: {
		handler: function(macroNode) {
		}
	},
	tag: {
		handler: function(macroNode) {
		}
	},
	tagging: {
		handler: function(macroNode) {
		}
	},
	tags: {
		handler: function(macroNode) {
		}
	},
	tiddler: {
		handler: function(macroNode) {
			var args = new ArgParser(macroNode.params,{defaultName:"name"}),
				targetTitle = args.getValueByName("name",null),
				withTokens = args.getValuesByName("with",[]),
				text = this.store.getTiddlerText(targetTitle,""),
				t;
			for(t=0; t<withTokens.length; t++) {
				var placeholderRegExp = new RegExp("\\$"+(t+1),"mg");
				text = text.replace(placeholderRegExp,withTokens[t]);
			}
			var parseTree = new WikiTextParserModule.WikiTextParser(text,this.parser.processor);
			for(t=0; t<parseTree.children.length; t++) {
				macroNode.output.push(parseTree.children[t]);
			}
			// Execute any macros in the copy
			this.executeMacros(macroNode.output);
		}
	},
	timeline: {
		handler: function(macroNode) {
		}
	},
	today: {
		handler: function(macroNode) {
			var now = new Date(),
				args = new ArgParser(macroNode.params,{noNames:true,cascadeDefaults:true}),
				value = args.byPos[0] ? utils.formatDateString(now,args.byPos[0].v) : now.toLocaleString();
			macroNode.output.push({type: "text", value: value});
		}
	},
	version: {
		handler: function(macroNode) {
			macroNode.output.push({type: "text", value: WikiTextRenderer.versionTiddlyWiki});
		}
	},
	view: {
		handler: function(macroNode) {
		}
	}
};

exports.WikiTextRenderer = WikiTextRenderer;

