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
Get the value of a text reference. Text references can have any of these forms:
	<tiddlertitle>
	<tiddlertitle>##<fieldname>
	##<fieldname> - specifies a field of the current tiddlers
*/
exports.getTextReference = function(textRef,defaultText,currTiddlerTitle) {
	var tr = $tw.utils.parseTextReference(textRef),
		title = tr.title || currTiddlerTitle,
		field = tr.field || "text",
		tiddler = this.getTiddler(title);
	if(tiddler && $tw.utils.hop(tiddler.fields,field)) {
		return tiddler.fields[field];
	} else {
		return defaultText;
	}
};

exports.setTextReference = function(textRef,value,currTiddlerTitle) {
	var tr = $tw.utils.parseTextReference(textRef),
		title,tiddler,fields;
	// Check if it is a reference to a tiddler
	if(tr.title && !tr.field) {
		tiddler = this.getTiddler(tr.title);
		this.addTiddler(new $tw.Tiddler(tiddler,{title: tr.title,text: value}));
	// Else check for a field reference
	} else if(tr.field) {
		title = tr.title || currTiddlerTitle;
		tiddler = this.getTiddler(title);
		if(tiddler) {
			fields = {};
			fields[tr.field] = value;
			this.addTiddler(new $tw.Tiddler(tiddler,fields));
		}
	}
};

exports.deleteTextReference = function(textRef,currTiddlerTitle) {
	var tr = $tw.utils.parseTextReference(textRef),
		title,tiddler,fields;
	// Check if it is a reference to a tiddler
	if(tr.title && !tr.field) {
		this.deleteTiddler(tr.title);
	// Else check for a field reference
	} else if(tr.field) {
		title = tr.title || currTiddlerTitle;
		tiddler = this.getTiddler(title);
		if(tiddler && $tw.utils.hop(tiddler.fields,tr.field)) {
			fields = {};
			fields[tr.field] = undefined;
			this.addTiddler(new $tw.Tiddler(tiddler,fields));
		}
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

exports.addTiddler = function(tiddler) {
	// Check if we're passed a fields hashmap instead of a tiddler
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = new $tw.Tiddler(tiddler);
	}
	// Get the title
	var title = tiddler.fields.title;
	// Save the tiddler
	this.tiddlers[title] = tiddler;
	this.clearCache(title);
	this.touchTiddler(title);
};

/*
Serialise tiddlers to a specified text serialization format
*/
exports.serializeTiddlers = function(tiddlers,type) {
	var serializer = $tw.Wiki.tiddlerSerializerModules[type];
	if(serializer) {
		return serializer.call(this,tiddlers);
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
		if($tw.utils.hop(this.tiddlers,t) && !this.tiddlers[t].isShadow()) {
			tiddlers.push(this.tiddlers[t]);
		}
	}
	tiddlers.sort(function(a,b) {
		var aa = a.fields[sortField].toLowerCase() || "",
			bb = b.fields[sortField].toLowerCase() || "";
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
			a = self.getTiddler(a).fields[sortField] || "";
			b = self.getTiddler(b).fields[sortField] || "";
		}
		if(!isCaseSensitive) {
			if(typeof a === "string") {
				a = a.toLowerCase();
			}
			if(typeof b === "string") {
				b = b.toLowerCase();
			}
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
		if(this.tiddlers[title].isShadow()) {
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

/*
Get a tiddlers content as a JavaScript object. How this is done depends on the type of the tiddler:

application/json: the tiddler JSON is parsed into an object

Other types currently just return null.
*/
exports.getTiddlerData = function(title,defaultData) {
	var tiddler = this.tiddlers[title],
		data;
	if(tiddler && tiddler.fields.text && tiddler.fields.type === "application/json") {
		// JSON tiddler
		try {
			data = JSON.parse(tiddler.fields.text);
		} catch(ex) {
			return defaultData;
		}
		return data;
	}
	return defaultData;
};

/*
Set a tiddlers content to a JavaScript object. Currently this is done by setting the tiddler's type to "application/json" and setting the text to the JSON text of the data.
*/
exports.setTiddlerData = function(title,data) {
	var tiddler = this.getTiddler(title);
	this.addTiddler(new $tw.Tiddler(tiddler,{title: title, type: "application/json", text: JSON.stringify(data)}));
};

/*
Return the content of a tiddler as an array containing each line
*/
exports.getTiddlerList = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler && tiddler.fields.text && tiddler.fields.text.length > 0) {
		return tiddler.fields.text.split("\n");
	}
	return [];
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

exports.new_initParsers = function() {
	// Create a default vocabulary
	this.vocabulary = new $tw.WikiVocabulary({wiki: this});
};

/*
Parse a block of text of a specified MIME type
	type: content type of text to be parsed
	text: text
	options: see below
Options include:
	parseAsInline: if true, the text of the tiddler will be parsed as an inline run
*/
exports.new_parseText = function(type,text,options) {
	return this.vocabulary.parseText(type,text,options);
};

/*
Parse a tiddler according to its MIME type
*/
exports.new_parseTiddler = function(title,options) {
	options = options || {};
	var cacheType = options.parseAsInline ? "newInlineParseTree" : "newBlockParseTree",
		tiddler = this.getTiddler(title),
		self = this;
	return tiddler ? this.getCacheForTiddler(title,cacheType,function() {
			return self.new_parseText(tiddler.fields.type,tiddler.fields.text,options);
		}) : null;
};

/*
Parse text in a specified format and render it into another format
	outputType: content type for the output
	textType: content type of the input text
	text: input text
*/
exports.new_renderText = function(outputType,textType,text) {
	var parser = this.new_parseText(textType,text),
		renderTree = new $tw.WikiRenderTree(parser,{wiki: this});
	renderTree.execute();
	return renderTree.render(outputType);
};

/*
Parse text from a tiddler and render it into another format
	outputType: content type for the output
	title: title of the tiddler to be rendered
*/
exports.new_renderTiddler = function(outputType,title) {
	var parser = this.new_parseTiddler(title),
		renderTree = new $tw.WikiRenderTree(parser,{wiki: this});
	renderTree.execute();
	return renderTree.render(outputType);
};

exports.initParsers = function(moduleType) {
	// Install the parser modules
	moduleType = moduleType || "parser";
	$tw.wiki.parsers = {};
	var self = this;
	$tw.modules.forEachModuleOfType(moduleType,function(title,module) {
		for(var f in module) {
			if($tw.utils.hop(module,f)) {
				$tw.wiki.parsers[f] = new module[f]({wiki: self}); // Store an instance of the parser
			}
		}
	});
	// Install the rules for the old wikitext parser rules
	var wikitextparser = this.parsers["text/x-tiddlywiki"];
	if(wikitextparser) {
		wikitextparser.installRules();
	}
};

/*
Parse a block of text of a specified MIME type

Options are:
	defaultType: Default MIME type to use if the specified one is unknown
	with: Optional array of strings to be substituted for $1, $2 etc.
*/
exports.parseText = function(type,text,options) {
	options = options || {};
	// Select a parser
	var parser = this.parsers[type];
	if(!parser && $tw.config.fileExtensionInfo[type]) {
		parser = this.parsers[$tw.config.fileExtensionInfo[type].type];
	}
	if(!parser) {
		parser = this.parsers[options.defaultType || "text/vnd.tiddlywiki"];
	}
	if(!parser) {
		return null;
	}
	// Substitute any `with` tokens
	if("with" in options) {
		for(var token in options["with"]) {
			var placeholderRegExp = new RegExp("\\$"+token,"mg");
			text = text.replace(placeholderRegExp,options["with"][token]);
		}
	}
	return parser.parse(type,text);
};

/*
Parse a tiddler according to its MIME type

Options are:
	defaultType: Default MIME type to use if the specified one is unknown
	with: Optional array of strings to be substituted for $1, $2 etc.
*/
exports.parseTiddler = function(title,options) {
	options = options || {};
	var me = this,
		tiddler = this.getTiddler(title);
	if("with" in options) {
		return this.parseText(tiddler.fields.type,tiddler.fields.text,options);
	} else {
		return tiddler ? this.getCacheForTiddler(title,"parseTree",function() {
				return me.parseText(tiddler.fields.type,tiddler.fields.text,options);
			}) : null;
	}
};

/*
Parse text in a specified format and render it into another format
	outputType: content type for the output
	textType: content type of the input text
	text: input text
	options: see wiki.parseText()
Options are:
	defaultType: Default MIME type to use if the specified one is unknown
	with: Optional array of strings to be substituted for $1, $2 etc.
*/
exports.renderText = function(outputType,textType,text,options) {
	var renderer = this.parseText(textType,text,options);
	renderer.execute([]);
	return renderer.render(outputType);
};

/*
Parse text from a tiddler and render it into another format
	outputType: content type for the output
	title: title of the tiddler to be rendered
	options: see wiki.parseText()
Options are:
	defaultType: Default MIME type to use if the specified one is unknown
	with: Optional array of strings to be substituted for $1, $2 etc.
*/
exports.renderTiddler = function(outputType,title,options) {
	var renderer = this.parseTiddler(title,options);
	renderer.execute([],title);
	return renderer.render(outputType);
};

/*
Install macro modules into this wiki
	moduleType: Module type to install (defaults to "macro")

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
		subclassMacro = function(module) {
			// Make a copy of the Macro() constructor function
			var MacroMaker = function Macro() {
				MacroClass.apply(this,arguments);
			};
			// Set the prototype to a new instance of the prototype of the Macro class
			MacroMaker.prototype = new MacroClass();
			// Add the prototype methods for this instance of the macro
			for(var f in module) {
				if($tw.utils.hop(module,f)) {
					MacroMaker.prototype[f] = module[f];
				}
			}
			// Make a more convenient reference to the macro info
			return MacroMaker;
		};
	$tw.modules.forEachModuleOfType(moduleType,function(title,module) {
		$tw.wiki.macros[module.info.name] = subclassMacro(module);
	});
};

/*
Install editor modules for the edit macro
*/
exports.initEditors = function(moduleType) {
	moduleType = moduleType || "editor";
	var editMacro = this.macros.edit;
	if(editMacro) {
		editMacro.editors = {};
		$tw.modules.applyMethods(moduleType,editMacro.editors);
	}
};

/*
Install field viewer modules for the view macro
*/
exports.initFieldViewers = function(moduleType) {
	moduleType = moduleType || "fieldviewer";
	var viewMacro = this.macros.view;
	if(viewMacro) {
		viewMacro.fieldviewers = {};
		$tw.modules.applyMethods(moduleType,viewMacro.fieldviewers);
	}
};

/*
Install list viewer modules for the list macro
*/
exports.initListViews = function(moduleType) {
	moduleType = moduleType || "listview";
	var listMacro = this.macros.list;
	if(listMacro) {
		listMacro.listviews = {};
		$tw.modules.applyMethods(moduleType,listMacro.listviews);
	}
};

/*
Select the appropriate saver modules and set them up
*/
exports.initSavers = function(moduleType) {
	moduleType = moduleType || "saver";
	// Instantiate the available savers
	this.savers = [];
	var self = this;
	$tw.modules.forEachModuleOfType(moduleType,function(title,module) {
		if(module.canSave(self)) {
			self.savers.push(module.create(self));
		}
	});
	// Sort the savers into priority order
	this.savers.sort(function(a,b) {
		if(a.info.priority < b.info.priority) {
			return -1;
		} else {
			if(a.info.priority > b.info.priority) {
				return +1;
			} else {
				return 0;
			}
		}
	});
};

/*
Invoke the highest priority saver that successfully handles a method
*/
exports.callSaver = function(method /*, args */ ) {
	for(var t=this.savers.length-1; t>=0; t--) {
		var saver = this.savers[t];
		if(saver[method].apply(saver,Array.prototype.slice.call(arguments,1))) {
			return true;
		}
	}
	return false;
};

/*
Save the wiki contents. Options are:
	template: the tiddler containing the template to save
	downloadType: the content type for the saved file
*/
exports.saveWiki = function(options) {
	options = options || {};
	var template = options.template || "$:/core/templates/tiddlywiki5.template.html",
		downloadType = options.downloadType || "text/plain";
	var text = this.renderTiddler(downloadType,template);
	this.callSaver("save",text);
};

/*
Return an array of tiddler titles that match a search string
	text: The text string to search for
	options: see below
Options available:
	titles:  Hashmap or array of tiddler titles to limit search
	exclude: An array of tiddler titles to exclude from the search
	invert: If true returns tiddlers that do not contain the specified string
	caseSensitive: If true forces a case sensitive search
	literal: If true, searches for literal string, rather than separate search terms
*/
exports.search = function(text,options) {
	options = options || {};
	var me = this,t;
	// Convert the search string into a regexp for each term
	var terms, searchTermsRegExps,
		flags = options.caseSensitive ? "" : "i";
	if(options.literal) {
		if(text.length === 0) {
			return [];
		}
		searchTermsRegExps = [new RegExp("(" + $tw.utils.escapeRegExp(text) + ")",flags)];
	} else {
		terms = text.replace(/( +)/g," ").split(" ");
		searchTermsRegExps = [];
		if(terms.length === 0) {
			return [];
		}
		for(t=0; t<terms.length; t++) {
			searchTermsRegExps.push(new RegExp("(" + $tw.utils.escapeRegExp(terms[t]) + ")",flags));
		}
	}
	// Function to check a given tiddler for the search term
	var searchTiddler = function(title) {
		var tiddler = me.getTiddler(title);
		if(!tiddler) {
			return !!options.invert;
		}
		var contentTypeInfo = $tw.config.contentTypeInfo[tiddler.fields.type];
		if(contentTypeInfo ? contentTypeInfo.encoding === "utf8" : true) {
			var match = true;
			for(var t=0; t<searchTermsRegExps.length; t++) {
				// Search title and body
				if(match) {
					match = searchTermsRegExps[t].test(tiddler.fields.title) || searchTermsRegExps[t].test(tiddler.fields.text);
				}
			}
			return options.invert ? !match : match;
		}
		return false;			
	};
	// Loop through all the tiddlers doing the search
	var results = [];
	if($tw.utils.isArray(options.titles)) {
		for(t=0; t<options.titles.length; t++) {
			if(searchTiddler(options.titles[t])) {
				results.push(options.titles[t]);
			}
		}
	} else {
		var source = options.titles || this.tiddlers;
		for(t in source) {
			if(searchTiddler(t)) {
				results.push(t);
			}
		}
	}
	// Remove any of the results we have to exclude
	if(options.exclude) {
		for(t=0; t<options.exclude.length; t++) {
			var p = results.indexOf(options.exclude[t]);
			if(p !== -1) {
				results.splice(p,1);
			}
		}
	}
	return results;
};

/*
Initialise syncers
*/
exports.initSyncers = function() {
	this.syncers = {};
	var self = this;
	$tw.modules.forEachModuleOfType("syncer",function(title,module) {
		if(module.name && module.syncer) {
			self.syncers[module.name] = new module.syncer({
				wiki: self
			});
		}
	});
};

/*
Initialise server connections
*/
exports.initServerConnections = function() {
	this.serverConnections = {};
	var self = this;
	$tw.modules.forEachModuleOfType("serverconnection",function(title,module) {
		// Get the associated syncer
		if(module.syncer) {
			var syncer = self.syncers[module.syncer];
			if(syncer) {
				// Add the connection and save information about it
				var connection = syncer.addConnection(module);
				if(connection instanceof Error) {
					console.log("Error adding connection: " + connection);
				} else {
					self.serverConnections[title] = {
						syncer: syncer,
						connection: connection
					};
				}
			}
		}
	});
};

/*
Invoke all the active server connections
*/
exports.invokeServerConnections = function(method /* ,args */) {
	var args = Array.prototype.slice.call(arguments,1);
	for(var title in this.serverConnections) {
		var connection = this.serverConnections[title];
		connection.syncer[method].apply(connection.syncer,[connection.connection].concat(args));
	}
};

/*
Handle a syncer message
*/
exports.handleSyncerEvent = function(event) {
	for(var syncer in this.syncers) {
		this.syncers[syncer].handleEvent(event);
	}
};

/*
Trigger a load for a tiddler if it is skinny. Returns the text, or undefined if the tiddler is missing, null if the tiddler is being lazily loaded.
*/
exports.getTiddlerText = function(title) {
	var tiddler = this.getTiddler(title);
	// Return undefined if the tiddler isn't found
	if(!tiddler) {
		return undefined;
	}
	if(tiddler.fields.text !== undefined) {
		// Just return the text if we've got it
		return tiddler.fields.text;
	} else {
		// Ask all the server connections to load the tiddler if they can
		this.invokeServerConnections("lazyLoad",title,tiddler);
		// Indicate that the text is being loaded
		return null;
	}
};

})();
