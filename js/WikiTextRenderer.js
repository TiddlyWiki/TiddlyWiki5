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
		var args;
		if(macroInfo.argOptions) {
			var argOptions = {
				globals: {
					title: title
				},
				sandbox: this.store.jsProcessor
			};
			for(var g in macroInfo.argOptions) {
				argOptions[g] = macroInfo.argOptions[g];
			}
			args = new ArgParser(macroNode.params,argOptions);
		}
		macroInfo.handler.call(this,macroNode,args,title);
	} else {
		macroNode.output.push({type: "text", value: "Unknown macro " + macroNode.name});
	}
};

WikiTextRenderer.versionTiddlyWiki = "2.6.5";

WikiTextRenderer.macros = {
	allTags: {
		handler: function(macroNode,args,title) {
		}
	},
	br: {
		handler: function(macroNode,args,title) {
			macroNode.output.push({type: "br"});
		}
	},
	echo: {
		argOptions: {defaultName: "anon"},
		handler: function(macroNode,args,title) {
			var globals = {title: title};
			macroNode.output.push({type: "text", value: args.byPos[0].v});
		}	
	},
	timeline: {
		argOptions: {defaultName:"anon"},
		handler: function(macroNode,args,title) {
			var anonByPos = args.getValuesByName("anon",[]),
				field = anonByPos[0] || "modified",
				limit = anonByPos[1] || null,
				dateformat = anonByPos[2] || "DD MMM YYYY",
				template = args.getValueByName("template",null),
				templateType = "text/x-tiddlywiki",
				templateText = "<<view title link>>",
				groupTemplate = args.getValueByName("groupTemplate",null),
				groupTemplateType = "text/x-tiddlywiki",
				groupTemplateText = "<<view " + field + " date '" + dateformat + "'>>",
				filter = args.getValueByName("filter",null),
				tiddlers,
				lastGroup = "",
				ul,
				last = 0,
				t;
			limit = limit ? parseInt(limit,10) : null;
			template = template ? this.store.getTiddler(template) : null;
			if(template) {
				templateType = template.fields.type;
				templateText = template.fields.text;
			}
			groupTemplate = groupTemplate ? this.store.getTiddler(groupTemplate) : null;
			if(groupTemplate) {
				groupTemplateType = groupTemplate.fields.type;
				groupTemplateText = groupTemplate.fields.text;
			}
			if(filter) {
				// Filtering not implemented yet
				tiddlers = this.store.getTitles(field,"excludeLists");
			} else {
				tiddlers = this.store.getTitles(field,"excludeLists");
			}
			if(limit !== null) {
				last = tiddlers.length - Math.min(tiddlers.length,limit);
			}
			for(t=tiddlers.length-1; t>=last; t--) {
				var tiddler = tiddlers[t],
					theGroupParseTree = this.store.parseText(groupTemplateType,groupTemplateText),
					theGroup = theGroupParseTree.render("text/plain",theGroupParseTree.children,this.store,tiddler);
				if(theGroup !== "") {
					if(ul === undefined || theGroup !== lastGroup) {
						ul = {type: "ul", attributes: {"class": "timeline"}, children: []};
						macroNode.output.push(ul);
						ul.children.push({type: "li", attributes: {"class": "listTitle"}, children: [{type: "text", value: theGroup}]});
						lastGroup = theGroup;
					}
					var item = {
									type: "li",
									attributes: {
										"class": "listLink"}, 
									children: [ {
										type: "context",
										tiddler: tiddler,
										children: []
								}]};
					ul.children.push(item);
					item.children[0].children = this.store.parseText(templateType,templateText).children;
				}
			}
			this.executeMacros(macroNode.output,title);
		}
	},
	list: {
		argOptions: {defaultName:"type"},
		handler: function(macroNode,args,title) {
			var type = args.getValueByName("type","all"),
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
				li.children[0].children = this.store.parseText(templateType,templateText).children;
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
		handler: function(macroNode,args,title) {
		}
	},
	tabs: {
		handler: function(macroNode,args,title) {
		}
	},
	tag: {
		handler: function(macroNode,args,title) {
		}
	},
	tagging: {
		handler: function(macroNode,args,title) {
		}
	},
	tags: {
		handler: function(macroNode,args,title) {
		}
	},
	tiddler: {
		argOptions: {defaultName:"name",cascadeDefaults:true},
		handler: function(macroNode,args,title) {
			var targetTitle = args.getValueByName("name",null),
				withTokens = args.getValuesByName("with",[]),
				tiddler = this.store.getTiddler(targetTitle),
				text = this.store.getTiddlerText(targetTitle,""),
				t;
			for(t=0; t<withTokens.length; t++) {
				var placeholderRegExp = new RegExp("\\$"+(t+1),"mg");
				text = text.replace(placeholderRegExp,withTokens[t]);
			}
			macroNode.output = this.store.parseText(tiddler.fields.type,text).children;
			// Execute any macros in the copy
			this.executeMacros(macroNode.output,title);
		}
	},
	today: {
		argOptions: {noNames:true},
		handler: function(macroNode,args,title) {
			var now = new Date(),
				value = args.byPos[0] ? utils.formatDateString(now,args.byPos[0].v) : now.toLocaleString();
			macroNode.output.push({type: "text", value: value});
		}
	},
	version: {
		handler: function(macroNode,args,title) {
			macroNode.output.push({type: "text", value: WikiTextRenderer.versionTiddlyWiki});
		}
	},
	view: {
		argOptions: {noNames:true},
		handler: function(macroNode,args,title) {
			var field = args.byPos[0] ? args.byPos[0].v : null,
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
						macroNode.output = this.store.parseText("text/x-tiddlywiki",value).children;
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
