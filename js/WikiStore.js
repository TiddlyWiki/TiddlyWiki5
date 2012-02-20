/*\
title: js/WikiStore.js

WikiStore uses the .cache member of tiddlers to store the following information:

	parseTree: Caches the parse tree for the tiddler
	renderers: Caches rendering functions for this tiddler (indexed by MIME type)

\*/
(function(){

/*jslint node: true */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler,
	Renderer = require("./Renderer.js").Renderer,
	Dependencies = require("./Dependencies.js").Dependencies,
	utils = require("./Utils.js");

/* Creates a new WikiStore object

Available options are:
	shadowStore: An existing WikiStore to use for shadow tiddler storage. Pass null to prevent a default shadow store from being created
*/
var WikiStore = function WikiStore(options) {
	options = options || {};
	this.tiddlers = {}; // Hashmap of tiddlers by title
	this.parsers = {}; // Hashmap of parsers by accepted MIME type
	this.macros = {}; // Hashmap of macros by macro name
	this.caches = {}; // Hashmap of cache objects by tiddler title, each is a hashmap of named caches
	this.tiddlerSerializers = {}; // Hashmap of serializers by target MIME type
	this.tiddlerDeserializers = {}; // Hashmap of deserializers by accepted MIME type
	this.eventListeners = []; // Array of {filter:,listener:}
	this.eventsTriggered = false;
	this.changedTiddlers = {}; // Hashmap of {title: "created|modified|deleted"}
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

WikiStore.prototype.getTiddlerText = function(title,defaultText) {
	defaultText = typeof defaultText === "string"  ? defaultText : null;
	var t = this.getTiddler(title);
	return t instanceof Tiddler ? t.text : defaultText;
};

WikiStore.prototype.deleteTiddler = function(title) {
	delete this.tiddlers[title];
	this.clearCache(title);
	this.touchTiddler("deleted",title);
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
	var status = tiddler.title in this.tiddlers ? "modified" : "created";
	this.clearCache(tiddler.title);
	this.tiddlers[tiddler.title] = tiddler;
	this.touchTiddler(status,tiddler.title);
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
		tiddlers.sort(function (a,b) {return Tiddler.compareTiddlerFields(a,b,sortField);});
		for(t=0; t<tiddlers.length; t++) {
			if(!tiddlers[t].hasTag(excludeTag)) {
				callback.call(this,tiddlers[t].title,tiddlers[t]);
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

// Return the named cache object for a tiddler. If the cache doesn't exist then the initializer function is invoked to create it
WikiStore.prototype.getCacheForTiddler = function(title,cacheName,initializer) {
	var caches = this.caches[title];
	if(caches && caches[cacheName]) {
		return caches[cacheName];
	} else {
		if(!caches) {
			caches = {};
			this.caches[title] = caches;
		}
		caches[cacheName] = initializer();
		return caches[cacheName];
	}
};

// Clear all caches associated with a particular tiddler
WikiStore.prototype.clearCache = function(title) {
	if(this.caches.hasOwnProperty(title)) {
		delete this.caches[title];
	}
};

WikiStore.prototype.parseText = function(type,text) {
	var parser = this.parsers[type];
	if(!parser) {
		parser = this.parsers["text/x-tiddlywiki"];
	}
	if(parser) {
		return parser.parse(type,text);
	} else {
		return null;
	}
};

WikiStore.prototype.parseTiddler = function(title) {
	var me = this,
		tiddler = this.getTiddler(title);
	return tiddler ? this.getCacheForTiddler(title,"parseTree",function() {
			return me.parseText(tiddler.type,tiddler.text);
		}) : null;
};

/*
Render a tiddler to a particular MIME type
	targetType: target MIME type
	title: title of the tiddler to render
	template: optional title of the tiddler to use as a template
*/
WikiStore.prototype.renderTiddler = function(targetType,tiddlerTitle,templateTitle) {
	// Construct the tiddler macro
	var macro = Renderer.MacroNode(
						"tiddler",
						{target: tiddlerTitle, template: templateTitle},
						null,
						this);
	macro.execute();
	return macro.render(targetType);
};

WikiStore.prototype.installMacro = function(macro) {
	this.macros[macro.name] = macro;
};

WikiStore.prototype.renderMacro = function(macroName,params,children,tiddler) {
	var macro = Renderer.MacroNode(macroName,params,children,this);
	macro.execute([],tiddler);
	return macro;
};

exports.WikiStore = WikiStore;

})();
