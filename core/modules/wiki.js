/*\
title: $:/core/modules/wiki.js
type: application/javascript
module-type: wikimethod

Extension methods for the $tw.Wiki object

Adds the following properties to the wiki object:

* `eventListeners` is a hashmap by type of arrays of listener functions
* `changedTiddlers` is a hashmap describing changes to named tiddlers since wiki change events were last dispatched. Each entry is a hashmap containing two fields:
	modified: true/false
	deleted: true/false
* `changeCount` is a hashmap by tiddler title containing a numerical index that starts at zero and is incremented each time a tiddler is created changed or deleted
* `caches` is a hashmap by tiddler title containing a further hashmap of named cache objects. Caches are automatically cleared when a tiddler is modified or deleted
* `globalCache` is a hashmap by cache name of cache objects that are cleared whenever any tiddler change occurs

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

var USER_NAME_TITLE = "$:/status/UserName";

/*
Get the value of a text reference. Text references can have any of these forms:
	<tiddlertitle>
	<tiddlertitle>!!<fieldname>
	!!<fieldname> - specifies a field of the current tiddlers
	<tiddlertitle>##<index>
*/
exports.getTextReference = function(textRef,defaultText,currTiddlerTitle) {
	var tr = $tw.utils.parseTextReference(textRef),
		title = tr.title || currTiddlerTitle;
	if(tr.field) {
		var tiddler = this.getTiddler(title);
		if(tr.field === "title") { // Special case so we can return the title of a non-existent tiddler
			return title;
		} else if(tiddler && $tw.utils.hop(tiddler.fields,tr.field)) {
			return tiddler.getFieldString(tr.field);
		} else {
			return defaultText;
		}
	} else if(tr.index) {
		return this.extractTiddlerDataItem(title,tr.index,defaultText);
	} else {
		return this.getTiddlerText(title,defaultText);
	}
};

exports.setTextReference = function(textRef,value,currTiddlerTitle) {
	var tr = $tw.utils.parseTextReference(textRef),
		title,tiddler,fields;
	// Check if it is a reference to a tiddler
	if(tr.title && !tr.field) {
		tiddler = this.getTiddler(tr.title);
		this.addTiddler(new $tw.Tiddler(tiddler,{title: tr.title,text: value},this.getModificationFields()));
	// Else check for a field reference
	} else if(tr.field) {
		title = tr.title || currTiddlerTitle;
		tiddler = this.getTiddler(title);
		if(tiddler) {
			fields = {};
			fields[tr.field] = value;
			this.addTiddler(new $tw.Tiddler(tiddler,fields,this.getModificationFields()));
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
			this.addTiddler(new $tw.Tiddler(tiddler,fields,this.getModificationFields()));
		}
	}
};

exports.addEventListener = function(type,listener) {
	this.eventListeners = this.eventListeners || {};
	this.eventListeners[type] = this.eventListeners[type]  || [];
	this.eventListeners[type].push(listener);	
};

exports.removeEventListener = function(type,listener) {
	var listeners = this.eventListeners[type];
	if(listeners) {
		var p = listeners.indexOf(listener);
		if(p !== -1) {
			listeners.splice(p,1);
		}
	}
};

exports.dispatchEvent = function(type /*, args */) {
	var args = Array.prototype.slice.call(arguments,1),
		listeners = this.eventListeners[type];
	if(listeners) {
		for(var p=0; p<listeners.length; p++) {
			var listener = listeners[p];
			listener.apply(listener,args);
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
exports.enqueueTiddlerEvent = function(title,isDeleted) {
	// Record the touch in the list of changed tiddlers
	this.changedTiddlers = this.changedTiddlers || {};
	this.changedTiddlers[title] = this.changedTiddlers[title] || {};
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
		var self = this;
		$tw.utils.nextTick(function() {
			var changes = self.changedTiddlers;
			self.changedTiddlers = {};
			self.eventsTriggered = false;
			self.dispatchEvent("change",changes);
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
	this.clearGlobalCache();
	this.enqueueTiddlerEvent(title,true);
};

exports.tiddlerExists = function(title) {
	return !!this.tiddlers[title];
};

/*
Generate an unused title from the specified base
*/
exports.generateNewTitle = function(baseTitle) {
	var c = 0,
	    title = baseTitle;
	while(this.tiddlerExists(title)) {
		title = baseTitle + " " + (++c);
	};
	return title;
};

exports.isSystemTiddler = function(title) {
	return title.indexOf("$:/") === 0;
};

exports.isTemporaryTiddler = function(title) {
	return title.indexOf("$:/temp/") === 0;
};

/*
Determines if a tiddler is a shadow tiddler, regardless of whether it has been overridden by a real tiddler
*/
exports.isShadowTiddler = function(title) {
	return $tw.utils.hop(this.shadowTiddlers,title);
};

exports.addTiddler = function(tiddler) {
	// Check if we're passed a fields hashmap instead of a tiddler
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = new $tw.Tiddler(tiddler);
	}
	// Get the title
	var title = tiddler.fields.title;
	// Save the tiddler
	if(title) {
		this.tiddlers[title] = tiddler;
		this.clearCache(title);
		this.clearGlobalCache();
		this.enqueueTiddlerEvent(title);
	}
};

/*
Like addTiddler() except it will silently reject any plugin tiddlers that are older than the currently loaded version. Returns true if the tiddler was imported
*/
exports.importTiddler = function(tiddler) {
	var existingTiddler = this.getTiddler(tiddler.fields.title);
	// Check if we're dealing with a plugin
	if(tiddler && tiddler.hasField("plugin-type") && tiddler.hasField("version") && existingTiddler && existingTiddler.hasField("plugin-type") && existingTiddler.hasField("version")) {
		// Reject the incoming plugin if it is older
		if($tw.utils.checkVersions(existingTiddler.fields.version,tiddler.fields.version)) {
			return false;
		}
	}
	// Fall through to adding the tiddler
	this.addTiddler(tiddler);
	return true;
};

/*
Return a hashmap of the fields that should be set when a tiddler is created
*/
exports.getCreationFields = function() {
	var fields = {
			created: new Date()
		},
		creator = this.getTiddlerText(USER_NAME_TITLE);
	if(creator) {
		fields.creator = creator;
	}
	return fields;
};

/*
Return a hashmap of the fields that should be set when a tiddler is modified
*/
exports.getModificationFields = function() {
	var fields = {},
		modifier = this.getTiddlerText(USER_NAME_TITLE);
	fields.modified = new Date();
	if(modifier) {
		fields.modifier = modifier;
	}
	return fields;
};

/*
Return a sorted array of tiddler titles.  Options include:
sortField: field to sort by
excludeTag: tag to exclude
includeSystem: whether to include system tiddlers (defaults to false)
*/
exports.getTiddlers = function(options) {
	options = options || {};
	var self = this,
		sortField = options.sortField || "title",
		tiddlers = [], t, titles = [];
	for(t in this.tiddlers) {
		if($tw.utils.hop(this.tiddlers,t)) {
			if(options.includeSystem || !this.isSystemTiddler(t)) {
				if(!options.excludeTag || !this.tiddlers[t].hasTag(excludeTag)) {
					tiddlers.push(this.tiddlers[t]);
				}
			}
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
		titles.push(tiddlers[t].fields.title);
	}
	return titles;
};

exports.countTiddlers = function(excludeTag) {
	var tiddlers = this.getTiddlers({excludeTag: excludeTag});
	return $tw.utils.count(tiddlers);
};

/*
Sort an array of tiddler titles by a specified field
	titles: array of titles (sorted in place)
	sortField: name of field to sort by
	isDescending: true if the sort should be descending
	isCaseSensitive: true if the sort should consider upper and lower case letters to be different
*/
exports.sortTiddlers = function(titles,sortField,isDescending,isCaseSensitive,isNumeric) {
	var self = this;
	titles.sort(function(a,b) {
		if(sortField !== "title") {
			a = self.getTiddler(a).fields[sortField] || "";
			b = self.getTiddler(b).fields[sortField] || "";
		}
		if(!isNumeric || isNaN(a) || isNaN(b)) {
			if(!isCaseSensitive) {
				if(typeof a === "string") {
					a = a.toLowerCase();
				}
				if(typeof b === "string") {
					b = b.toLowerCase();
				}
			}
		}
		else {
			a-= 0;
			b-= 0;
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

/*
For every tiddler invoke a callback(title,tiddler) with `this` set to the wiki object. Options include:
sortField: field to sort by
excludeTag: tag to exclude
includeSystem: whether to include system tiddlers (defaults to false)
*/
exports.forEachTiddler = function(/* [options,]callback */) {
	var arg = 0,
		options = arguments.length >= 2 ? arguments[arg++] : {},
		callback = arguments[arg++],
		titles = this.getTiddlers(options),
		t, tiddler;
	for(t=0; t<titles.length; t++) {
		tiddler = this.tiddlers[titles[t]];
		if(tiddler) {
			callback.call(this,tiddler.fields.title,tiddler);
		}
	}
};

/*
Return an array of tiddler titles that are directly linked from the specified tiddler
*/
exports.getTiddlerLinks = function(title) {
	var self = this;
	// We'll cache the links so they only get computed if the tiddler changes
	return this.getCacheForTiddler(title,"links",function() {
		// Parse the tiddler
		var parser = self.parseTiddler(title);
		// Count up the links
		var links = [],
			checkParseTree = function(parseTree) {
				for(var t=0; t<parseTree.length; t++) {
					var parseTreeNode = parseTree[t];
					if(parseTreeNode.type === "link" && parseTreeNode.attributes.to && parseTreeNode.attributes.to.type === "string") {
						var value = parseTreeNode.attributes.to.value;
						if(links.indexOf(value) === -1) {
							links.push(value);
						}
					}
					if(parseTreeNode.children) {
						checkParseTree(parseTreeNode.children);
					}
				}
			};
		if(parser) {
			checkParseTree(parser.tree);
		}
		return links;
	});
};

/*
Return an array of tiddler titles that link to the specified tiddler
*/
exports.getTiddlerBacklinks = function(targetTitle) {
	var self = this,
		backlinks = [];
	this.forEachTiddler(function(title,tiddler) {
		var links = self.getTiddlerLinks(title);
		if(links.indexOf(targetTitle) !== -1) {
			backlinks.push(title);
		}
	});
	return backlinks;
};

/*
Return a hashmap of tiddler titles that are referenced but not defined. Each value is the number of times the missing tiddler is referenced
*/
exports.getMissingTitles = function() {
	var self = this,
		missing = [];
// We should cache the missing tiddler list, even if we recreate it every time any tiddler is modified
	this.forEachTiddler(function(title,tiddler) {
		var links = self.getTiddlerLinks(title);
		$tw.utils.each(links,function(link) {
			if((!self.tiddlerExists(link) && !self.isShadowTiddler(link)) && missing.indexOf(link) === -1) {
				missing.push(link);
			}
		});
	});
	return missing;
};

exports.getOrphanTitles = function() {
	var self = this,
		orphans = this.getTiddlers();
	this.forEachTiddler(function(title,tiddler) {
		var links = self.getTiddlerLinks(title);
		$tw.utils.each(links,function(link) {
			var p = orphans.indexOf(link);
			if(p !== -1) {
				orphans.splice(p,1);
			}
		});
	});
	return orphans; // Todo
};

exports.getSystemTitles = function() {
	var titles = [];
	for(var title in this.tiddlers) {
		if(this.isSystemTiddler(title)) {
			titles.push(title);
		}
	}
	titles.sort();
	return titles;
};

exports.getShadowTitles = function() {
	var titles = [];
	for(var title in this.shadowTiddlers) {
		titles.push(title);
	}
	titles.sort();
	return titles;
};

/*
Retrieves a list of the tiddler titles that are tagged with a given tag
*/
exports.getTiddlersWithTag = function(tag) {
	var self = this;
	return this.getGlobalCache("taglist-" + tag,function() {
		var tagmap = self.getTagMap();
		return self.sortByList(tagmap[tag],tag);
	});
};

/*
Get a hashmap by tag of arrays of tiddler titles
*/
exports.getTagMap = function() {
	var self = this;
	return this.getGlobalCache("tagmap",function() {
		var tags = {};
		// Collect up all the tags
		for(var title in self.tiddlers) {
			var tiddler = self.tiddlers[title];
			if(tiddler.fields.tags) {
				for(var index=0; index<tiddler.fields.tags.length; index++) {
					var tag = tiddler.fields.tags[index];
					if(tags[tag]) {
						tags[tag].push(title)
					} else {
						tags[tag] = [title];
					}
				}
			}
		}
		return tags;
	});
};

/*
Lookup a given tiddler and return a list of all the tiddlers that include it in their list
*/
exports.findListingsOfTiddler = function(targetTitle) {
	// Get the list associated with the tag
	var titles = [];
	for(var title in this.tiddlers) {
		var tiddler = this.tiddlers[title];
		if($tw.utils.isArray(tiddler.fields.list) && tiddler.fields.list.indexOf(targetTitle) !== -1) {
			titles.push(title);
		}
	}
	return titles;
};

/*
Sorts an array of tiddler titles according to an ordered list
*/
exports.sortByList = function(array,listTitle) {
	var list = this.getTiddlerList(listTitle);
	if(!array || array.length === 0) {
		return [];
	} else if(list) {
		var titles = [], t, title;
		// First place any entries that are present in the list
		for(t=0; t<list.length; t++) {
			title = list[t];
			if(array.indexOf(title) !== -1) {
				titles.push(title);
			}
		}
		// Then place any remaining entries
		for(t=0; t<array.length; t++) {
			title = array[t];
			if(list.indexOf(title) === -1) {
				titles.push(title);
			}
		}
		return titles;
	} else {
		return array;
	}
};

/*
Retrieve a tiddler as a JSON string of the fields
*/
exports.getTiddlerAsJson = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		var fields = {};
		$tw.utils.each(tiddler.fields,function(value,name) {
			fields[name] = tiddler.getFieldString(name);
		});
		return JSON.stringify(fields);
	} else {
		return JSON.stringify({title: title});
	}
};

/*
Get a tiddlers content as a JavaScript object. How this is done depends on the type of the tiddler:

application/json: the tiddler JSON is parsed into an object
application/x-tiddler-dictionary: the tiddler is parsed as sequence of name:value pairs

Other types currently just return null.
*/
exports.getTiddlerData = function(title,defaultData) {
	var tiddler = this.getTiddler(title),
		data;
	if(tiddler && tiddler.fields.text) {
		switch(tiddler.fields.type) {
			case "application/json":
				// JSON tiddler
				try {
					data = JSON.parse(tiddler.fields.text);
				} catch(ex) {
					return defaultData;
				}
				return data;
			case "application/x-tiddler-dictionary":
				return $tw.utils.parseFields(tiddler.fields.text);
		}
	}
	return defaultData;
};

/*
Extract an indexed field from within a data tiddler
*/
exports.extractTiddlerDataItem = function(title,index,defaultText) {
	var data = this.getTiddlerData(title,{}),
		text;
	if(data && $tw.utils.hop(data,index)) {
		text = data[index];
	}
	if(typeof text === "string" || typeof text === "number") {
		return text.toString();
	} else {
		return defaultText;
	}
};

/*
Set a tiddlers content to a JavaScript object. Currently this is done by setting the tiddler's type to "application/json" and setting the text to the JSON text of the data.
*/
exports.setTiddlerData = function(title,data) {
	var tiddler = this.getTiddler(title);
	this.addTiddler(new $tw.Tiddler(tiddler,{title: title, type: "application/json", text: JSON.stringify(data,null,$tw.config.preferences.jsonSpaces)},this.getModificationFields()));
};

/*
Return the content of a tiddler as an array containing each line
*/
exports.getTiddlerList = function(title, field, index) {
	if (field) {
		var tiddler = this.getTiddler(title);
		if(tiddler) { 
			return $tw.utils.parseStringArray(tiddler.fields[field]);
		}
	}
	else if(index) {
		 return $tw.utils.parseStringArray(this.extractTiddlerDataItem(title,index,""));
	}
	var tiddler = this.getTiddler(title);
	if(tiddler && $tw.utils.isArray(tiddler.fields.list)) {
		return tiddler.fields.list.slice(0);
	}
	return [];
};


// Return a named global cache object. Global cache objects are cleared whenever a tiddler change occurs
exports.getGlobalCache = function(cacheName,initializer) {
	this.globalCache = this.globalCache || {};
	if($tw.utils.hop(this.globalCache,cacheName)) {
		return this.globalCache[cacheName];
	} else {
		this.globalCache[cacheName] = initializer();
		return this.globalCache[cacheName];
	}
};

exports.clearGlobalCache = function() {
	this.globalCache = {};
}

// Return the named cache object for a tiddler. If the cache doesn't exist then the initializer function is invoked to create it
exports.getCacheForTiddler = function(title,cacheName,initializer) {

// Temporarily disable caching so that tweakParseTreeNode() works
return initializer();

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
	$tw.Wiki.parsers = {};
	var self = this;
	$tw.modules.forEachModuleOfType("parser",function(title,module) {
		for(var f in module) {
			if($tw.utils.hop(module,f)) {
				$tw.Wiki.parsers[f] = module[f]; // Store the parser class
			}
		}
	});
};

/*
Parse a block of text of a specified MIME type
	type: content type of text to be parsed
	text: text
	options: see below
Options include:
	parseAsInline: if true, the text of the tiddler will be parsed as an inline run
*/
exports.old_parseText = function(type,text,options) {
	options = options || {};
	// Select a parser
	var Parser = $tw.Wiki.parsers[type];
	if(!Parser && $tw.config.fileExtensionInfo[type]) {
		Parser = $tw.Wiki.parsers[$tw.config.fileExtensionInfo[type].type];
	}
	if(!Parser) {
		Parser = $tw.Wiki.parsers[options.defaultType || "text/vnd.tiddlywiki"];
	}
	if(!Parser) {
		return null;
	}
	// Return the parser instance
	return new Parser(type,text,{
		parseAsInline: options.parseAsInline,
		wiki: this
	});
};

/*
Parse a tiddler according to its MIME type
*/
exports.old_parseTiddler = function(title,options) {
	options = options || {};
	var cacheType = options.parseAsInline ? "newInlineParseTree" : "newBlockParseTree",
		tiddler = this.getTiddler(title),
		self = this;
	return tiddler ? this.getCacheForTiddler(title,cacheType,function() {
			return self.old_parseText(tiddler.fields.type,tiddler.fields.text,options);
		}) : null;
};

// We need to tweak parse trees generated by the existing parser because of the change from {type:"element",tag:"$tiddler",...} to {type:"tiddler",...}
var tweakParseTreeNode = function(node) {
	if(node.type === "element" && node.tag.charAt(0) === "$") {
		node.type = node.tag.substr(1);
		delete node.tag;
	}
	tweakParseTreeNodes(node.children);
};

var tweakParseTreeNodes = function(nodeList) {
	$tw.utils.each(nodeList,tweakParseTreeNode);
};

var tweakMacroDefinition = function(nodeList) {
	if(nodeList && nodeList[0] && nodeList[0].type === "macrodef") {
		nodeList[0].type = "set";
		nodeList[0].attributes = {
			name: {type: "string", value: nodeList[0].name},
			value: {type: "string", value: nodeList[0].text}
		};
		nodeList[0].children = nodeList.slice(1);
		nodeList.splice(1,nodeList.length-1);
		tweakMacroDefinition(nodeList[0].children);
	}
};

var tweakParser = function(parser) {
	// Move any macro definitions to contain the body tree
	tweakMacroDefinition(parser.tree);
	// Tweak widgets
	tweakParseTreeNodes(parser.tree);
};

exports.parseText = function(type,text,options) {
	var parser = this.old_parseText(type,text,options);
	if(parser) {
		tweakParser(parser)
	};
	return parser;
};

exports.parseTiddler = function(title,options) {
	var parser = this.old_parseTiddler(title,options);
	if(parser) {
		tweakParser(parser)
	};
	return parser;
};

exports.parseTextReference = function(title,field,index,options) {
	if(field === "text" || (!field && !index)) {
		// Force the tiddler to be lazily loaded
		this.getTiddlerText(title);
		// Parse it
		return this.parseTiddler(title,options);
	} else {
		var tiddler,text;
		if(field) {
			tiddler = this.getTiddler(title);
			text = tiddler ? tiddler.fields[field] : "";
			if(text === undefined) {
				text = "";
			}
			return this.parseText("text/vnd.tiddlywiki",text.toString(),options);
		} else if(index) {
			text = this.extractTiddlerDataItem(title,index,"");
			return this.parseText("text/vnd.tiddlywiki",text,options);
		}
	}
};

/*
Make a widget tree for a parse tree
parser: parser object
options: see below
Options include:
document: optional document to use
variables: hashmap of variables to set
parentWidget: optional parent widget for the root node
*/
exports.makeWidget = function(parser,options) {
	options = options || {};
	var widgetNode = {
			type: "widget",
			children: []
		},
		currWidgetNode = widgetNode;
	// Create set variable widgets for each variable
	$tw.utils.each(options.variables,function(value,name) {
		var setVariableWidget = {
			type: "set",
			attributes: {
				name: {type: "string", value: name},
				value: {type: "string", value: value}
			},
			children: []
		};
		currWidgetNode.children = [setVariableWidget];
		currWidgetNode = setVariableWidget;
	});
	// Add in the supplied parse tree nodes
	currWidgetNode.children = parser ? parser.tree : [];
	// Create the widget
	return new widget.widget(widgetNode,{
		wiki: this,
		document: options.document || $tw.fakeDocument,
		parentWidget: options.parentWidget
	});
};

/*
Parse text in a specified format and render it into another format
	outputType: content type for the output
	textType: content type of the input text
	text: input text
	options: see below
Options include:
variables: hashmap of variables to set
parentWidget: optional parent widget for the root node
*/
exports.renderText = function(outputType,textType,text,options) {
	options = options || {};
	var parser = this.parseText(textType,text,options),
		widgetNode = this.makeWidget(parser,options);
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return outputType === "text/html" ? container.innerHTML : container.textContent;
};

/*
Parse text from a tiddler and render it into another format
	outputType: content type for the output
	title: title of the tiddler to be rendered
	options: see below
Options include:
variables: hashmap of variables to set
parentWidget: optional parent widget for the root node
*/
exports.renderTiddler = function(outputType,title,options) {
	options = options || {};
	var parser = this.parseTiddler(title),
		widgetNode = this.makeWidget(parser,options);
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return outputType === "text/html" ? container.innerHTML : container.textContent;
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
	method: "save" or "download"
	template: the tiddler containing the template to save
	downloadType: the content type for the saved file
*/
exports.saveWiki = function(options) {
	options = options || {};
	var method = options.method || "save",
		template = options.template || "$:/core/save/all",
		downloadType = options.downloadType || "text/plain";
	var text = this.renderTiddler(downloadType,template);
	this.callSaver("save",text,method,function(err) {
		if(err) {
			alert("Error while saving:\n\n" + err);
		} else {
			$tw.notifier.display("$:/messages/Saved");
		}
	});
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
	var self = this,t;
	// Convert the search string into a regexp for each term
	var terms, searchTermsRegExps,
		flags = options.caseSensitive ? "" : "i";
	if(options.literal) {
		if(text.length === 0) {
			searchTermsRegExps = null;
		} else {
			searchTermsRegExps = [new RegExp("(" + $tw.utils.escapeRegExp(text) + ")",flags)];
		}
	} else {
		terms = text.split(/ +/);
		if(terms.length === 1 && terms[0] === "") {
			searchTermsRegExps = null;
		} else {
			searchTermsRegExps = [];
			for(t=0; t<terms.length; t++) {
				searchTermsRegExps.push(new RegExp("(" + $tw.utils.escapeRegExp(terms[t]) + ")",flags));
			}
		}
	}
	// Function to check a given tiddler for the search term
	var searchTiddler = function(title) {
		if(!searchTermsRegExps) {
			return true;
		}
		var tiddler = self.getTiddler(title);
		if(!tiddler) {
			tiddler = new $tw.Tiddler({title: title, text: "", type: "text/vnd.tiddlywiki"});
		}
		var contentTypeInfo = $tw.config.contentTypeInfo[tiddler.fields.type] || $tw.config.contentTypeInfo["text/vnd.tiddlywiki"],
			match;
		for(var t=0; t<searchTermsRegExps.length; t++) {
			// Search title, tags and body
			match = false;
			if(contentTypeInfo.encoding === "utf8") {
				match = match || searchTermsRegExps[t].test(tiddler.fields.text);
			}
			var tags = tiddler.fields.tags ? tiddler.fields.tags.join("\0") : "";
			match = match || searchTermsRegExps[t].test(tags) || searchTermsRegExps[t].test(tiddler.fields.title);
			if(!match) {
				return false;
			}
		}
		return true;
	};
	// Loop through all the tiddlers doing the search
	var results = [];
	if($tw.utils.isArray(options.titles)) {
		for(t=0; t<options.titles.length; t++) {
			if(!!searchTiddler(options.titles[t]) === !options.invert) {
				results.push(options.titles[t]);
			}
		}
	} else {
		var source = options.titles || this.tiddlers;
		for(t in source) {
			if(!!searchTiddler(t) === !options.invert) {
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
Trigger a load for a tiddler if it is skinny. Returns the text, or undefined if the tiddler is missing, null if the tiddler is being lazily loaded.
*/
exports.getTiddlerText = function(title,defaultText) {
	var tiddler = this.getTiddler(title);
	// Return undefined if the tiddler isn't found
	if(!tiddler) {
		return defaultText;
	}
	if(tiddler.fields.text !== undefined) {
		// Just return the text if we've got it
		return tiddler.fields.text;
	} else {
		// Tell any listeners about the need to lazily load this tiddler
		this.dispatchEvent("lazyLoad",title);
		// Indicate that the text is being loaded
		return null;
	}
};

/*
Read an array of browser File objects, invoking callback(tiddlerFieldsArray) once they're all read
*/
exports.readFiles = function(files,callback) {
	var result = [],
		outstanding = files.length;
	for(var f=0; f<files.length; f++) {
		this.readFile(files[f],function(tiddlerFieldsArray) {
			result.push.apply(result,tiddlerFieldsArray);
			if(--outstanding === 0) {
				callback(result);
			}
		});
	};
	return files.length;
};

/*
Read a browser File object, invoking callback(tiddlerFieldsArray) with an array of tiddler fields objects
*/
exports.readFile = function(file,callback) {
	// Get the type, falling back to the filename extension
	var self = this,
		type = file.type;
	if(type === "" || !type) {
		var dotPos = file.name.lastIndexOf(".");
		if(dotPos !== -1) {
			var fileExtensionInfo = $tw.config.fileExtensionInfo[file.name.substr(dotPos)];
			if(fileExtensionInfo) {
				type = fileExtensionInfo.type;
			}
		}
	}
	// Figure out if we're reading a binary file
	var contentTypeInfo = $tw.config.contentTypeInfo[type],
		isBinary = contentTypeInfo ? contentTypeInfo.encoding === "base64" : false;
	// Create the FileReader
	var reader = new FileReader();
	// Onload
	reader.onload = function(event) {
		// Deserialise the file contents
		var text = event.target.result,
			tiddlerFields = {title: file.name || "Untitled", type: type};
		// Are we binary?
		if(isBinary) {
			// The base64 section starts after the first comma in the data URI
			var commaPos = text.indexOf(",");
			if(commaPos !== -1) {
				tiddlerFields.text = text.substr(commaPos+1);
				callback([tiddlerFields]);
			}
		} else {
			// Check whether this is an encrypted TiddlyWiki file
			var encryptedJson = $tw.utils.extractEncryptedStoreArea(text);
			if(encryptedJson) {
				// If so, attempt to decrypt it with the current password
				$tw.utils.decryptStoreAreaInteractive(encryptedJson,function(tiddlers) {
					callback(tiddlers);
				});
			} else {
				// Otherwise, just try to deserialise any tiddlers in the file
				callback(self.deserializeTiddlers(type,text,tiddlerFields));
			}
		}
	};
	// Kick off the read
	if(isBinary) {
		reader.readAsDataURL(file);
	} else {
		reader.readAsText(file);
	}
};

})();
