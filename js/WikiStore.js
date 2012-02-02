/*\
title: js/WikiStore.js

WikiStore uses the .cache member of tiddlers to store the following information:

	parseTree: Caches the parse tree for the tiddler
	renderers: Caches rendering functions for this tiddler (indexed by MIME type)
	renditions: Caches the renditions produced by those functions (indexed by MIME type)

\*/
(function(){

/*jslint node: true */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler,
	utils = require("./Utils.js");

/* Creates a new WikiStore object

Available options are:
	shadowStore: An existing WikiStore to use for shadow tiddler storage. Pass null to prevent a default shadow store from being created
	disableHtmlWrapperNodes: If true will suppress the generation of the wrapper nodes used by the refresh and diagnostic machinery
*/
var WikiStore = function WikiStore(options) {
	options = options || {};
	this.disableHtmlWrapperNodes = !!options.disableHtmlWrapperNodes;
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

WikiStore.prototype.getTiddlerText = function(title) {
	var t = this.getTiddler(title);
	return t instanceof Tiddler ? t.text : null;
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
		tiddler = this.getTiddler(title),
		parseTree = this.getCacheForTiddler(title,"parseTree",function() {
			return me.parseText(tiddler.type,tiddler.text);
		});
	return parseTree;
};

/*
Compiles a block of text of a specified type into a renderer that renders the text in a particular MIME type
*/
WikiStore.prototype.compileText = function(type,text,targetType) {
	var tree = this.parseText(type,text);
	return tree.compile(targetType);
};

/*
Compiles a JavaScript function that renders a tiddler in a particular MIME type
*/
WikiStore.prototype.compileTiddler = function(title,type) {
	var tiddler = this.getTiddler(title),
		renderers = this.getCacheForTiddler(title,"renderers",function() {
			return {};
		});
	if(tiddler) {
		if(!renderers[type]) {
			var tree = this.parseTiddler(title);
			renderers[type] = tree.compile(type);
		}
		return renderers[type];
	} else {
		return null;	
	}
};

/*
Render a block of text of a specified type into a particular MIME type
*/
WikiStore.prototype.renderText = function(type,text,targetType,asTitle) {
	var tiddler = this.getTiddler(asTitle),
		renderer = this.compileText(type,text,targetType);
	return renderer.render(tiddler,this);
};

/*
Render a tiddler to a particular MIME type
	targetType: target MIME type
	title: title of the tiddler to render
	template: optional title of the tiddler to use as a template
	options: see below

Options include:
	noWrap: Suppress the outer refresh wrapper nodes

*/
WikiStore.prototype.renderTiddler = function(targetType,title,templateTitle,options) {
	options = options || {};
	if(typeof templateTitle !== "string") {
		templateTitle = title;
	}
	var stitcher = ((targetType === "text/html") && !options.noWrap && !this.disableHtmlWrapperNodes) ? utils.stitchElement : function(a,b,c) {return c.content;},
		tiddler = this.getTiddler(title),
		renderer = this.compileTiddler(templateTitle,targetType),
		renditions = this.getCacheForTiddler(templateTitle,"renditions",function() {
			return {};
		});
	if(tiddler) {
		if(title !== templateTitle) {
			var template = this.getTiddler(templateTitle);
			return stitcher("div",{
				"data-tw-render-tiddler": title,
				"data-tw-render-template": templateTitle
			},{
				content: renderer.render(tiddler,this)
			});
		} else {
			if(!renditions[targetType]) {
				renditions[targetType] = renderer.render(tiddler,this);
			}
			return stitcher("div",{
					"data-tw-render-tiddler": title
				},{
					content: renditions[targetType]
				});
		}
	}
	return null;
};

/*
Renders a tiddler and inserts the HTML into a DOM node, and then attaches the event handlers needed by macros
*/
WikiStore.prototype.renderTiddlerInNode = function(node,title,templateTitle,options) {
	node.innerHTML = this.renderTiddler("text/html",title,templateTitle,options);
	this.attachEventHandlers(node,title,templateTitle);
};

/*
Recursively attach macro event handlers for a node and its children
*/
WikiStore.prototype.attachEventHandlers = function(node,renderTiddler,renderTemplate) {
	var me = this,
		dispatchMacroEvent = function(event) {
			var renderer = me.compileTiddler(renderTemplate ? renderTemplate : renderTiddler,"text/html"),
				macroName = node.getAttribute("data-tw-macro"),
				macro = me.macros[macroName],
				step = node.getAttribute("data-tw-render-step");
			macro.events[event.type](event,node,renderTiddler,me,renderer.renderSteps[step].params(renderTiddler,renderer,me,utils));
		};
	if(node.getAttribute) {
		var macroName = node.getAttribute("data-tw-macro");
		if(typeof macroName === "string") {
			var macro = this.macros[macroName];
			if(macro.events) {
				for(var e in macro.events) {
					node.addEventListener(e,dispatchMacroEvent,false);
				}
			}
		}
		if(node.hasAttribute("data-tw-render-tiddler")) {
			renderTiddler = node.getAttribute("data-tw-render-tiddler");
			renderTemplate = node.getAttribute("data-tw-render-template");
		}
	}
	if(node.hasChildNodes) {
		for(var t=0; t<node.childNodes.length; t++) {
			this.attachEventHandlers(node.childNodes[t],renderTiddler,renderTemplate);
		}
	}
};

WikiStore.prototype.installMacro = function(macro) {
	this.macros[macro.name] = macro;
};

/*
Executes a macro and returns the result
*/
WikiStore.prototype.renderMacro = function(macroName,targetType,tiddler,params,content) {
	var macro = this.macros[macroName];
	if(macro) {
		return macro.render(targetType,tiddler,this,params,content);
	} else {
		return null;
	}
};

/*
Re-renders a macro into a node
*/
WikiStore.prototype.rerenderMacro = function(node,changes,macroName,targetType,tiddler,params,content) {
	var macro = this.macros[macroName];
	if(macro) {
		if(macro.rerender) {
			macro.rerender(node,changes,targetType,tiddler,this,params,content);
		} else {
			node.innerHTML = macro.render(targetType,tiddler,this,params,content);
		}
	}
};

/*
Refresh a DOM node and it's children so that it reflects the current state of the store
	node: reference to the DOM node to be refreshed
	changes: hashmap of {title: "created|modified|deleted"}
	renderer: the renderer to use to refresh the node (usually pass null)
	tiddler: the tiddler to use as the context for executing the renderer
*/
WikiStore.prototype.refreshDomNode = function(node,changes,renderer,tiddler) {
	var me = this,
		refreshChildNodes = function(node,renderer,tiddler) {
			if(node.hasChildNodes()) {
				for(var c=0; c<node.childNodes.length; c++) {
					me.refreshDomNode(node.childNodes[c],changes,renderer,tiddler);
				}
			}
		};
	// Get all the various attributes we need
	var renderTiddler = node.getAttribute ? node.getAttribute("data-tw-render-tiddler") : null,
		renderTemplate = node.getAttribute ? node.getAttribute("data-tw-render-template") : null,
		macro = node.getAttribute ? node.getAttribute("data-tw-macro") : null,
		renderStep = node.getAttribute ? node.getAttribute("data-tw-render-step") : null;
	// Is this node the rendering of a tiddler?
	if(renderTiddler !== null) {
		// Rerender the content of the node if the tiddler being rendered has changed
		if(changes.hasOwnProperty(renderTiddler) || (renderTemplate && changes.hasOwnProperty(renderTemplate))) {
			this.renderTiddlerInNode(node,renderTiddler,renderTemplate,{noWrap: true});
		} else {
			// If it hasn't changed, just refresh the child nodes
			if(typeof renderTemplate !== "string") {
				renderTemplate = renderTiddler;
			}
			refreshChildNodes(node,this.compileTiddler(renderTemplate,"text/html"),this.getTiddler(renderTiddler));
		}
	// Is this node a macro
	} else if(macro !== null) {
		// Get the render step
		var r = renderer.renderSteps[renderStep],
			hasChanged = false;
		// Refresh if a dependency has changed
		if(r.dependencies === null) {
			hasChanged = true;
		} else {
			for(var d=0; d<r.dependencies.length; d++) {
				if(r.dependencies[d] in changes) {
					hasChanged = true;
				}
			}
		}
		if(hasChanged) {
			renderer.rerender(node,changes,tiddler,this,renderStep);
		} else {
			// If no change, just refresh the children
			refreshChildNodes(node,renderer,tiddler);
		}
	// If it's not a macro or a tiddler rendering, just process any child nodes
	} else {
		refreshChildNodes(node,renderer,tiddler);
	}
};

exports.WikiStore = WikiStore;

})();
