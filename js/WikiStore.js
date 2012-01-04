/*\
title: js/WikiStore.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler,
	utils = require("./Utils.js"),
	util = require("util");

/* Creates a new WikiStore object

Available options are:
	shadowStore: An existing WikiStore to use for shadow tiddler storage. Pass null to prevent a default shadow store from being created
*/
var WikiStore = function WikiStore(options) {
	options = options || {};
	this.tiddlers = {};
	this.textProcessors = {};
	this.tiddlerSerializers = {};
	this.tiddlerDeserializers = {};
	this.sandbox = options.sandbox;
	this.shadows = options.shadowStore !== undefined ? options.shadowStore : new WikiStore({
		shadowStore: null
	});
};

WikiStore.prototype.registerTextProcessor = function(type,processor) {
	this.textProcessors[type] = processor;
};

WikiStore.prototype.registerTiddlerSerializer = function(extension,mimeType,serializer) {
	this.tiddlerSerializers[extension] = serializer;
	this.tiddlerSerializers[mimeType] = serializer;
};

WikiStore.prototype.registerTiddlerDeserializer = function(extension,mimeType,deserializer) {
	this.tiddlerDeserializers[extension] = deserializer;
	this.tiddlerDeserializers[mimeType] = deserializer;	
};

WikiStore.prototype.getTiddler = function(title) {
	var t = this.tiddlers[title];
	if(t instanceof Tiddler) {
		return t;
	} else if(this.shadows) {
		return this.shadows.getTiddler(title);
	} else {
		return null;
	}
};

WikiStore.prototype.getTiddlerText = function(title) {
	var t = this.getTiddler(title);
	return t instanceof Tiddler ? t.fields.text : null;
};

WikiStore.prototype.deleteTiddler = function(title) {
	delete this.tiddlers[title];
};

WikiStore.prototype.tiddlerExists = function(title) {
	var exists = this.tiddlers[title] instanceof Tiddler;
	if(exists) {
		return true;
	} else if (this.shadows) {
		return this.shadows.tiddlerExists(title);
	}
	return ;
};

WikiStore.prototype.addTiddler = function(tiddler) {
	this.tiddlers[tiddler.fields.title] = tiddler;
};

WikiStore.prototype.forEachTiddler = function(/* [sortField,[excludeTag,]]callback */) {
	var a = 0,
		sortField = arguments.length > 1 ? arguments[a++] : null,
		excludeTag = arguments.length > 2 ? arguments[a++] : null,
		callback = arguments[a++],
		t,tiddlers = [],tiddler;
	if(sortField) {
		for(t in this.tiddlers) {
			tiddlers.push(this.tiddlers[t]); 
		}
		tiddlers.sort(function (a,b) {
			var aa = a.fields[sortField] || 0,
				bb = b.fields[sortField] || 0;
			if(aa < bb) {
				return -1;
			} else {
				if(aa > bb) {
					return 1;
				} else {
					return 0;
				}
			}
		});
		for(t=0; t<tiddlers.length; t++) {
			if(!tiddlers[t].hasTag(excludeTag)) {
				callback.call(this,tiddlers[t].fields.title,tiddlers[t]);
			}
		}
	} else {
		for(t in this.tiddlers) {
			tiddler = this.tiddlers[t];
			if(tiddler instanceof Tiddler && !tiddler.hasTag(excludeTag))
				callback.call(this,t,tiddler);
		}
	}
};

WikiStore.prototype.getTitles = function(sortField,excludeTag) {
	sortField = sortField || "title";
	var tiddlers = [];
	this.forEachTiddler(sortField,excludeTag,function(title,tiddler) {
		tiddlers.push(title);
	});
	return tiddlers;
};

WikiStore.prototype.getMissingTitles = function() {
	return [];
};

WikiStore.prototype.getOrphanTitles = function() {
	return [];
};

WikiStore.prototype.getShadowTitles = function() {
	return this.shadows ? this.shadows.getTitles() : [];
};

WikiStore.prototype.serializeTiddler = function(type,tiddler) {
	var serializer = this.tiddlerSerializers[type];
	if(serializer) {
		return serializer(tiddler);
	} else {
		return null;
	}
};

WikiStore.prototype.deserializeTiddlers = function(type,text,srcFields) {
	var fields = {},
		deserializer = this.tiddlerDeserializers[type],
		t;
	if(srcFields) {
		for(t in srcFields) {
			fields[t] = srcFields[t];		
		}
	}
	if(deserializer) {
		return deserializer(text,fields);
	} else {
		// Return a raw tiddler for unknown types
		fields.text = text;
		return [fields];
	}
};

WikiStore.prototype.getFormattedTiddlerField = function(title,field,format,template) {
	format = format || "text";
	var tiddler = this.getTiddler(title);
	if(tiddler && tiddler.fields[field]) {
		switch(format) {
			case "text":
				return utils.htmlEncode(tiddler.fields[field]);
			case "link":
				// xxx: Attribute encoding is wrong
				return "<a href='" + utils.htmlEncode(tiddler.fields[field]) + "'>" + utils.htmlEncode(tiddler.fields[field]) + "</a>";
			case "wikified":
				return this.renderTiddler("text/html",tiddler.fields.title);
			case "date":
				template = template || "DD MMM YYYY";
				return utils.htmlEncode(utils.formatDateString(tiddler.fields[field],template));
		}
	}
	return "";
};

WikiStore.prototype.classesForLink = function(target) {
	return this.tiddlerExists(target) ? "class=\"linkResolves\"" : "";
};

WikiStore.prototype.listTiddlers = function(type,template,emptyMessage) {
	return "<span>Listing!</span>";
};


/*

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

*/


WikiStore.prototype.parseText = function(type,text) {
	var processor = this.textProcessors[type];
	if(!processor) {
		processor = this.textProcessors["text/x-tiddlywiki"];
	}
	if(processor) {
		return processor.parse(text);
	} else {
		return null;
	}
};

WikiStore.prototype.parseTiddler = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		return this.parseText(tiddler.fields.type,tiddler.fields.text);
	} else {
		return null;
	}
};

/*
Render a tiddler to a particular MIME type. Optionally render it with a different tiddler as the context. This option is used to render a tiddler through a template as store.renderTiddler("text/html",tiddler,template)
*/
WikiStore.prototype.renderTiddler = function(type,title,asTitle) {
	var parser = this.parseTiddler(title),
		asTitleExists = asTitle ? this.tiddlerExists(asTitle) : true;
	if(parser && asTitleExists) {
		return parser.render(type,parser.children,this,asTitle ? asTitle : title);
	} else {
		return null;
	}
};

WikiStore.prototype.compileTiddler = function(type,title,asTitle) {
	var parser = this.parseTiddler(title),
		asTitleExists = asTitle ? this.tiddlerExists(asTitle) : true;
	if(parser && asTitleExists) {
		return parser.compile(type,parser.children,this,asTitle ? asTitle : title);
	} else {
		return null;
	}
};

WikiStore.prototype.installMacros = function() {
	this.macros = {
		echo: {
			params: {
				text: {byPos: 0, type: "text", optional: false}
			},
			code: {
				"text/html": this.jsParser.parse("return utils.htmlEncode(params.text);"),
				"text/plain": this.jsParser.parse("return params.text;")
			}
		},
		view: {
			params: {
				field: {byPos: 0, type: "text", optional: false},
				format: {byPos: 1, type: "text", optional: true},
				template: {byPos: 2, type: "text", optional: true}
			},
			code: {
				"text/html": this.jsParser.parse("return store.getFormattedTiddlerField(tiddler.fields.title,params.field,params.format,params.template);"),
				"text/plain": this.jsParser.parse("return store.getFormattedTiddlerField(tiddler.fields.title,params.field,params.format,params.template);")
			}
		},
		list: {
			params: {
				type: {byName: "default", type: "text", optional: false},
				template: {byName: true, type: "tiddler", optional: true},
				emptyMessage: {byName: true, type: "text", optional: true}
			},
			code: {
				"text/html": this.jsParser.parse("return store.listTiddlers(params.type,params.template,params.emptyMessage);"),
				"text/plain": this.jsParser.parse("return store.listTiddlers(params.type,params.template,params.emptyMessage);")
			}
		},
		version: {
			params: {
			},
			code: {
				"text/html": this.jsParser.parse("return '5.0.0';"),
				"text/plain": this.jsParser.parse("return '5.0.0';")
			}
		},
		tiddler: {
			params: {
				target: {byName: "default", type: "tiddler", optional: false},
				"with": {byName: true, type: "text", optional: true, cascade: true}
			},
			code: {
				"text/html": this.jsParser.parse("return store.renderTiddler('text/html',params.target);"),
				"text/plain": this.jsParser.parse("return store.renderTiddler('text/plain',params.target);")
			}
		}
	};
};

/*

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

*/



exports.WikiStore = WikiStore;

})();
