//--
//-- TiddlyWiki instance contains TiddlerS
//--

function TiddlyWiki(params)
{
	var tiddlers = {}; // Hashmap by name of tiddlers
	if(params && params.config) {
		this.config = config;
	}
	this.tiddlersUpdated = false;
	this.namedNotifications = []; // Array of {name:,notify:} of notification functions
	this.notificationLevel = 0;
	this.slices = {}; // map tiddlerName->(map sliceName->sliceValue). Lazy.
	this.clear = function() {
		tiddlers = {};
		this.setDirty(false);
	};
	this.fetchTiddler = function(title) {
		var t = tiddlers[title];
		return t instanceof Tiddler ? t : null;
	};
	this.deleteTiddler = function(title) {
		delete this.slices[title];
		delete tiddlers[title];
	};
	this.addTiddler = function(tiddler) {
		delete this.slices[tiddler.title];
		tiddlers[tiddler.title] = tiddler;
	};
	this.forEachTiddler = function(callback) {
		var t;
		for(t in tiddlers) {
			var tiddler = tiddlers[t];
			if(tiddler instanceof Tiddler)
				callback.call(this,t,tiddler);
		}
	};
}

//# Set the dirty flag
TiddlyWiki.prototype.setDirty = function(dirty)
{
	this.dirty = dirty;
};

TiddlyWiki.prototype.isDirty = function()
{
	return this.dirty;
};

TiddlyWiki.prototype.tiddlerExists = function(title)
{
	var t = this.fetchTiddler(title);
	return t != undefined;
};

TiddlyWiki.prototype.isShadowTiddler = function(title)
{
	return config.shadowTiddlers[title] === undefined ? false : true;
};

TiddlyWiki.prototype.createTiddler = function(title)
{
	var tiddler = this.fetchTiddler(title);
	if(!tiddler) {
		tiddler = new Tiddler(title);
		this.addTiddler(tiddler);
		this.setDirty(true);
	}
	return tiddler;
};

TiddlyWiki.prototype.getTiddler = function(title)
{
	var t = this.fetchTiddler(title);
	if(t != undefined)
		return t;
	else
		return null;
};

TiddlyWiki.prototype.getShadowTiddlerText = function(title)
{
	if(typeof config.shadowTiddlers[title] == "string")
		return config.shadowTiddlers[title];
	else
		return "";
};

// Retrieve tiddler contents
//# Supports tiddler slices or sections, encoded in {{{title}}} argument using
//# the respective separator characters ({{{::}}} or {{{##}}}).
TiddlyWiki.prototype.getTiddlerText = function(title,defaultText)
{
	if(!title)
		return defaultText;
	var pos = title.indexOf(config.textPrimitives.sectionSeparator);
	var section = null;
	if(pos != -1) {
		section = title.substr(pos + config.textPrimitives.sectionSeparator.length);
		title = title.substr(0,pos);
	}
	pos = title.indexOf(config.textPrimitives.sliceSeparator);
	if(pos != -1) {
		var slice = this.getTiddlerSlice(title.substr(0,pos),title.substr(pos + config.textPrimitives.sliceSeparator.length));
		if(slice)
			return slice;
	}
	var tiddler = this.fetchTiddler(title);
	var text = tiddler ? tiddler.text : null;
	if(!tiddler && this.isShadowTiddler(title)) {
		text = this.getShadowTiddlerText(title);
	}
	if(text) {
		if(!section)
			return text;
		var re = new RegExp("(^!{1,6}[ \t]*" + section.escapeRegExp() + "[ \t]*\n)","mg");
		re.lastIndex = 0;
		var match = re.exec(text);
		if(match) {
			var t = text.substr(match.index+match[1].length);
			var re2 = /^!/mg;
			re2.lastIndex = 0;
			match = re2.exec(t); //# search for the next heading
			if(match)
				t = t.substr(0,match.index-1);//# don't include final \n
			return t;
		}
		return defaultText;
	}
	if(defaultText != undefined)
		return defaultText;
	return null;
};

TiddlyWiki.prototype.getRecursiveTiddlerText = function(title,defaultText,depth)
{
	var bracketRegExp = new RegExp("(?:\\[\\[([^\\]]+)\\]\\])","mg");
	var text = this.getTiddlerText(title,null);
	if(text == null)
		return defaultText;
	var textOut = [];
	var match,lastPos = 0;
	do {
		match = bracketRegExp.exec(text);
		if(match) {
			textOut.push(text.substr(lastPos,match.index-lastPos));
			if(match[1]) {
				if(depth <= 0)
					textOut.push(match[1]);
				else
					textOut.push(this.getRecursiveTiddlerText(match[1],"",depth-1));
			}
			lastPos = match.index + match[0].length;
		} else {
			textOut.push(text.substr(lastPos));
		}
	} while(match);
	return textOut.join("");
};

//TiddlyWiki.prototype.slicesRE = /(?:^([\'\/]{0,2})~?([\.\w]+)\:\1[\t\x20]*([^\n]+)[\t\x20]*$)|(?:^\|([\'\/]{0,2})~?([\.\w]+)\:?\4\|[\t\x20]*([^\n]+)[\t\x20]*\|$)/gm;
TiddlyWiki.prototype.slicesRE = /(?:^([\'\/]{0,2})~?([\.\w]+)\:\1[\t\x20]*([^\n]*)[\t\x20]*$)|(?:^\|([\'\/]{0,2})~?([\.\w]+)\:?\4\|[\t\x20]*([^\|\n]*)[\t\x20]*\|$)/gm;
// @internal
TiddlyWiki.prototype.calcAllSlices = function(title)
{
	var slices = {};
	var text = this.getTiddlerText(title,"");
	this.slicesRE.lastIndex = 0;
	var m = this.slicesRE.exec(text);
	while(m) {
		if(m[2])
			slices[m[2]] = m[3];
		else
			slices[m[5]] = m[6];
		m = this.slicesRE.exec(text);
	}
	return slices;
};

// Returns the slice of text of the given name
//#
//# A text slice is a substring in the tiddler's text that is defined
//# either like this
//#    aName:  textSlice
//# or
//#    |aName:| textSlice |
//# or
//#    |aName| textSlice |
//#
//# In the text the name (or name:) may be decorated with '' or //
//# ie this would also a valid text slice:
//#
//#    |''aName:''| textSlice |
//#
//# @param name should only contain "word characters" (i.e. "a-ZA-Z_0-9")
//# @return [may be undefined] the (trimmed) text of the specified slice.
TiddlyWiki.prototype.getTiddlerSlice = function(title,sliceName)
{
	var slices = this.slices[title];
	if(!slices) {
		slices = this.calcAllSlices(title);
		this.slices[title] = slices;
	}
	return slices[sliceName];
};

// Build an hashmap of the specified named slices of a tiddler
TiddlyWiki.prototype.getTiddlerSlices = function(title,sliceNames)
{
	var t,r = {};
	for(t=0; t<sliceNames.length; t++) {
		var slice = this.getTiddlerSlice(title,sliceNames[t]);
		if(slice)
			r[sliceNames[t]] = slice;
	}
	return r;
};

TiddlyWiki.prototype.suspendNotifications = function()
{
	this.notificationLevel--;
};

TiddlyWiki.prototype.resumeNotifications = function()
{
	this.notificationLevel++;
};

// Invoke the notification handlers for a particular tiddler
TiddlyWiki.prototype.notify = function(title,doBlanket)
{
	if(!this.notificationLevel) {
	    var t;
		for(t=0; t<this.namedNotifications.length; t++) {
			var n = this.namedNotifications[t];
			if((n.name == null && doBlanket) || (n.name == title))
				n.notify(title);
		}
	}
};

// Invoke the notification handlers for all tiddlers
TiddlyWiki.prototype.notifyAll = function()
{
	if(!this.notificationLevel) {
	    var t;
		for(t=0; t<this.namedNotifications.length; t++) {
			var n = this.namedNotifications[t];
			if(n.name)
				n.notify(n.name);
		}
	}
};

// Add a notification handler to a tiddler
TiddlyWiki.prototype.addNotification = function(title,fn)
{
	var i;
	for(i=0; i<this.namedNotifications.length; i++) {
		if((this.namedNotifications[i].name == title) && (this.namedNotifications[i].notify == fn))
			return this;
	}
	this.namedNotifications.push({name: title, notify: fn});
	return this;
};

TiddlyWiki.prototype.removeTiddler = function(title)
{
	var tiddler = this.fetchTiddler(title);
	if(tiddler) {
		this.deleteTiddler(title);
		this.notify(title,true);
		this.setDirty(true);
	}
};

// Reset the sync status of a freshly synced tiddler
TiddlyWiki.prototype.resetTiddler = function(title)
{
	var tiddler = this.fetchTiddler(title);
	if(tiddler) {
		tiddler.clearChangeCount();
		this.notify(title,true);
		this.setDirty(true);
	}
};

TiddlyWiki.prototype.setTiddlerTag = function(title,status,tag)
{
	var tiddler = this.fetchTiddler(title);
	if(tiddler) {
		var t = tiddler.tags.indexOf(tag);
		if(t != -1)
			tiddler.tags.splice(t,1);
		if(status)
			tiddler.tags.push(tag);
		tiddler.changed();
		tiddler.incChangeCount();
		this.notify(title,true);
		this.setDirty(true);
	}
};

TiddlyWiki.prototype.addTiddlerFields = function(title,fields)
{
	var tiddler = this.fetchTiddler(title);
	if(!tiddler)
		return;
	merge(tiddler.fields,fields);
	tiddler.changed();
	tiddler.incChangeCount();
	this.notify(title,true);
	this.setDirty(true);
};

// Store tiddler in TiddlyWiki instance
//#
//# optionally accepts a Tiddler instance as first argument, rendering
//# subsequent arguments obsolete
//#
//# existing tiddlers can be renamed using the newTitle argument
//#
//# created and modified arguments are Date objects,
//# tags argument is an array of strings
//#
//# fields should retain existing tiddler's extended fields and use
//# config.defaultCustomFields as fallback
//#
//# NB: Does not trigger autoSaveChanges.
TiddlyWiki.prototype.saveTiddler = function(title,newTitle,newBody,modifier,modified,tags,fields,clearChangeCount,created,creator)
{
	var tiddler;
	if(title instanceof Tiddler) {
		tiddler = title;
		title = tiddler.title;
		newTitle = title;
	} else {
		tiddler = this.fetchTiddler(title);
		if(tiddler) {
			created = created || tiddler.created; // Preserve created date
			creator = creator || tiddler.creator;
			this.deleteTiddler(title);
		} else {
			created = created || modified;
			tiddler = new Tiddler();
		}
		fields = merge(merge({},fields),config.defaultCustomFields,true);
		tiddler.set(newTitle,newBody,modifier,modified,tags,created,fields,creator);
	}
	this.addTiddler(tiddler);
	if(clearChangeCount)
		tiddler.clearChangeCount();
	else
		tiddler.incChangeCount();
	if(title != newTitle)
		this.notify(title,true);
	this.notify(newTitle,true);
	if(window.location.protocol == "file:")
		this.setDirty(true);
	return tiddler;
};

TiddlyWiki.prototype.incChangeCount = function(title)
{
	var tiddler = this.fetchTiddler(title);
	if(tiddler)
		tiddler.incChangeCount();
};

TiddlyWiki.prototype.getLoader = function()
{
	if(!this.loader)
		this.loader = new TW21Loader();
	return this.loader;
};

TiddlyWiki.prototype.getSaver = function()
{
	if(!this.saver)
		this.saver = new TW21Saver();
	return this.saver;
};

// Return all tiddlers formatted as an HTML string
TiddlyWiki.prototype.allTiddlersAsHtml = function()
{
	return this.getSaver().externalize(store);
};

// Load contents of a TiddlyWiki from an HTML DIV
TiddlyWiki.prototype.loadFromDiv = function(src,idPrefix,noUpdate)
{
	this.idPrefix = idPrefix;
	var storeElem = (typeof src == "string") ? document.getElementById(src) : src;
	if(!storeElem)
		return;
	var tiddlers = this.getLoader().loadTiddlers(this,storeElem.childNodes);
	this.setDirty(false);
	if(!noUpdate) {
		var i;
		for(i = 0;i<tiddlers.length; i++)
			tiddlers[i].changed();
	}
	jQuery(document).trigger("loadTiddlers");
};

// Load contents of a TiddlyWiki from a string
// Returns null if there's an error
TiddlyWiki.prototype.importTiddlyWiki = function(text)
{
	var posDiv = locateStoreArea(text);
	if(!posDiv)
		return null;
	var content = "<" + "html><" + "body>" + text.substring(posDiv[0],posDiv[1] + endSaveArea.length) + "<" + "/body><" + "/html>";
	// Create the iframe
	var iframe = document.createElement("iframe");
	iframe.style.display = "none";
	document.body.appendChild(iframe);
	var doc = iframe.document;
	if(iframe.contentDocument)
		doc = iframe.contentDocument; // For NS6
	else if(iframe.contentWindow)
		doc = iframe.contentWindow.document; // For IE5.5 and IE6
	// Put the content in the iframe
	doc.open();
	doc.writeln(content);
	doc.close();
	// Load the content into a TiddlyWiki() object
	var storeArea = doc.getElementById("storeArea");
	this.loadFromDiv(storeArea,"store");
	// Get rid of the iframe
	iframe.parentNode.removeChild(iframe);
	return this;
};

TiddlyWiki.prototype.updateTiddlers = function()
{
	this.tiddlersUpdated = true;
	this.forEachTiddler(function(title,tiddler) {
		tiddler.changed();
	});
};

// Return an array of tiddlers matching a search regular expression
TiddlyWiki.prototype.search = function(searchRegExp,sortField,excludeTag,match)
{
	var candidates = this.reverseLookup("tags",excludeTag,!!match);
	var t,results = [];
	for(t=0; t<candidates.length; t++) {
		if((candidates[t].title.search(searchRegExp) != -1) || (candidates[t].text.search(searchRegExp) != -1))
			results.push(candidates[t]);
	}
	if(!sortField)
		sortField = "title";
	results.sort(function(a,b) {return a[sortField] < b[sortField] ? -1 : (a[sortField] == b[sortField] ? 0 : +1);});
	return results;
};

// Returns a list of all tags in use
//   excludeTag - if present, excludes tags that are themselves tagged with excludeTag
// Returns an array of arrays where [tag][0] is the name of the tag and [tag][1] is the number of occurances
TiddlyWiki.prototype.getTags = function(excludeTag)
{
	var results = [];
	this.forEachTiddler(function(title,tiddler) {
	    var g,c;
		for(g=0; g<tiddler.tags.length; g++) {
			var tag = tiddler.tags[g];
			var n = true;
			for(c=0; c<results.length; c++) {
				if(results[c][0] == tag) {
					n = false;
					results[c][1]++;
				}
			}
			if(n && excludeTag) {
				var t = this.fetchTiddler(tag);
				if(t && t.isTagged(excludeTag))
					n = false;
			}
			if(n)
				results.push([tag,1]);
		}
	});
	results.sort(function(a,b) {return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : (a[0].toLowerCase() == b[0].toLowerCase() ? 0 : +1);});
	return results;
};

// Return an array of the tiddlers that are tagged with a given tag
TiddlyWiki.prototype.getTaggedTiddlers = function(tag,sortField)
{
	return this.reverseLookup("tags",tag,true,sortField);
};

TiddlyWiki.prototype.getValueTiddlers = function(field,value,sortField)
{
	return this.reverseLookup(field,value,true,sortField);
};

// Return an array of the tiddlers that link to a given tiddler
TiddlyWiki.prototype.getReferringTiddlers = function(title,unusedParameter,sortField)
{
	if(!this.tiddlersUpdated)
		this.updateTiddlers();
	return this.reverseLookup("links",title,true,sortField);
};

// Return an array of the tiddlers that do or do not have a specified entry in the specified storage array (ie, "links" or "tags")
// lookupMatch == true to match tiddlers, false to exclude tiddlers
TiddlyWiki.prototype.reverseLookup = function(lookupField,lookupValue,lookupMatch,sortField)
{
	var results = [];
	this.forEachTiddler(function(title,tiddler) {
		var f = !lookupMatch;
		var values;
		if(["links", "tags"].contains(lookupField)) {
			values = tiddler[lookupField];
		} else {
			var accessor = TiddlyWiki.standardFieldAccess[lookupField];
			if(accessor) {
				values = [ accessor.get(tiddler) ];
			} else {
				values = tiddler.fields[lookupField] ? [tiddler.fields[lookupField]] : [];
			}
		}
		var lookup;
		for(lookup=0; lookup<values.length; lookup++) {
			if(values[lookup] == lookupValue)
				f = lookupMatch;
		}
		if(f)
			results.push(tiddler);
	});
	if(!sortField)
		sortField = "title";
	return this.sortTiddlers(results,sortField);
};

// Return the tiddlers as a sorted array
TiddlyWiki.prototype.getTiddlers = function(field,excludeTag)
{
	var results = [];
	this.forEachTiddler(function(title,tiddler) {
		if(excludeTag == undefined || !tiddler.isTagged(excludeTag))
			results.push(tiddler);
	});
	if(field)
		results.sort(function(a,b) {return a[field] < b[field] ? -1 : (a[field] == b[field] ? 0 : +1);});
	return results;
};

// Return array of names of tiddlers that are referred to but not defined
TiddlyWiki.prototype.getMissingLinks = function()
{
	if(!this.tiddlersUpdated)
		this.updateTiddlers();
	var results = [];
	this.forEachTiddler(function (title,tiddler) {
		if(tiddler.isTagged("excludeMissing") || tiddler.isTagged("systemConfig"))
			return;
		var n;
		for(n=0; n<tiddler.links.length;n++) {
			var link = tiddler.links[n];
			if(this.getTiddlerText(link,null) == null && !this.isShadowTiddler(link) && !config.macros[link])
				results.pushUnique(link);
		}
	});
	results.sort();
	return results;
};

// Return an array of names of tiddlers that are defined but not referred to
TiddlyWiki.prototype.getOrphans = function()
{
	var results = [];
	this.forEachTiddler(function (title,tiddler) {
		if(this.getReferringTiddlers(title).length == 0 && !tiddler.isTagged("excludeLists"))
			results.push(title);
	});
	results.sort();
	return results;
};

// Return an array of names of all the shadow tiddlers
TiddlyWiki.prototype.getShadowed = function()
{
	var t,results = [];
	for(t in config.shadowTiddlers) {
		if(this.isShadowTiddler(t))
			results.push(t);
	}
	results.sort();
	return results;
};

// Return an array of tiddlers that have been touched since they were downloaded or created
TiddlyWiki.prototype.getTouched = function()
{
	var results = [];
	this.forEachTiddler(function(title,tiddler) {
		if(tiddler.isTouched())
			results.push(tiddler);
		});
	results.sort();
	return results;
};

// Resolves a Tiddler reference or tiddler title into a Tiddler object, or null if it doesn't exist
TiddlyWiki.prototype.resolveTiddler = function(tiddler)
{
	var t = (typeof tiddler == "string") ? this.getTiddler(tiddler) : tiddler;
	return t instanceof Tiddler ? t : null;
};

// Sort a list of tiddlers
//# tiddlers - array of Tiddler() objects to be sorted
//# field - name of field (or extended field) to sort by;
//#         precede with "+" for ascending sort (the default)
//#			or "-" for descending sort
TiddlyWiki.prototype.sortTiddlers = function(tiddlers,field)
{
	var asc = +1;
	switch(field.substr(0,1)) {
	case "-":
		asc = -1;
		field = field.substr(1);
		break;
	case "+":
		field = field.substr(1);
		break;
	}
	if(TiddlyWiki.standardFieldAccess[field]) {
		if(field=="title") {
			tiddlers.sort(function(a,b) {return a[field].toLowerCase() < b[field].toLowerCase() ? -asc : (a[field].toLowerCase() == b[field].toLowerCase() ? 0 : asc);});
		} else {
			tiddlers.sort(function(a,b) {return a[field] < b[field] ? -asc : (a[field] == b[field] ? 0 : asc);});
		}
	} else {
		tiddlers.sort(function(a,b) {return a.fields[field] < b.fields[field] ? -asc : (a.fields[field] == b.fields[field] ? 0 : +asc);});
	}
	return tiddlers;
};

