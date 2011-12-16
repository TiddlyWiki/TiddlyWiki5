/*\
title: js/WikiTextRenderer.js

\*/
(function(){

/*jslint node: true */
"use strict";

var ArgParser = require("./ArgParser.js").ArgParser,
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
				case "context":
					renderSubTree(tree[t].children);
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
	this.executeMacros(treenode,this.title);
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
	this.executeMacros(treenode,this.title);
	renderSubTree(treenode);
	return output.join("");	
};

WikiTextRenderer.prototype.executeMacros = function(tree,title) {
	for(var t=0; t<tree.length; t++) {
		if(tree[t].type === "macro") {
			this.executeMacro(tree[t],title);
		}
		if(tree[t].children) {
			var contextForChildren = tree[t].type === "context" ? tree[t].tiddler : title;
			this.executeMacros(tree[t].children,contextForChildren);
		}
	}
};

WikiTextRenderer.prototype.executeMacro = function(macroNode,title) {
	var macroInfo = WikiTextRenderer.macros[macroNode.name];
	macroNode.output = [];
	if(macroInfo) {
		macroInfo.handler.call(this,macroNode,title);
	} else {
		macroNode.output.push({type: "text", value: "Unknown macro " + macroNode.name});
	}
};

WikiTextRenderer.versionTiddlyWiki = "2.6.5";

WikiTextRenderer.macros = {
	allTags: {
		handler: function(macroNode,title) {
		}
	},
	br: {
		handler: function(macroNode,title) {
			macroNode.output.push({type: "br"});
		}
	},
	list: {
		handler: function(macroNode,title) {
			var args = new ArgParser(macroNode.params,{defaultName:"type"}),
				type = args.getValueByName("type","all"),
				template = args.getValueByName("template",null),
				templateType = "text/x-tiddlywiki", templateText = "<<view title link>>",
				emptyMessage = args.getValueByName("emptyMessage",null);
			// Get the template to use
			template = template ? this.store.getTiddler(template) : null;
			if(template) {
				templateType = template.fields.type;
				templateText = template.fields.text;
			}
			// Get the handler and the tiddlers
			var handler = WikiTextRenderer.macros.list.types[type];
			handler = handler || WikiTextRenderer.macros.list.types.all;
			var tiddlers = handler.call(this);
			// Render them as a list
			var ul = {type: "ul", children: []};
			for(var t=0; t<tiddlers.length; t++) {
				var li = {
						type: "li",
						children: [ {
							type: "context",
							tiddler: tiddlers[t],
							children: []
						} ] 
				};
				var parseTree = this.parser.processor.textProcessors.parse(templateType,templateText);
				for(var c=0; c<parseTree.children.length; c++) {
					li.children[0].children.push(parseTree.children[c]);
				}
				ul.children.push(li);
			}
			if(ul.children.length > 0) {
				macroNode.output.push(ul);
				this.executeMacros(macroNode.output,title);
			} else if (emptyMessage) {
				macroNode.output.push({type: "text", value: emptyMessage});	
			}
		},
		types: {
			all: function() {
				return this.store.getTitles("title","excludeLists");
			},
			missing: function() {
				return this.store.getMissingTitles();
			},
			orphans: function() {
				return this.store.getOrphanTitles();
			},
			shadowed: function() {
				return this.store.getShadowTitles();
			},
			touched: function() {
				// Server syncing isn't implemented yet
				return [];
			},
			filter: function() {
				// Filters aren't implemented yet
				return [];
			}
		}
	},
	slider: {
		handler: function(macroNode,title) {
		}
	},
	tabs: {
		handler: function(macroNode,title) {
		}
	},
	tag: {
		handler: function(macroNode,title) {
		}
	},
	tagging: {
		handler: function(macroNode,title) {
		}
	},
	tags: {
		handler: function(macroNode,title) {
		}
	},
	tiddler: {
		handler: function(macroNode,title) {
			var args = new ArgParser(macroNode.params,{defaultName:"name",cascadeDefaults:true}),
				targetTitle = args.getValueByName("name",null),
				withTokens = args.getValuesByName("with",[]),
				tiddler = this.store.getTiddler(targetTitle),
				text = this.store.getTiddlerText(targetTitle,""),
				t;
			for(t=0; t<withTokens.length; t++) {
				var placeholderRegExp = new RegExp("\\$"+(t+1),"mg");
				text = text.replace(placeholderRegExp,withTokens[t]);
			}
			var parseTree = this.parser.processor.textProcessors.parse(tiddler.fields.type,text);
			for(t=0; t<parseTree.children.length; t++) {
				macroNode.output.push(parseTree.children[t]);
			}
			// Execute any macros in the copy
			this.executeMacros(macroNode.output,title);
		}
	},
	timeline: {
		handler: function(macroNode,title) {
		}
	},
	today: {
		handler: function(macroNode,title) {
			var now = new Date(),
				args = new ArgParser(macroNode.params,{noNames:true}),
				value = args.byPos[0] ? utils.formatDateString(now,args.byPos[0].v) : now.toLocaleString();
			macroNode.output.push({type: "text", value: value});
		}
	},
	version: {
		handler: function(macroNode,title) {
			macroNode.output.push({type: "text", value: WikiTextRenderer.versionTiddlyWiki});
		}
	},
	view: {
		handler: function(macroNode,title) {
			var args = new ArgParser(macroNode.params,{noNames:true}),
				field = args.byPos[0] ? args.byPos[0].v : null,
				format = args.byPos[1] ? args.byPos[1].v : "text",
				tiddler = this.store.getTiddler(title),
				value = tiddler ? tiddler.fields[field] : null;
			if(tiddler && field && value) {
				switch(format) {
					case "text":
						macroNode.output.push({type: "text", value: value});
						break;
					case "link":
						macroNode.output.push({
							type: "a",
							attributes: {
								href: value
								},
							children: [
								{type: "text", value: value}
							]
						});
						break;
					case "wikified":
						var parseTree = this.parser.processor.textProcessors.parse("text/x-tiddlywiki",value);
						for(var t=0; t<parseTree.children.length; t++) {
							macroNode.output.push(parseTree.children[t]);
						}
						// Execute any macros in the copy
						this.executeMacros(macroNode.output,title);
						break;
					case "date":
						var template = args.byPos[2] ? args.byPos[2].v : "DD MMM YYYY";
						macroNode.output.push({type: "text", value: utils.formatDateString(value,template)});
						break;
				}
			}
		}
	}
};

exports.WikiTextRenderer = WikiTextRenderer;

})();
