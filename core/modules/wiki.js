/*\
title: $:/core/modules/wiki.js
type: application/javascript
module-type: wikimethod

Extension methods for the $tw.Wiki object

Adds the following properties to the wiki object:

* `eventListeners` is an array of {filter: <string>, listener: fn}
* `changedTiddlers` is a hashmap describing changes to named tiddlers since wiki change events were
last dispatched. Each entry is a hashmap containing two fields:
	modified: true/false
	deleted: true/false
* `changeCount` is a hashmap by tiddler title containing a numerical index that starts at zero and is
	incremented each time a tiddler is created changed or deleted
* `caches` is a hashmap by tiddler title containing a further hashmap of named cache objects. Caches
	are automatically cleared when a tiddler is modified or deleted
* `macros` is a hashmap by macro name containing an object class inheriting from the Macro tree node

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Get the value of a text reference
*/
exports.getTextReference = function(textRef,defaultText,currTiddlerTitle) {
	var tr = this.parseTextReference(textRef),
		title = tr.title || currTiddlerTitle,
		field = tr.field || "text",
		tiddler = this.getTiddler(title);
	if(tiddler && $tw.utils.hop(tiddler.fields,field)) {
		return tiddler.fields[field];
	} else {
		return defaultText;
	}
};

exports.setTextReference = function(textRef,value,currTiddlerTitle,isShadow) {
	var tr = this.parseTextReference(textRef),
		title,tiddler,fields;
	// Check if it is a reference to a tiddler
	if(tr.title && !tr.field) {
		tiddler = this.getTiddler(tr.title);
		this.addTiddler(new $tw.Tiddler(tiddler,{title: tr.title,text: value}),isShadow);
	// Else check for a field reference
	} else if(tr.field) {
		title = tr.title || currTiddlerTitle;
		tiddler = this.getTiddler(title);
		if(tiddler) {
			var fields = {};
			fields[tr.field] = value;
			this.addTiddler(new $tw.Tiddler(tiddler,fields));
		}
	}
};

exports.deleteTextReference = function(textRef,currTiddlerTitle) {
	var tr = this.parseTextReference(textRef),
		title,tiddler,fields;
	// Check if it is a reference to a tiddler
	if(tr.title && !tr.field) {
		this.deleteTiddler(tr.title);
	// Else check for a field reference
	} else if(tr.field) {
		title = tr.title || currTiddlerTitle;
		tiddler = this.getTiddler(title);
		if(tiddler && $tw.utils.hop(tiddler.fields,tr.field)) {
			var fields = {};
			fields[tr.field] = undefined;
			this.addTiddler(new $tw.Tiddler(tiddler,fields));
		}
	}
};

/*
Parse a text reference into its constituent parts
*/
exports.parseTextReference = function(textRef,currTiddlerTitle) {
	// Look for a metadata field separator
	var pos = textRef.indexOf("!!");
	if(pos !== -1) {
		if(pos === 0) {
			return {
				field: textRef
			};
		} else {
			return {
				title: textRef.substring(0,pos - 1),
				field: textRef.substring(pos + 2)
			};	
		}
	} else {
		// Otherwise, we've just got a title
		return {
			title: textRef
		};
	}
};

exports.addEventListener = function(filter,listener) {
	this.eventListeners = this.eventListeners || [];
	this.eventListeners.push({
		filter: filter,
		listener: listener
	});	
};

exports.removeEventListener = function(filter,listener) {
	for(var c=this.eventListeners.length-1; c>=0; c--) {
		var l = this.eventListeners[c];
		if(l.filter === filter && l.listener === listener) {
			this.eventListeners.splice(c,1);
		}
	}
};

/*
Causes a tiddler to be marked as changed, incrementing the change count, and triggers event handlers.
This method should be called after the changes it describes have been made to the wiki.tiddlers[] array.
	title: Title of tiddler
	isDeleted: defaults to false (meaning the tiddler has been created or modified),
		true if the tiddler has been created
*/
exports.touchTiddler = function(title,isDeleted) {
	// Record the touch in the list of changed tiddlers
	this.changedTiddlers = this.changedTiddlers || {};
	this.changedTiddlers[title] = this.changedTiddlers[title] || [];
	this.changedTiddlers[title][isDeleted ? "deleted" : "modified"] = true;
	// Increment the change count
	this.changeCount = this.changeCount || {};
	if($tw.utils.hop(this.changeCount,title)) {
		this.changeCount[title]++;
	} else {
		this.changeCount[title] = 1;
	}
	// Trigger events
	this.eventListeners = this.eventListeners || [];
	if(!this.eventsTriggered) {
		var me = this;
		$tw.utils.nextTick(function() {
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

exports.getChangeCount = function(title) {
	this.changeCount = this.changeCount || {};
	if($tw.utils.hop(this.changeCount,title)) {
		return this.changeCount[title];
	} else {
		return 0;
	}
};

exports.deleteTiddler = function(title) {
	delete this.tiddlers[title];
	this.clearCache(title);
	this.touchTiddler(title,true);
};

exports.tiddlerExists = function(title) {
	return !!this.tiddlers[title];
};

exports.addTiddler = function(tiddler,isShadow) {
	// Check if we're passed a fields hashmap instead of a tiddler
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = new $tw.Tiddler(tiddler);
	}
	// Get the title, and the current tiddler with that title
	var title = tiddler.fields.title,
		prevTiddler = this.tiddlers[title];
	// Make it be a shadow if indicated or if it is already a shadow
	if(isShadow || (prevTiddler && prevTiddler.isShadow)) {
		tiddler.isShadow = true;
	}
	// Save the tiddler
	this.tiddlers[title] = tiddler;
	this.clearCache(title);
	this.touchTiddler(title);
};

/*
Serialise a tiddler to a specified text serialization format
*/
exports.serializeTiddler = function(tiddler,type) {
	var serializer = $tw.Wiki.tiddlerSerializerPlugins[type];
	if(typeof tiddler === "string") {
		tiddler = this.getTiddler(tiddler);
	}
	if(serializer && tiddler) {
		return serializer.call(this,tiddler);
	} else {
		return null;
	}
};

/*
Return a sorted array of tiddler titles, optionally filtered by a tag 
*/
exports.getTiddlers = function(sortField,excludeTag) {
	sortField = sortField || "title";
	var tiddlers = [], t, titles = [];
	for(t in this.tiddlers) {
		if(!this.tiddlers[t].isShadow) {
			tiddlers.push(this.tiddlers[t]);
		}
	}
	tiddlers.sort(function(a,b) {
		var aa = a.fields[sortField].toLowerCase() || 0,
			bb = b.fields[sortField].toLowerCase() || 0;
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
		if(!excludeTag || !tiddlers[t].hasTag(excludeTag)) {
			titles.push(tiddlers[t].fields.title);
		}
	}
	return titles;
};

/*
Sort an array of tiddler titles by a specified field
	titles: array of titles (sorted in place)
	sortField: name of field to sort by
	isDescending: true if the sort should be descending
	isCaseSensitive: true if the sort should consider upper and lower case letters to be different
*/
exports.sortTiddlers = function(titles,sortField,isDescending,isCaseSensitive) {
	var self = this;
	titles.sort(function(a,b) {
		if(sortField !== "title") {
			a = self.getTiddler(a).fields[sortField] || 0;
			b = self.getTiddler(b).fields[sortField] || 0;
		}
		if(!isCaseSensitive) {
			a = a.toLowerCase();
			b = b.toLowerCase();
		}
		if(a < b) {
			return isDescending ? +1 : -1;
		} else {
			if(a > b) {
				return isDescending ? -1 : +1;
			} else {
				return 0;
			}
		}
	});
};

exports.forEachTiddler = function(/* [sortField,[excludeTag,]]callback */) {
	var arg = 0,
		sortField = arguments.length > 1 ? arguments[arg++] : null,
		excludeTag = arguments.length > 2 ? arguments[arg++] : null,
		callback = arguments[arg++],
		titles = this.getTiddlers(sortField,excludeTag),
		t, tiddler;
	for(t=0; t<titles.length; t++) {
		tiddler = this.tiddlers[titles[t]];
		if(tiddler) {
			callback.call(this,tiddler.fields.title,tiddler);
		}
	}
};

exports.getMissingTitles = function() {
	return []; // Todo
};

exports.getOrphanTitles = function() {
	return []; // Todo
};

exports.getShadowTitles = function() {
	var titles = [];
	for(var title in this.tiddlers) {
		if(this.tiddlers[title].isShadow) {
			titles.push(title);
		}
	}
	titles.sort();
	return titles;
};

/*
Retrieves a list of the tiddler titles that are tagged with a given tag
*/
exports.getTiddlersWithTag = function(tag) {
	var titles = [];
	for(var title in this.tiddlers) {
		var tiddler = this.tiddlers[title];
		if(tiddler.fields.tags && tiddler.fields.tags.indexOf(tag) !== -1) {
			titles.push(title);
		}
	}
	return titles;
};

// Return the named cache object for a tiddler. If the cache doesn't exist then the initializer function is invoked to create it
exports.getCacheForTiddler = function(title,cacheName,initializer) {
	this.caches = this.caches || {};
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
exports.clearCache = function(title) {
	this.caches = this.caches || {};
	if($tw.utils.hop(this.caches,title)) {
		delete this.caches[title];
	}
};

exports.initParsers = function(moduleType) {
	// Install the parser modules
	moduleType = moduleType || "parser";
	$tw.wiki.parsers = {}; 
	var modules = $tw.plugins.moduleTypes[moduleType],
		n,m,f;
	if(modules) {
		for(n=0; n<modules.length; n++) {
			m = modules[n];
			// Add the parsers defined by the module
			for(f in m) {
				$tw.wiki.parsers[f] = new m[f]({wiki: this}); // Store an instance of the parser
			}
		}
	}
	// Install the rules for the old wikitext parser rules
	var wikitextparser = this.parsers[$tw.useNewParser ? "text/x-tiddlywiki-old" : "text/x-tiddlywiki"];
	if(modules && wikitextparser) {
		wikitextparser.installRules();
	}
};

/*
Parse a block of text of a specified MIME type

Options are:
	defaultType: Default MIME type to use if the specified one is unknown
*/
exports.parseText = function(type,text,options) {
	options = options || {};
	var parser = this.parsers[type];
	if(!parser && $tw.config.fileExtensionInfo[type]) {
		parser = this.parsers[$tw.config.fileExtensionInfo[type].type];
	}
	if(!parser) {
		parser = this.parsers[options.defaultType || "text/x-tiddlywiki"];
	}
	if(parser) {
		return parser.parse(type,text);
	} else {
		return null;
	}
};

exports.parseTiddler = function(title) {
	var me = this,
		tiddler = this.getTiddler(title);
	return tiddler ? this.getCacheForTiddler(title,"parseTree",function() {
			return me.parseText(tiddler.fields.type,tiddler.fields.text);
		}) : null;
};

/*
Parse text in a specified format and render it into another format
	outputType: content type for the output
	textType: content type of the input text
	text: input text
	options: see below
Options are:
	defaultType: Default MIME type to use if the specified one is unknown
*/
exports.renderText = function(outputType,textType,text,options) {
	var renderer = this.parseText(textType,text,options);
	renderer.execute([]);
	return renderer.render(outputType);
};

exports.renderTiddler = function(outputType,title) {
	var renderer = this.parseTiddler(title);
	renderer.execute([],title);
	return renderer.render(outputType);
};

/*
Install macro plugins into this wiki
	moduleType: Plugin type to install (defaults to "macro")

It's useful to remember what the `new` keyword does. It:

# Creates a new object. It's type is a plain `object`
# Sets the new objects internal, inaccessible, `[[prototype]]` property to the
	constructor function's external, accessible, `prototype` object
# Executes the constructor function, passing the new object as `this`

*/
exports.initMacros = function(moduleType) {
	moduleType = moduleType || "macro";
	$tw.wiki.macros = {}; 
	var MacroClass = require("./treenodes/macro.js").Macro,
		modules = $tw.plugins.moduleTypes[moduleType],
		n,m,f,
		subclassMacro = function(module) {
			// Make a copy of the Macro() constructor function
			var MacroMaker = function Macro() {
				MacroClass.apply(this,arguments);
			};
			// Set the prototype to a new instance of the prototype of the Macro class
			MacroMaker.prototype = new MacroClass();
			// Add the prototype methods for this instance of the macro
			for(var f in module) {
				MacroMaker.prototype[f] = module[f];
			}
			// Make a more convenient reference to the macro info
			return MacroMaker;
		};
	if(modules) {
		for(n=0; n<modules.length; n++) {
			m = modules[n];
			$tw.wiki.macros[m.info.name] = subclassMacro(m);
		}
	}
};

/*
Install editor plugins for the edit macro
*/
exports.initEditors = function(moduleType) {
	moduleType = moduleType || "editor";
	var editMacro = this.macros.edit;
	if(editMacro) {
		editMacro.editors = {};
		$tw.plugins.applyMethods(moduleType,editMacro.editors);
	}
};

/*
Install view plugins for the story macro
*/
exports.initStoryViews = function(moduleType) {
	moduleType = moduleType || "storyview";
	var storyMacro = this.macros.story;
	if(storyMacro) {
		storyMacro.viewers = {};
		$tw.plugins.applyMethods(moduleType,storyMacro.viewers);
	}
};

})();
