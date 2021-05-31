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

var USER_NAME_TITLE = "$:/status/UserName",
	TIMESTAMP_DISABLE_TITLE = "$:/config/TimestampDisable";

/*
Add available indexers to this wiki
*/
exports.addIndexersToWiki = function() {
	var self = this;
	$tw.utils.each($tw.modules.applyMethods("indexer"),function(Indexer,name) {
		self.addIndexer(new Indexer(self),name);
	});
};

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
		title = tr.title || currTiddlerTitle;
	this.setText(title,tr.field,tr.index,value);
};

exports.setText = function(title,field,index,value,options) {
	options = options || {};
	var creationFields = options.suppressTimestamp ? {} : this.getCreationFields(),
		modificationFields = options.suppressTimestamp ? {} : this.getModificationFields();
	// Check if it is a reference to a tiddler field
	if(index) {
		var data = this.getTiddlerData(title,Object.create(null));
		if(value !== undefined) {
			data[index] = value;
		} else {
			delete data[index];
		}
		this.setTiddlerData(title,data,modificationFields);
	} else {
		var tiddler = this.getTiddler(title),
			fields = {title: title};
		fields[field || "text"] = value;
		this.addTiddler(new $tw.Tiddler(creationFields,tiddler,fields,modificationFields));
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
			fields = Object.create(null);
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
		true if the tiddler has been deleted
*/
exports.enqueueTiddlerEvent = function(title,isDeleted) {
	// Record the touch in the list of changed tiddlers
	this.changedTiddlers = this.changedTiddlers || Object.create(null);
	this.changedTiddlers[title] = this.changedTiddlers[title] || Object.create(null);
	this.changedTiddlers[title][isDeleted ? "deleted" : "modified"] = true;
	// Increment the change count
	this.changeCount = this.changeCount || Object.create(null);
	if($tw.utils.hop(this.changeCount,title)) {
		this.changeCount[title]++;
	} else {
		this.changeCount[title] = 1;
	}
	// Trigger events
	this.eventListeners = this.eventListeners || {};
	if(!this.eventsTriggered) {
		var self = this;
		$tw.utils.nextTick(function() {
			var changes = self.changedTiddlers;
			self.changedTiddlers = Object.create(null);
			self.eventsTriggered = false;
			if($tw.utils.count(changes) > 0) {
				self.dispatchEvent("change",changes);
			}
		});
		this.eventsTriggered = true;
	}
};

exports.getSizeOfTiddlerEventQueue = function() {
	return $tw.utils.count(this.changedTiddlers);
};

exports.clearTiddlerEventQueue = function() {
	this.changedTiddlers = Object.create(null);
	this.changeCount = Object.create(null);
};

exports.getChangeCount = function(title) {
	this.changeCount = this.changeCount || Object.create(null);
	if($tw.utils.hop(this.changeCount,title)) {
		return this.changeCount[title];
	} else {
		return 0;
	}
};

/*
Generate an unused title from the specified base
options.prefix must be a string
*/
exports.generateNewTitle = function(baseTitle,options) {
	options = options || {};
	var c = 0,
		title = baseTitle,
		template = options.template,
		prefix = (typeof(options.prefix) === "string") ? options.prefix : " ";
	if (template) {
		// "count" is important to avoid an endless loop in while(...)!!
		template = (/\$count:?(\d+)?\$/i.test(template)) ? template : template + "$count$";
		title = $tw.utils.formatTitleString(template,{"base":baseTitle,"separator":prefix,"counter":c});
		while(this.tiddlerExists(title) || this.isShadowTiddler(title) || this.findDraft(title)) {
			title = $tw.utils.formatTitleString(template,{"base":baseTitle,"separator":prefix,"counter":(++c)});
		}
	} else {
		while(this.tiddlerExists(title) || this.isShadowTiddler(title) || this.findDraft(title)) {
			title = baseTitle + prefix + (++c);
		}
	}
	return title;
};

exports.isSystemTiddler = function(title) {
	return title && title.indexOf("$:/") === 0;
};

exports.isTemporaryTiddler = function(title) {
	return title && title.indexOf("$:/temp/") === 0;
};

exports.isVolatileTiddler = function(title) {
	return title && title.indexOf("$:/temp/volatile/") === 0;
};

exports.isImageTiddler = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		var contentTypeInfo = $tw.config.contentTypeInfo[tiddler.fields.type || "text/vnd.tiddlywiki"];
		return !!contentTypeInfo && contentTypeInfo.flags.indexOf("image") !== -1;
	} else {
		return null;
	}
};

exports.isBinaryTiddler = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		var contentTypeInfo = $tw.config.contentTypeInfo[tiddler.fields.type || "text/vnd.tiddlywiki"];
		return !!contentTypeInfo && contentTypeInfo.encoding === "base64";
	} else {
		return null;
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
		if(!$tw.utils.checkVersions(tiddler.fields.version,existingTiddler.fields.version)) {
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
	if(this.getTiddlerText(TIMESTAMP_DISABLE_TITLE,"").toLowerCase() !== "yes") {
		var fields = {
				created: new Date()
			},
			creator = this.getTiddlerText(USER_NAME_TITLE);
		if(creator) {
			fields.creator = creator;
		}
		return fields;
	} else {
		return {};
	}
};

/*
Return a hashmap of the fields that should be set when a tiddler is modified
*/
exports.getModificationFields = function() {
	if(this.getTiddlerText(TIMESTAMP_DISABLE_TITLE,"").toLowerCase() !== "yes") {
		var fields = Object.create(null),
			modifier = this.getTiddlerText(USER_NAME_TITLE);
		fields.modified = new Date();
		if(modifier) {
			fields.modifier = modifier;
		}
		return fields;
	} else {
		return {};
	}
};

/*
Return a sorted array of tiddler titles.  Options include:
sortField: field to sort by
excludeTag: tag to exclude
includeSystem: whether to include system tiddlers (defaults to false)
*/
exports.getTiddlers = function(options) {
	options = options || Object.create(null);
	var self = this,
		sortField = options.sortField || "title",
		tiddlers = [], t, titles = [];
	this.each(function(tiddler,title) {
		if(options.includeSystem || !self.isSystemTiddler(title)) {
			if(!options.excludeTag || !tiddler.hasTag(options.excludeTag)) {
				tiddlers.push(tiddler);
			}
		}
	});
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
Returns a function iterator(callback) that iterates through the specified titles, and invokes the callback with callback(tiddler,title)
*/
exports.makeTiddlerIterator = function(titles) {
	var self = this;
	if(!$tw.utils.isArray(titles)) {
		titles = Object.keys(titles);
	} else {
		titles = titles.slice(0);
	}
	return function(callback) {
		titles.forEach(function(title) {
			callback(self.getTiddler(title),title);
		});
	};
};

/*
Sort an array of tiddler titles by a specified field
	titles: array of titles (sorted in place)
	sortField: name of field to sort by
	isDescending: true if the sort should be descending
	isCaseSensitive: true if the sort should consider upper and lower case letters to be different
*/
exports.sortTiddlers = function(titles,sortField,isDescending,isCaseSensitive,isNumeric,isAlphaNumeric) {
	var self = this;
	titles.sort(function(a,b) {
		var x,y,
			compareNumbers = function(x,y) {
				var result = 
					isNaN(x) && !isNaN(y) ? (isDescending ? -1 : 1) :
					!isNaN(x) && isNaN(y) ? (isDescending ? 1 : -1) :
											(isDescending ? y - x :  x - y);
				return result;
			};
		if(sortField !== "title") {
			var tiddlerA = self.getTiddler(a),
				tiddlerB = self.getTiddler(b);
			if(tiddlerA) {
				a = tiddlerA.getFieldString(sortField) || "";
			} else {
				a = "";
			}
			if(tiddlerB) {
				b = tiddlerB.getFieldString(sortField) || "";
			} else {
				b = "";
			}
		}
		x = Number(a);
		y = Number(b);
		if(isNumeric && (!isNaN(x) || !isNaN(y))) {
			return compareNumbers(x,y);
		} else if($tw.utils.isDate(a) && $tw.utils.isDate(b)) {
			return isDescending ? b - a : a - b;
		} else if(isAlphaNumeric) {
			return isDescending ? b.localeCompare(a,undefined,{numeric: true,sensitivity: "base"}) : a.localeCompare(b,undefined,{numeric: true,sensitivity: "base"});
		} else {
			a = String(a);
			b = String(b);
			if(!isCaseSensitive) {
				a = a.toLowerCase();
				b = b.toLowerCase();
			}
			return isDescending ? b.localeCompare(a) : a.localeCompare(b);
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
		tiddler = this.getTiddler(titles[t]);
		if(tiddler) {
			callback.call(this,tiddler.fields.title,tiddler);
		}
	}
};

/*
Return an array of tiddler titles that are directly linked within the given parse tree
 */
exports.extractLinks = function(parseTreeRoot) {
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
	checkParseTree(parseTreeRoot);
	return links;
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
		if(parser) {
			return self.extractLinks(parser.tree);
		}
		return [];
	});
};

/*
Return an array of tiddler titles that link to the specified tiddler
*/
exports.getTiddlerBacklinks = function(targetTitle) {
	var self = this,
		backlinksIndexer = this.getIndexer("BacklinksIndexer"),
		backlinks = backlinksIndexer && backlinksIndexer.lookup(targetTitle);

	if(!backlinks) {
		backlinks = [];
		this.forEachTiddler(function(title,tiddler) {
			var links = self.getTiddlerLinks(title);
			if(links.indexOf(targetTitle) !== -1) {
				backlinks.push(title);
			}
		});
	}
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

/*
Retrieves a list of the tiddler titles that are tagged with a given tag
*/
exports.getTiddlersWithTag = function(tag) {
	// Try to use the indexer
	var self = this,
		tagIndexer = this.getIndexer("TagIndexer"),
		results = tagIndexer && tagIndexer.subIndexers[3].lookup(tag);
	if(!results) {
		// If not available, perform a manual scan
		results = this.getGlobalCache("taglist-" + tag,function() {
			var tagmap = self.getTagMap();
			return self.sortByList(tagmap[tag],tag);
		});
	}
	return results;
};

/*
Get a hashmap by tag of arrays of tiddler titles
*/
exports.getTagMap = function() {
	var self = this;
	return this.getGlobalCache("tagmap",function() {
		var tags = Object.create(null),
			storeTags = function(tagArray,title) {
				if(tagArray) {
					for(var index=0; index<tagArray.length; index++) {
						var tag = tagArray[index];
						if($tw.utils.hop(tags,tag)) {
							tags[tag].push(title);
						} else {
							tags[tag] = [title];
						}
					}
				}
			},
			title, tiddler;
		// Collect up all the tags
		self.eachShadow(function(tiddler,title) {
			if(!self.tiddlerExists(title)) {
				tiddler = self.getTiddler(title);
				storeTags(tiddler.fields.tags,title);
			}
		});
		self.each(function(tiddler,title) {
			storeTags(tiddler.fields.tags,title);
		});
		return tags;
	});
};

/*
Lookup a given tiddler and return a list of all the tiddlers that include it in the specified list field
*/
exports.findListingsOfTiddler = function(targetTitle,fieldName) {
	fieldName = fieldName || "list";
	var titles = [];
	this.each(function(tiddler,title) {
		var list = $tw.utils.parseStringArray(tiddler.fields[fieldName]);
		if(list && list.indexOf(targetTitle) !== -1) {
			titles.push(title);
		}
	});
	return titles;
};

/*
Sorts an array of tiddler titles according to an ordered list
*/
exports.sortByList = function(array,listTitle) {
	var self = this,
		replacedTitles = Object.create(null);
	// Given a title, this function will place it in the correct location
	// within titles.
	function moveItemInList(title) {
		if(!$tw.utils.hop(replacedTitles, title)) {
			replacedTitles[title] = true;
			var newPos = -1,
				tiddler = self.getTiddler(title);
			if(tiddler) {
				var beforeTitle = tiddler.fields["list-before"],
					afterTitle = tiddler.fields["list-after"];
				if(beforeTitle === "") {
					newPos = 0;
				} else if(afterTitle === "") {
					newPos = titles.length;
				} else if(beforeTitle) {
					// if this title is placed relative
					// to another title, make sure that
					// title is placed before we place
					// this one.
					moveItemInList(beforeTitle);
					newPos = titles.indexOf(beforeTitle);
				} else if(afterTitle) {
					// Same deal
					moveItemInList(afterTitle);
					newPos = titles.indexOf(afterTitle);
					if(newPos >= 0) {
						++newPos;
					}
				}
				// If a new position is specified, let's move it
				if (newPos !== -1) {
					// get its current Pos, and make sure
					// sure that it's _actually_ in the list
					// and that it would _actually_ move
					// (#4275) We don't bother calling
					//         indexOf unless we have a new
					//         position to work with
					var currPos = titles.indexOf(title);
					if(currPos >= 0 && newPos !== currPos) {
						// move it!
						titles.splice(currPos,1);
						if(newPos >= currPos) {
							newPos--;
						}
						titles.splice(newPos,0,title);
					}
				}
			}
		}
	}
	var list = this.getTiddlerList(listTitle);
	if(!array || array.length === 0) {
		return [];
	} else {
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
		// Finally obey the list-before and list-after fields of each tiddler in turn
		var sortedTitles = titles.slice(0);
		for(t=0; t<sortedTitles.length; t++) {
			title = sortedTitles[t];
			moveItemInList(title);
		}
		return titles;
	}
};

exports.getSubTiddler = function(title,subTiddlerTitle) {
	var bundleInfo = this.getPluginInfo(title) || this.getTiddlerDataCached(title);
	if(bundleInfo && bundleInfo.tiddlers) {
		var subTiddler = bundleInfo.tiddlers[subTiddlerTitle];
		if(subTiddler) {
			return new $tw.Tiddler(subTiddler);
		}
	}
	return null;
};

/*
Retrieve a tiddler as a JSON string of the fields
*/
exports.getTiddlerAsJson = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		var fields = Object.create(null);
		$tw.utils.each(tiddler.fields,function(value,name) {
			fields[name] = tiddler.getFieldString(name);
		});
		return JSON.stringify(fields);
	} else {
		return JSON.stringify({title: title});
	}
};

exports.getTiddlersAsJson = function(filter,spaces) {
	var tiddlers = this.filterTiddlers(filter),
		spaces = (spaces === undefined) ? $tw.config.preferences.jsonSpaces : spaces,
		data = [];
	for(var t=0;t<tiddlers.length; t++) {
		var tiddler = this.getTiddler(tiddlers[t]);
		if(tiddler) {
			var fields = new Object();
			for(var field in tiddler.fields) {
				fields[field] = tiddler.getFieldString(field);
			}
			data.push(fields);
		}
	}
	return JSON.stringify(data,null,spaces);
};

/*
Get the content of a tiddler as a JavaScript object. How this is done depends on the type of the tiddler:

application/json: the tiddler JSON is parsed into an object
application/x-tiddler-dictionary: the tiddler is parsed as sequence of name:value pairs

Other types currently just return null.

titleOrTiddler: string tiddler title or a tiddler object
defaultData: default data to be returned if the tiddler is missing or doesn't contain data

Note that the same value is returned for repeated calls for the same tiddler data. The value is frozen to prevent modification; otherwise modifications would be visible to all callers
*/
exports.getTiddlerDataCached = function(titleOrTiddler,defaultData) {
	var self = this,
		tiddler = titleOrTiddler;
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = this.getTiddler(tiddler);
	}
	if(tiddler) {
		return this.getCacheForTiddler(tiddler.fields.title,"data",function() {
			// Return the frozen value
			var value = self.getTiddlerData(tiddler.fields.title,undefined);
			$tw.utils.deepFreeze(value);
			return value;
		}) || defaultData;
	} else {
		return defaultData;
	}
};

/*
Alternative, uncached version of getTiddlerDataCached(). The return value can be mutated freely and reused
*/
exports.getTiddlerData = function(titleOrTiddler,defaultData) {
	var tiddler = titleOrTiddler,
		data;
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = this.getTiddler(tiddler);
	}
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
exports.extractTiddlerDataItem = function(titleOrTiddler,index,defaultText) {
	var data = this.getTiddlerDataCached(titleOrTiddler,Object.create(null)),
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
title: title of tiddler
data: object that can be serialised to JSON
fields: optional hashmap of additional tiddler fields to be set
*/
exports.setTiddlerData = function(title,data,fields) {
	var existingTiddler = this.getTiddler(title),
		newFields = {
			title: title
	};
	if(existingTiddler && existingTiddler.fields.type === "application/x-tiddler-dictionary") {
		newFields.text = $tw.utils.makeTiddlerDictionary(data);
	} else {
		newFields.type = "application/json";
		newFields.text = JSON.stringify(data,null,$tw.config.preferences.jsonSpaces);
	}
	this.addTiddler(new $tw.Tiddler(this.getCreationFields(),existingTiddler,fields,newFields,this.getModificationFields()));
};

/*
Return the content of a tiddler as an array containing each line
*/
exports.getTiddlerList = function(title,field,index) {
	if(index) {
		return $tw.utils.parseStringArray(this.extractTiddlerDataItem(title,index,""));
	}
	field = field || "list";
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		return ($tw.utils.parseStringArray(tiddler.fields[field]) || []).slice(0);
	}
	return [];
};

// Return a named global cache object. Global cache objects are cleared whenever a tiddler change occurs
exports.getGlobalCache = function(cacheName,initializer) {
	this.globalCache = this.globalCache || Object.create(null);
	if($tw.utils.hop(this.globalCache,cacheName)) {
		return this.globalCache[cacheName];
	} else {
		this.globalCache[cacheName] = initializer();
		return this.globalCache[cacheName];
	}
};

exports.clearGlobalCache = function() {
	this.globalCache = Object.create(null);
};

// Return the named cache object for a tiddler. If the cache doesn't exist then the initializer function is invoked to create it
exports.getCacheForTiddler = function(title,cacheName,initializer) {
	this.caches = this.caches || Object.create(null);
	var caches = this.caches[title];
	if(caches && caches[cacheName]) {
		return caches[cacheName];
	} else {
		if(!caches) {
			caches = Object.create(null);
			this.caches[title] = caches;
		}
		caches[cacheName] = initializer();
		return caches[cacheName];
	}
};

// Clear all caches associated with a particular tiddler, or, if the title is null, clear all the caches for all the tiddlers
exports.clearCache = function(title) {
	if(title) {
		this.caches = this.caches || Object.create(null);
		if($tw.utils.hop(this.caches,title)) {
			delete this.caches[title];
		}
	} else {
		this.caches = Object.create(null);
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
	// Use the generic binary parser for any binary types not registered so far
	if($tw.Wiki.parsers["application/octet-stream"]) {
		Object.keys($tw.config.contentTypeInfo).forEach(function(type) {
			if(!$tw.utils.hop($tw.Wiki.parsers,type) && $tw.config.contentTypeInfo[type].encoding === "base64") {
				$tw.Wiki.parsers[type] = $tw.Wiki.parsers["application/octet-stream"];
			}
		});
	}
};

/*
Parse a block of text of a specified MIME type
	type: content type of text to be parsed
	text: text
	options: see below
Options include:
	parseAsInline: if true, the text of the tiddler will be parsed as an inline run
	_canonical_uri: optional string of the canonical URI of this content
*/
exports.parseText = function(type,text,options) {
	text = text || "";
	options = options || {};
	// Select a parser
	var Parser = $tw.Wiki.parsers[type];
	if(!Parser && $tw.utils.getFileExtensionInfo(type)) {
		Parser = $tw.Wiki.parsers[$tw.utils.getFileExtensionInfo(type).type];
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
		wiki: this,
		_canonical_uri: options._canonical_uri
	});
};

/*
Parse a tiddler according to its MIME type
*/
exports.parseTiddler = function(title,options) {
	options = $tw.utils.extend({},options);
	var cacheType = options.parseAsInline ? "inlineParseTree" : "blockParseTree",
		tiddler = this.getTiddler(title),
		self = this;
	return tiddler ? this.getCacheForTiddler(title,cacheType,function() {
			if(tiddler.hasField("_canonical_uri")) {
				options._canonical_uri = tiddler.fields._canonical_uri;
			}
			return self.parseText(tiddler.fields.type,tiddler.fields.text,options);
		}) : null;
};

exports.parseTextReference = function(title,field,index,options) {
	var tiddler,text;
	if(options.subTiddler) {
		tiddler = this.getSubTiddler(title,options.subTiddler);
	} else {
		tiddler = this.getTiddler(title);
		if(field === "text" || (!field && !index)) {
			this.getTiddlerText(title); // Force the tiddler to be lazily loaded
			return this.parseTiddler(title,options);
		}
	}
	if(field === "text" || (!field && !index)) {
		if(tiddler && tiddler.fields) {
			return this.parseText(tiddler.fields.type,tiddler.fields.text,options);
		} else {
			return null;
		}
	} else if(field) {
		if(field === "title") {
			text = title;
		} else {
			if(!tiddler || !tiddler.hasField(field)) {
				return null;
			}
			text = tiddler.fields[field];
		}
		return this.parseText("text/vnd.tiddlywiki",text.toString(),options);
	} else if(index) {
		this.getTiddlerText(title); // Force the tiddler to be lazily loaded
		text = this.extractTiddlerDataItem(tiddler,index,undefined);
		if(text === undefined) {
			return null;
		}
		return this.parseText("text/vnd.tiddlywiki",text,options);
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
Make a widget tree for transclusion
title: target tiddler title
options: as for wiki.makeWidget() plus:
options.field: optional field to transclude (defaults to "text")
options.mode: transclusion mode "inline" or "block"
options.recursionMarker : optional flag to set a recursion marker, defaults to "yes"
options.children: optional array of children for the transclude widget
options.importVariables: optional importvariables filter string for macros to be included
options.importPageMacros: optional boolean; if true, equivalent to passing "[[$:/core/ui/PageMacros]] [all[shadows+tiddlers]tag[$:/tags/Macro]!has[draft.of]]" to options.importVariables
*/
exports.makeTranscludeWidget = function(title,options) {
	options = options || {};
	var parseTreeDiv = {tree: [{
			type: "element",
			tag: "div",
			children: []}]},
		parseTreeImportVariables = {
			type: "importvariables",
			attributes: {
				filter: {
					name: "filter",
					type: "string"
				}
			},
			isBlock: false,
			children: []},
		parseTreeTransclude = {
			type: "transclude",
			attributes: {
				recursionMarker: {
					name: "recursionMarker",
					type: "string",
					value: options.recursionMarker || "yes"
					},
				tiddler: {
					name: "tiddler",
					type: "string",
					value: title
				}
			},
			isBlock: !options.parseAsInline};
	if(options.importVariables || options.importPageMacros) {
		if(options.importVariables) {
			parseTreeImportVariables.attributes.filter.value = options.importVariables;
		} else if(options.importPageMacros) {
			parseTreeImportVariables.attributes.filter.value = "[[$:/core/ui/PageMacros]] [all[shadows+tiddlers]tag[$:/tags/Macro]!has[draft.of]]";
		}
		parseTreeDiv.tree[0].children.push(parseTreeImportVariables);
		parseTreeImportVariables.children.push(parseTreeTransclude);
	} else {
		parseTreeDiv.tree[0].children.push(parseTreeTransclude);
	}
	if(options.field) {
		parseTreeTransclude.attributes.field = {type: "string", value: options.field};
	}
	if(options.mode) {
		parseTreeTransclude.attributes.mode = {type: "string", value: options.mode};
	}
	if(options.children) {
		parseTreeTransclude.children = options.children;
	}
	return this.makeWidget(parseTreeDiv,options);
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
	var parser = this.parseTiddler(title,options),
		widgetNode = this.makeWidget(parser,options);
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return outputType === "text/html" ? container.innerHTML : (outputType === "text/plain-formatted" ? container.formattedTextContent : container.textContent);
};

/*
Return an array of tiddler titles that match a search string
	text: The text string to search for
	options: see below
Options available:
	source: an iterator function for the source tiddlers, called source(iterator), where iterator is called as iterator(tiddler,title)
	exclude: An array of tiddler titles to exclude from the search
	invert: If true returns tiddlers that do not contain the specified string
	caseSensitive: If true forces a case sensitive search
	field: If specified, restricts the search to the specified field, or an array of field names
	anchored: If true, forces all but regexp searches to be anchored to the start of text
	excludeField: If true, the field options are inverted to specify the fields that are not to be searched
	The search mode is determined by the first of these boolean flags to be true
		literal: searches for literal string
		whitespace: same as literal except runs of whitespace are treated as a single space
		regexp: treats the search term as a regular expression
		words: (default) treats search string as a list of tokens, and matches if all tokens are found, regardless of adjacency or ordering
*/
exports.search = function(text,options) {
	options = options || {};
	var self = this,
		t,
		invert = !!options.invert;
	// Convert the search string into a regexp for each term
	var terms, searchTermsRegExps,
		flags = options.caseSensitive ? "" : "i",
		anchor = options.anchored ? "^" : "";
	if(options.literal) {
		if(text.length === 0) {
			searchTermsRegExps = null;
		} else {
			searchTermsRegExps = [new RegExp("(" + anchor + $tw.utils.escapeRegExp(text) + ")",flags)];
		}
	} else if(options.whitespace) {
		terms = [];
		$tw.utils.each(text.split(/\s+/g),function(term) {
			if(term) {
				terms.push($tw.utils.escapeRegExp(term));
			}
		});
		searchTermsRegExps = [new RegExp("(" + anchor + terms.join("\\s+") + ")",flags)];
	} else if(options.regexp) {
		try {
			searchTermsRegExps = [new RegExp("(" + text + ")",flags)];
		} catch(e) {
			searchTermsRegExps = null;
			console.log("Regexp error parsing /(" + text + ")/" + flags + ": ",e);
		}
	} else {
		terms = text.split(/ +/);
		if(terms.length === 1 && terms[0] === "") {
			searchTermsRegExps = null;
		} else {
			searchTermsRegExps = [];
			for(t=0; t<terms.length; t++) {
				searchTermsRegExps.push(new RegExp("(" + anchor + $tw.utils.escapeRegExp(terms[t]) + ")",flags));
			}
		}
	}
	// Accumulate the array of fields to be searched or excluded from the search
	var fields = [];
	if(options.field) {
		if($tw.utils.isArray(options.field)) {
			$tw.utils.each(options.field,function(fieldName) {
				if(fieldName) {
					fields.push(fieldName);
				}
			});
		} else {
			fields.push(options.field);
		}
	}
	// Use default fields if none specified and we're not excluding fields (excluding fields with an empty field array is the same as searching all fields)
	if(fields.length === 0 && !options.excludeField) {
		fields.push("title");
		fields.push("tags");
		fields.push("text");
	}
	// Function to check a given tiddler for the search term
	var searchTiddler = function(title) {
		if(!searchTermsRegExps) {
			return true;
		}
		var notYetFound = searchTermsRegExps.slice();

		var tiddler = self.getTiddler(title);
		if(!tiddler) {
			tiddler = new $tw.Tiddler({title: title, text: "", type: "text/vnd.tiddlywiki"});
		}
		var contentTypeInfo = $tw.config.contentTypeInfo[tiddler.fields.type] || $tw.config.contentTypeInfo["text/vnd.tiddlywiki"],
			searchFields;
		// Get the list of fields we're searching
		if(options.excludeField) {
			searchFields = Object.keys(tiddler.fields);
			$tw.utils.each(fields,function(fieldName) {
				var p = searchFields.indexOf(fieldName);
				if(p !== -1) {
					searchFields.splice(p,1);
				}
			});
		} else {
			searchFields = fields;
		}
		for(var fieldIndex=0; notYetFound.length>0 && fieldIndex<searchFields.length; fieldIndex++) {
			// Don't search the text field if the content type is binary
			var fieldName = searchFields[fieldIndex];
			if(fieldName === "text" && contentTypeInfo.encoding !== "utf8") {
				break;
			}
			var str = tiddler.fields[fieldName],
				t;
			if(str) {
				if($tw.utils.isArray(str)) {
					// If the field value is an array, test each regexp against each field array entry and fail if each regexp doesn't match at least one field array entry
					for(var s=0; s<str.length; s++) {
						for(t=0; t<notYetFound.length;) {
							if(notYetFound[t].test(str[s])) {
								notYetFound.splice(t, 1);
							} else {
								t++;
							}
						}
					}
				} else {
					// If the field isn't an array, force it to a string and test each regexp against it and fail if any do not match
					str = tiddler.getFieldString(fieldName);
					for(t=0; t<notYetFound.length;) {
						if(notYetFound[t].test(str)) {
							notYetFound.splice(t, 1);
						} else {
							t++;
						}
					}
				}
			}
		};
		return notYetFound.length == 0;
	};
	// Loop through all the tiddlers doing the search
	var results = [],
		source = options.source || this.each;
	source(function(tiddler,title) {
		if(searchTiddler(title) !== invert) {
			results.push(title);
		}
	});
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
	if(!tiddler.hasField("_is_skinny")) {
		// Just return the text if we've got it
		return tiddler.fields.text || "";
	} else {
		// Tell any listeners about the need to lazily load this tiddler
		this.dispatchEvent("lazyLoad",title);
		// Indicate that the text is being loaded
		return null;
	}
};

/*
Check whether the text of a tiddler matches a given value. By default, the comparison is case insensitive, and any spaces at either end of the tiddler text is trimmed
*/
exports.checkTiddlerText = function(title,targetText,options) {
	options = options || {};
	var text = this.getTiddlerText(title,"");
	if(!options.noTrim) {
		text = text.trim();
	}
	if(!options.caseSensitive) {
		text = text.toLowerCase();
		targetText = targetText.toLowerCase();
	}
	return text === targetText;
}

/*
Read an array of browser File objects, invoking callback(tiddlerFieldsArray) once they're all read
*/
exports.readFiles = function(files,options) {
	var callback;
	if(typeof options === "function") {
		callback = options;
		options = {};
	} else {
		callback = options.callback;
	}
	var result = [],
		outstanding = files.length,
		readFileCallback = function(tiddlerFieldsArray) {
			result.push.apply(result,tiddlerFieldsArray);
			if(--outstanding === 0) {
				callback(result);
			}
		};
	for(var f=0; f<files.length; f++) {
		this.readFile(files[f],$tw.utils.extend({},options,{callback: readFileCallback}));
	}
	return files.length;
};

/*
Read a browser File object, invoking callback(tiddlerFieldsArray) with an array of tiddler fields objects
*/
exports.readFile = function(file,options) {
	var callback;
	if(typeof options === "function") {
		callback = options;
		options = {};
	} else {
		callback = options.callback;
	}
	// Get the type, falling back to the filename extension
	var self = this,
		type = file.type;
	if(type === "" || !type) {
		var dotPos = file.name.lastIndexOf(".");
		if(dotPos !== -1) {
			var fileExtensionInfo = $tw.utils.getFileExtensionInfo(file.name.substr(dotPos));
			if(fileExtensionInfo) {
				type = fileExtensionInfo.type;
			}
		}
	}
	// Figure out if we're reading a binary file
	var contentTypeInfo = $tw.config.contentTypeInfo[type],
		isBinary = contentTypeInfo ? contentTypeInfo.encoding === "base64" : false;
	// Log some debugging information
	if($tw.log.IMPORT) {
		console.log("Importing file '" + file.name + "', type: '" + type + "', isBinary: " + isBinary);
	}
	// Give the hook a chance to process the drag
	if($tw.hooks.invokeHook("th-importing-file",{
		file: file,
		type: type,
		isBinary: isBinary,
		callback: callback
	}) !== true) {
		this.readFileContent(file,type,isBinary,options.deserializer,callback);
	}
};

/*
Lower level utility to read the content of a browser File object, invoking callback(tiddlerFieldsArray) with an array of tiddler fields objects
*/
exports.readFileContent = function(file,type,isBinary,deserializer,callback) {
	var self = this;
	// Create the FileReader
	var reader = new FileReader();
	// Onload
	reader.onload = function(event) {
		var text = event.target.result,
			tiddlerFields = {title: file.name || "Untitled"};
		if(isBinary) {
			var commaPos = text.indexOf(",");
			if(commaPos !== -1) {
				text = text.substr(commaPos + 1);
			}
		}
		// Check whether this is an encrypted TiddlyWiki file
		var encryptedJson = $tw.utils.extractEncryptedStoreArea(text);
		if(encryptedJson) {
			// If so, attempt to decrypt it with the current password
			$tw.utils.decryptStoreAreaInteractive(encryptedJson,function(tiddlers) {
				callback(tiddlers);
			});
		} else {
			// Otherwise, just try to deserialise any tiddlers in the file
			callback(self.deserializeTiddlers(type,text,tiddlerFields,{deserializer: deserializer}));
		}
	};
	// Kick off the read
	if(isBinary) {
		reader.readAsDataURL(file);
	} else {
		reader.readAsText(file);
	}
};

/*
Find any existing draft of a specified tiddler
*/
exports.findDraft = function(targetTitle) {
	var draftTitle = undefined;
	this.forEachTiddler({includeSystem: true},function(title,tiddler) {
		if(tiddler.fields["draft.title"] && tiddler.fields["draft.of"] === targetTitle) {
			draftTitle = title;
		}
	});
	return draftTitle;
}

/*
Check whether the specified draft tiddler has been modified.
If the original tiddler doesn't exist, create  a vanilla tiddler variable,
to check if additional fields have been added.
*/
exports.isDraftModified = function(title) {
	var tiddler = this.getTiddler(title);
	if(!tiddler.isDraft()) {
		return false;
	}
	var ignoredFields = ["created", "modified", "title", "draft.title", "draft.of"],
		origTiddler = this.getTiddler(tiddler.fields["draft.of"]) || new $tw.Tiddler({text:"", tags:[]}),
		titleModified = tiddler.fields["draft.title"] !== tiddler.fields["draft.of"];
	return titleModified || !tiddler.isEqual(origTiddler,ignoredFields);
};

/*
Add a new record to the top of the history stack
title: a title string or an array of title strings
fromPageRect: page coordinates of the origin of the navigation
historyTitle: title of history tiddler (defaults to $:/HistoryList)
*/
exports.addToHistory = function(title,fromPageRect,historyTitle) {
	var story = new $tw.Story({wiki: this, historyTitle: historyTitle});
	story.addToHistory(title,fromPageRect);
	console.log("$tw.wiki.addToHistory() is deprecated since V5.1.23! Use the this.story.addToHistory() from the story-object!")
};

/*
Add a new tiddler to the story river
title: a title string or an array of title strings
fromTitle: the title of the tiddler from which the navigation originated
storyTitle: title of story tiddler (defaults to $:/StoryList)
options: see story.js
*/
exports.addToStory = function(title,fromTitle,storyTitle,options) {
	var story = new $tw.Story({wiki: this, storyTitle: storyTitle});
	story.addToStory(title,fromTitle,options);
	console.log("$tw.wiki.addToStory() is deprecated since V5.1.23! Use the this.story.addToStory() from the story-object!")
};

/*
Generate a title for the draft of a given tiddler
*/
exports.generateDraftTitle = function(title) {
	var c = 0,
		draftTitle,
		username = this.getTiddlerText("$:/status/UserName"),
		attribution = username ? " by " + username : "";
	do {
		draftTitle = "Draft " + (c ? (c + 1) + " " : "") + "of '" + title + "'" + attribution;
		c++;
	} while(this.tiddlerExists(draftTitle));
	return draftTitle;
};

/*
Invoke the available upgrader modules
titles: array of tiddler titles to be processed
tiddlers: hashmap by title of tiddler fields of pending import tiddlers. These can be modified by the upgraders. An entry with no fields indicates a tiddler that was pending import has been suppressed. When entries are added to the pending import the tiddlers hashmap may have entries that are not present in the titles array
Returns a hashmap of messages keyed by tiddler title.
*/
exports.invokeUpgraders = function(titles,tiddlers) {
	// Collect up the available upgrader modules
	var self = this;
	if(!this.upgraderModules) {
		this.upgraderModules = [];
		$tw.modules.forEachModuleOfType("upgrader",function(title,module) {
			if(module.upgrade) {
				self.upgraderModules.push(module);
			}
		});
	}
	// Invoke each upgrader in turn
	var messages = {};
	for(var t=0; t<this.upgraderModules.length; t++) {
		var upgrader = this.upgraderModules[t],
			upgraderMessages = upgrader.upgrade(this,titles,tiddlers);
		$tw.utils.extend(messages,upgraderMessages);
	}
	return messages;
};

// Determine whether a plugin by title is dynamically loadable
exports.doesPluginRequireReload = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler && tiddler.fields.type === "application/json" && tiddler.fields["plugin-type"]) {
		if(tiddler.fields["plugin-type"] === "import") {
			// The import plugin never requires reloading
			return false;
		}
	}
	return this.doesPluginInfoRequireReload(this.getPluginInfo(title) || this.getTiddlerDataCached(title));
};

// Determine whether a plugin info structure is dynamically loadable
exports.doesPluginInfoRequireReload = function(pluginInfo) {
	if(pluginInfo) {
		var foundModule = false;
		$tw.utils.each(pluginInfo.tiddlers,function(tiddler) {
			if(tiddler.type === "application/javascript" && $tw.utils.hop(tiddler,"module-type")) {
				foundModule = true;
			}
		});
		return foundModule;
	} else {
		return null;
	}
};

exports.slugify = function(title,options) {
	var tiddler = this.getTiddler(title),
		slug;
	if(tiddler && tiddler.fields.slug) {
		slug = tiddler.fields.slug;
	} else {
		slug = $tw.utils.transliterate(title.toString().toLowerCase()) // Replace diacritics with basic lowercase ASCII
			.replace(/\s+/g,"-")                                       // Replace spaces with -
			.replace(/[^\w\-\.]+/g,"")                                 // Remove all non-word chars except dash and dot
			.replace(/\-\-+/g,"-")                                     // Replace multiple - with single -
			.replace(/^-+/,"")                                         // Trim - from start of text
			.replace(/-+$/,"");                                        // Trim - from end of text
	}
	// If the resulting slug is blank (eg because the title is just punctuation characters)
	if(!slug) {
		// ...then just use the character codes of the title
		var result = [];
		$tw.utils.each(title.split(""),function(char) {
			result.push(char.charCodeAt(0).toString());
		});
		slug = result.join("-");
	}
	return slug;
};

})();
