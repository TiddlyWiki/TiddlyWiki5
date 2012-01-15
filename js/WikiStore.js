/*\
title: js/WikiStore.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler,
	utils = require("./Utils.js");

/* Creates a new WikiStore object

Available options are:
	shadowStore: An existing WikiStore to use for shadow tiddler storage. Pass null to prevent a default shadow store from being created
*/
var WikiStore = function WikiStore(options) {
	options = options || {};
	this.tiddlers = {};
	this.parsers = {};
	this.macros = {};
	this.tiddlerSerializers = {};
	this.tiddlerDeserializers = {};
	this.eventListeners = []; // Array of {filter:,listener:}
	this.eventsTriggered = false;
	this.changedTiddlers = {}; // Hashmap of {title: "created|modified|deleted"}
	this.sandbox = options.sandbox;
	this.shadows = options.shadowStore !== undefined ? options.shadowStore : new WikiStore({
		shadowStore: null
	});
};

WikiStore.prototype.registerParser = function(type,parser) {
	this.parsers[type] = parser;
};

WikiStore.prototype.registerTiddlerSerializer = function(extension,mimeType,serializer) {
	this.tiddlerSerializers[extension] = serializer;
	this.tiddlerSerializers[mimeType] = serializer;
};

WikiStore.prototype.registerTiddlerDeserializer = function(extension,mimeType,deserializer) {
	this.tiddlerDeserializers[extension] = deserializer;
	this.tiddlerDeserializers[mimeType] = deserializer;	
};

WikiStore.prototype.addEventListener = function(filter,listener) {
	this.eventListeners.push({
		filter: filter,
		listener: listener
	});	
};

WikiStore.prototype.removeEventListener = function(listener) {
	for(var c=this.eventListeners.length-1; c>=0; c--) {
		var l = this.eventListeners[c];
		if(l.listener === listener) {
			this.eventListeners.splice(c,1);
		}
	}
};

/*
Causes a tiddler to be marked as changed, so that event listeners are triggered for it
	type: Type of change to be registered for the tiddler "created", "modified" or "deleted"
If the tiddler is already touched, the resultant touch type is as follows:

If the tiddler is already marked "created",
... attempts to mark it "modified" leave it "created"
... attempts to mark it "deleted" succeed

If the tiddler is already marked "modified",
... attempts to mark it "deleted" succeed

If the tiddler is already marked "deleted",
... attempts to mark it "created" succeed
... attempts to mark it "modified" fail 

*/
WikiStore.prototype.touchTiddler = function(type,title) {
	var existingType = this.changedTiddlers[title];
	if(existingType === undefined && type === "modified") {
		type = "created";
	}
	if(existingType === "modified" && type === "created") {
		type = "modified";
	}
	if(existingType === "deleted" && type === "created") {
		type = "modified";
	}
	this.changedTiddlers[title] = type;
	this.triggerEvents();
};

/*
Trigger the execution of the event dispatcher at the next tick, if it is not already triggered
*/
WikiStore.prototype.triggerEvents = function() {
	if(!this.eventsTriggered) {
		var me = this;
		utils.nextTick(function() {
			var changes = me.changedTiddlers;
			me.changedTiddlers = {};
			me.eventsTriggered = false;
			for(var e=0; e<me.eventListeners.length; e++) {
				var listener = me.eventListeners[e];
				listener.listener(changes);
			}
		});
		this.eventsTriggered = true;
	}
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
	this.touchTiddler("modified",tiddler.fields.title);
};

WikiStore.prototype.forEachTiddler = function(/* [sortField,[excludeTag,]]callback */) {
	var a = 0,
		sortField = arguments.length > 1 ? arguments[a++] : null,
		excludeTag = arguments.length > 2 ? arguments[a++] : null,
		callback = arguments[a++],
		t,
		tiddlers = [],
		tiddler;
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

WikiStore.prototype.adjustClassesForLink = function(classes,target) {
	var newClasses = classes.slice(0),
		externalRegExp = /(?:file|http|https|mailto|ftp|irc|news|data):[^\s'"]+(?:\/|\b)/i,
		setClass = function(className) {
			if(newClasses.indexOf(className) === -1) {
				newClasses.push(className);
			}
		},
		removeClass = function(className) {
			var p = newClasses.indexOf(className);
			if(p !== -1) {
				newClasses.splice(p,1);
			}
		};
	// Make sure we've got the main link class
	setClass("tw-tiddlylink");
	// Check if it's an internal link
	if (this.tiddlerExists(target)) {
		removeClass("tw-tiddlylink-external");
		setClass("tw-tiddlylink-internal");
		setClass("tw-tiddlylink-resolves");
		removeClass("tw-tiddlylink-missing");
	} else if(externalRegExp.test(target)) {
		setClass("tw-tiddlylink-external");
		removeClass("tw-tiddlylink-internal");
		removeClass("tw-tiddlylink-resolves");
		removeClass("tw-tiddlylink-missing");
	} else {
		removeClass("tw-tiddlylink-external");
		setClass("tw-tiddlylink-internal");
		removeClass("tw-tiddlylink-resolves");
		setClass("tw-tiddlylink-missing");
	}
	return newClasses;
};

WikiStore.prototype.parseText = function(type,text) {
	var parser = this.parsers[type];
	if(!parser) {
		parser = this.parsers["text/x-tiddlywiki"];
	}
	if(parser) {
		return parser.parse(text);
	} else {
		return null;
	}
};

WikiStore.prototype.parseTiddler = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		// Check the cache
		if(!tiddler.parseTree) {
			tiddler.parseTree = this.parseText(tiddler.fields.type,tiddler.fields.text);
		}
		return tiddler.parseTree;
	} else {
		return null;
	}
};

/*
Compiles a block of text of a specified type into a JavaScript function that renders the text in a particular MIME type
*/
WikiStore.prototype.compileText = function(type,text,targetType) {
	/*jslint evil: true */
	var tree = this.parseText(type,text);
	return eval(tree.compile(targetType));
};

/*
Compiles a JavaScript function that renders a tiddler in a particular MIME type
*/
WikiStore.prototype.compileTiddler = function(title,type) {
	/*jslint evil: true */
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		if(!tiddler.renderers[type]) {
			var tree = this.parseTiddler(title);
			tiddler.renderers[type] = eval(tree.compile(type));
		}
		return tiddler.renderers[type];
	} else {
		return null;	
	}
};

/*
Render a block of text of a specified type into a particular MIME type
*/
WikiStore.prototype.renderText = function(type,text,targetType,asTitle) {
	var tiddler = this.getTiddler(asTitle),
		fn = this.compileText(type,text,targetType);
	return fn(tiddler,this,utils);
};

/*
Render a tiddler to a particular MIME type. Optionally render it with a different tiddler
as the context. This option is used to render a tiddler through a template eg
store.renderTiddler("text/html",templateTitle,tiddlerTitle)
*/
WikiStore.prototype.renderTiddler = function(targetType,title,asTitle) {
	var tiddler = this.getTiddler(title),
		fn = this.compileTiddler(title,targetType);
	if(tiddler) {
		if(asTitle) {
			var asTiddler = this.getTiddler(asTitle);
			return fn(asTiddler,this,utils);
		} else {
			if(!tiddler.renditions[targetType]) {
				tiddler.renditions[targetType] = fn(tiddler,this,utils);
			}
			return tiddler.renditions[targetType];
		}
	}
	return null;
};

/*
Executes a macro and returns the result
*/
WikiStore.prototype.renderMacro = function(macroName,targetType,tiddler,params) {
	var macro = this.macros[macroName];
	if(macro) {
		return macro.handler(targetType,tiddler,this,params);
	} else {
		return null;
	}
}

/*
Refresh a DOM node so that it reflects the current state of the store

The refresh processing is:

1. If the node is a link, check the link classes correctly reflect the status of the target tiddler. Recursively process any children. Exit
2. If the node is a macro, and dependencies have changed, re-render the macro into the DOM node. Exit
3. If the node is a macro and the dependencies haven't changed, recursively process each child node of the macro. Exit

Arguments
	node - the DOM node to be processed
	tiddler - the tiddler providing context for the rendering

*/
WikiStore.prototype.refreshDomNode = function(node,tiddler) {
	// Process macros
	var macro = node.getAttribute && node.getAttribute("data-tw-macro"),
		params = node.getAttribute && node.getAttribute("data-tw-params");
	if(macro && params) {
	}
	// Process children
	if(node.hasChildNodes()) {
		this.refreshDomChildren(node,tiddler);
	}
};

WikiStore.prototype.refreshDomChildren = function(node,tiddler) {
	var nodes = node.childNodes;
	for(var c=0; c<nodes.length; c++) {
		this.refreshDomNode(nodes[c],tiddler);
	}
};

WikiStore.prototype.installMacro = function(macro) {
	this.macros[macro.name] = macro;
};

exports.WikiStore = WikiStore;

})();
