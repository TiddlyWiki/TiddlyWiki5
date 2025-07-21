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

"use strict";

const widget = require("$:/core/modules/widgets/widget.js");

const USER_NAME_TITLE = "$:/status/UserName";
const TIMESTAMP_DISABLE_TITLE = "$:/config/TimestampDisable";

/*
Add available indexers to this wiki
*/
exports.addIndexersToWiki = function() {
	const self = this;
	$tw.utils.each($tw.modules.applyMethods("indexer"),(Indexer,name) => {
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
	const tr = $tw.utils.parseTextReference(textRef);
	const title = tr.title || currTiddlerTitle;
	if(tr.field) {
		const tiddler = this.getTiddler(title);
		if(tr.field === "title") { // Special case so we can return the title of a non-existent tiddler
			return title || defaultText;
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
	const tr = $tw.utils.parseTextReference(textRef);
	const title = tr.title || currTiddlerTitle;
	this.setText(title,tr.field,tr.index,value);
};

exports.setText = function(title,field,index,value,options) {
	options = options || {};
	const creationFields = options.suppressTimestamp ? {} : this.getCreationFields();
	const modificationFields = options.suppressTimestamp ? {} : this.getModificationFields();
	// Check if it is a reference to a tiddler field
	if(index) {
		const data = this.getTiddlerData(title,Object.create(null));
		if(value !== undefined) {
			data[index] = value;
		} else {
			delete data[index];
		}
		this.setTiddlerData(title,data,{},{suppressTimestamp: options.suppressTimestamp});
	} else {
		const tiddler = this.getTiddler(title);
		const fields = {title};
		fields[field || "text"] = value;
		this.addTiddler(new $tw.Tiddler(creationFields,tiddler,fields,modificationFields));
	}
};

exports.deleteTextReference = function(textRef,currTiddlerTitle) {
	const tr = $tw.utils.parseTextReference(textRef);
	let title; let tiddler; let fields;
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
	this.eventListeners[type] = this.eventListeners[type] || [];
	this.eventListeners[type].push(listener);
};

exports.removeEventListener = function(type,listener) {
	const listeners = this.eventListeners[type];
	if(listeners) {
		const p = listeners.indexOf(listener);
		if(p !== -1) {
			listeners.splice(p,1);
		}
	}
};

exports.dispatchEvent = function(type /*, args */) {
	const args = Array.prototype.slice.call(arguments,1);
	const listeners = this.eventListeners[type];
	if(listeners) {
		for(let p = 0;p < listeners.length;p++) {
			const listener = listeners[p];
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
	isShadow: defaults to false (meaning the change applies to the normal tiddler),
		true if the tiddler being changed is a shadow tiddler
*/
exports.enqueueTiddlerEvent = function(title,isDeleted,isShadow) {
	// Record the touch in the list of changed tiddlers
	this.changedTiddlers = this.changedTiddlers || Object.create(null);
	this.changedTiddlers[title] = this.changedTiddlers[title] || Object.create(null);
	this.changedTiddlers[title][isDeleted ? "deleted" : "modified"] = true;
	this.changedTiddlers[title][isShadow ? "shadow" : "normal"] = true;
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
		const self = this;
		$tw.utils.nextTick(() => {
			const changes = self.changedTiddlers;
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
	let title = baseTitle;
	let template = options.template || "";
	// test if .startCount is a positive integer. If not set to 0
	let c = (parseInt(options.startCount,10) > 0) ? parseInt(options.startCount,10) : 0;
	const prefix = (typeof (options.prefix) === "string") ? options.prefix : " ";

	if(template) {
		// "count" is important to avoid an endless loop in while(...)!!
		template = (/\$count:?(\d+)?\$/i.test(template)) ? template : `${template}$count$`;
		// .formatTitleString() expects strings as input
		title = $tw.utils.formatTitleString(template,{"base": baseTitle,"separator": prefix,"counter": `${c}`});
		while(this.tiddlerExists(title) || this.isShadowTiddler(title) || this.findDraft(title)) {
			title = $tw.utils.formatTitleString(template,{"base": baseTitle,"separator": prefix,"counter": `${++c}`});
		}
	} else {
		if(c > 0) {
			title = baseTitle + prefix + c;
		}
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
	const tiddler = this.getTiddler(title);
	if(tiddler) {
		const contentTypeInfo = $tw.config.contentTypeInfo[tiddler.fields.type || "text/vnd.tiddlywiki"];
		return !!contentTypeInfo && contentTypeInfo.flags.includes("image");
	} else {
		return null;
	}
};

exports.isBinaryTiddler = function(title) {
	const tiddler = this.getTiddler(title);
	if(tiddler) {
		const contentTypeInfo = $tw.config.contentTypeInfo[tiddler.fields.type || "text/vnd.tiddlywiki"];
		return !!contentTypeInfo && contentTypeInfo.encoding === "base64";
	} else {
		return null;
	}
};

/*
Like addTiddler() except it will silently reject any plugin tiddlers that are older than the currently loaded version. Returns true if the tiddler was imported
*/
exports.importTiddler = function(tiddler) {
	const existingTiddler = this.getTiddler(tiddler.fields.title);
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
		const fields = {
			created: new Date()
		};
		const creator = this.getTiddlerText(USER_NAME_TITLE);
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
		const fields = Object.create(null);
		const modifier = this.getTiddlerText(USER_NAME_TITLE);
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
	const self = this;
	const sortField = options.sortField || "title";
	const tiddlers = []; let t; const titles = [];
	this.each((tiddler,title) => {
		if(options.includeSystem || !self.isSystemTiddler(title)) {
			if(!options.excludeTag || !tiddler.hasTag(options.excludeTag)) {
				tiddlers.push(tiddler);
			}
		}
	});
	tiddlers.sort((a,b) => {
		const aa = a.fields[sortField].toLowerCase() || "";
		const bb = b.fields[sortField].toLowerCase() || "";
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
	for(t = 0;t < tiddlers.length;t++) {
		titles.push(tiddlers[t].fields.title);
	}
	return titles;
};

exports.countTiddlers = function(excludeTag) {
	const tiddlers = this.getTiddlers({excludeTag});
	return $tw.utils.count(tiddlers);
};

/*
Returns a function iterator(callback) that iterates through the specified titles, and invokes the callback with callback(tiddler,title)
*/
exports.makeTiddlerIterator = function(titles) {
	const self = this;
	if(!$tw.utils.isArray(titles)) {
		titles = Object.keys(titles);
	} else {
		titles = [...titles];
	}
	return function(callback) {
		titles.forEach((title) => {
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
	const self = this;
	if(sortField === "title") {
		if(!isNumeric && !isAlphaNumeric) {
			if(isCaseSensitive) {
				if(isDescending) {
					titles.sort((a,b) => {
						return b.localeCompare(a);
					});
				} else {
					titles.sort((a,b) => {
						return a.localeCompare(b);
					});
				}
			} else {
				if(isDescending) {
					titles.sort((a,b) => {
						return b.toLowerCase().localeCompare(a.toLowerCase());
					});
				} else {
					titles.sort((a,b) => {
						return a.toLowerCase().localeCompare(b.toLowerCase());
					});
				}
			}
		} else {
			titles.sort((a,b) => {
				let x; let y;
				if(isNumeric) {
					x = Number(a);
					y = Number(b);
					if(isNaN(x)) {
						if(isNaN(y)) {
							// If neither value is a number then fall through to a textual comparison
						} else {
							return isDescending ? -1 : 1;
						}
					} else {
						if(isNaN(y)) {
							return isDescending ? 1 : -1;
						} else {
							return isDescending ? y - x : x - y;
						}
					}
				}
				if(isAlphaNumeric) {
					return isDescending ? b.localeCompare(a,undefined,{numeric: true,sensitivity: "base"}) : a.localeCompare(b,undefined,{numeric: true,sensitivity: "base"});
				}
				if(!isCaseSensitive) {
					a = a.toLowerCase();
					b = b.toLowerCase();
				}
				return isDescending ? b.localeCompare(a) : a.localeCompare(b);
			});
		}
	} else {
		titles.sort((a,b) => {
			let x; let y;
			if(sortField !== "title") {
				const tiddlerA = self.getTiddler(a);
				const tiddlerB = self.getTiddler(b);
				if(tiddlerA) {
					a = tiddlerA.fields[sortField] || "";
				} else {
					a = "";
				}
				if(tiddlerB) {
					b = tiddlerB.fields[sortField] || "";
				} else {
					b = "";
				}
			}
			if(isNumeric) {
				x = Number(a);
				y = Number(b);
				if(isNaN(x)) {
					if(isNaN(y)) {
						// If neither value is a number then fall through to a textual comparison
					} else {
						return isDescending ? -1 : 1;
					}
				} else {
					if(isNaN(y)) {
						return isDescending ? 1 : -1;
					} else {
						return isDescending ? y - x : x - y;
					}
				}
			}
			if(Object.prototype.toString.call(a) === "[object Date]" && Object.prototype.toString.call(b) === "[object Date]") {
				return isDescending ? b - a : a - b;
			}
			a = String(a);
			b = String(b);
			if(isAlphaNumeric) {
				return isDescending ? b.localeCompare(a,undefined,{numeric: true,sensitivity: "base"}) : a.localeCompare(b,undefined,{numeric: true,sensitivity: "base"});
			}
			if(!isCaseSensitive) {
				a = a.toLowerCase();
				b = b.toLowerCase();
			}
			return isDescending ? b.localeCompare(a) : a.localeCompare(b);
		});
	}
};

/*
For every tiddler invoke a callback(title,tiddler) with `this` set to the wiki object. Options include:
sortField: field to sort by
excludeTag: tag to exclude
includeSystem: whether to include system tiddlers (defaults to false)
*/
exports.forEachTiddler = function(/* [options,]callback */) {
	let arg = 0;
	const options = arguments.length >= 2 ? arguments[arg++] : {};
	const callback = arguments[arg++];
	const titles = this.getTiddlers(options);
	let t; let tiddler;
	for(t = 0;t < titles.length;t++) {
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
	const links = [];
	const checkParseTree = function(parseTree) {
		for(let t = 0;t < parseTree.length;t++) {
			const parseTreeNode = parseTree[t];
			if(parseTreeNode.type === "link" && parseTreeNode.attributes.to && parseTreeNode.attributes.to.type === "string") {
				const {value} = parseTreeNode.attributes.to;
				if(!links.includes(value)) {
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
	const self = this;
	// We'll cache the links so they only get computed if the tiddler changes
	return this.getCacheForTiddler(title,"links",() => {
		// Parse the tiddler
		const parser = self.parseTiddler(title);
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
	const self = this;
	const backIndexer = this.getIndexer("BackIndexer");
	let backlinks = backIndexer && backIndexer.subIndexers.link.lookup(targetTitle);

	if(!backlinks) {
		backlinks = [];
		this.forEachTiddler((title,tiddler) => {
			const links = self.getTiddlerLinks(title);
			if(links.includes(targetTitle)) {
				backlinks.push(title);
			}
		});
	}
	return backlinks;
};


/*
Return an array of tiddler titles that are directly transcluded within the given parse tree. `title` is the tiddler being parsed, we will ignore its self-referential transclusions, only return
 */
exports.extractTranscludes = function(parseTreeRoot,title) {
	// Count up the transcludes
	const transcludes = [];
	const checkParseTree = function(parseTree,parentNode) {
		for(let t = 0;t < parseTree.length;t++) {
			const parseTreeNode = parseTree[t];
			if(parseTreeNode.type === "transclude") {
				if(parseTreeNode.attributes.$tiddler) {
					if(parseTreeNode.attributes.$tiddler.type === "string") {
						var value;
						// if it is Transclusion with Templates like `{{Index||$:/core/ui/TagTemplate}}`, the `$tiddler` will point to the template. We need to find the actual target tiddler from parent node
						if(parentNode && parentNode.type === "tiddler" && parentNode.attributes.tiddler && parentNode.attributes.tiddler.type === "string") {
							// Empty value (like `{{!!field}}`) means self-referential transclusion.
							value = parentNode.attributes.tiddler.value || title;
						} else {
							value = parseTreeNode.attributes.$tiddler.value;
						}
					}
				} else if(parseTreeNode.attributes.tiddler) {
					if(parseTreeNode.attributes.tiddler.type === "string") {
						// Old transclude widget usage
						value = parseTreeNode.attributes.tiddler.value;
					}
				} else if(parseTreeNode.attributes.$field && parseTreeNode.attributes.$field.type === "string") {
					// Empty value (like `<$transclude $field='created'/>`) means self-referential transclusion. 
					value = title;
				} else if(parseTreeNode.attributes.field && parseTreeNode.attributes.field.type === "string") {
					// Old usage with Empty value (like `<$transclude field='created'/>`)
					value = title;
				}
				// Deduplicate the result.
				if(value && !transcludes.includes(value)) {
					$tw.utils.pushTop(transcludes,value);
				}
			}
			if(parseTreeNode.children) {
				checkParseTree(parseTreeNode.children,parseTreeNode);
			}
		}
	};
	checkParseTree(parseTreeRoot);
	return transcludes;
};


/*
Return an array of tiddler titles that are transcluded from the specified tiddler
*/
exports.getTiddlerTranscludes = function(title) {
	const self = this;
	// We'll cache the transcludes so they only get computed if the tiddler changes
	return this.getCacheForTiddler(title,"transcludes",() => {
		// Parse the tiddler
		const parser = self.parseTiddler(title);
		if(parser) {
			// this will ignore self-referential transclusions from `title`
			return self.extractTranscludes(parser.tree,title);
		}
		return [];
	});
};

/*
Return an array of tiddler titles that transclude to the specified tiddler
*/
exports.getTiddlerBacktranscludes = function(targetTitle) {
	const self = this;
	const backIndexer = this.getIndexer("BackIndexer");
	let backtranscludes = backIndexer && backIndexer.subIndexers.transclude.lookup(targetTitle);

	if(!backtranscludes) {
		backtranscludes = [];
	}
	return backtranscludes;
};

/*
Return a hashmap of tiddler titles that are referenced but not defined. Each value is the number of times the missing tiddler is referenced
*/
exports.getMissingTitles = function() {
	const self = this;
	const missing = [];
	// We should cache the missing tiddler list, even if we recreate it every time any tiddler is modified
	this.forEachTiddler((title,tiddler) => {
		const links = self.getTiddlerLinks(title);
		$tw.utils.each(links,(link) => {
			if((!self.tiddlerExists(link) && !self.isShadowTiddler(link)) && !missing.includes(link)) {
				missing.push(link);
			}
		});
	});
	return missing;
};

exports.getOrphanTitles = function() {
	const self = this;
	const orphans = this.getTiddlers();
	this.forEachTiddler((title,tiddler) => {
		const links = self.getTiddlerLinks(title);
		$tw.utils.each(links,(link) => {
			const p = orphans.indexOf(link);
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
	const self = this;
	const tagIndexer = this.getIndexer("TagIndexer");
	let results = tagIndexer && tagIndexer.subIndexers[3].lookup(tag);
	if(!results) {
		// If not available, perform a manual scan
		results = this.getGlobalCache(`taglist-${tag}`,() => {
			const tagmap = self.getTagMap();
			return self.sortByList(tagmap[tag],tag);
		});
	}
	return results;
};

/*
Get a hashmap by tag of arrays of tiddler titles
*/
exports.getTagMap = function() {
	const self = this;
	return this.getGlobalCache("tagmap",() => {
		const tags = Object.create(null);
		const storeTags = function(tagArray,title) {
			if(tagArray) {
				for(let index = 0;index < tagArray.length;index++) {
					const tag = tagArray[index];
					if($tw.utils.hop(tags,tag)) {
						tags[tag].push(title);
					} else {
						tags[tag] = [title];
					}
				}
			}
		};
		let title; let tiddler;
		// Collect up all the tags
		self.eachShadow((tiddler,title) => {
			if(!self.tiddlerExists(title)) {
				tiddler = self.getTiddler(title);
				storeTags(tiddler.fields.tags,title);
			}
		});
		self.each((tiddler,title) => {
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
	const wiki = this;
	const listings = this.getGlobalCache(`listings-${fieldName}`,() => {
		const listings = Object.create(null);
		wiki.each((tiddler,title) => {
			const list = $tw.utils.parseStringArray(tiddler.fields[fieldName]);
			if(list) {
				for(let i = 0;i < list.length;i++) {
					const listItem = list[i];
					const listing = listings[listItem] || [];
					if(!listing.includes(title)) {
						listing.push(title);
					}
					listings[listItem] = listing;
				}
			}
		});
		return listings;
	});
	return listings[targetTitle] || [];
};

/*
Sorts an array of tiddler titles according to an ordered list
*/
exports.sortByList = function(array,listTitle) {
	const self = this;
	const replacedTitles = Object.create(null);
	// Given a title, this function will place it in the correct location
	// within titles.
	function moveItemInList(title) {
		if(!$tw.utils.hop(replacedTitles,title)) {
			replacedTitles[title] = true;
			let newPos = -1;
			const tiddler = self.getTiddler(title);
			if(tiddler) {
				const beforeTitle = tiddler.fields["list-before"];
				const afterTitle = tiddler.fields["list-after"];
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
				if(newPos !== -1) {
					// get its current Pos, and make sure
					// sure that it's _actually_ in the list
					// and that it would _actually_ move
					// (#4275) We don't bother calling
					//         indexOf unless we have a new
					//         position to work with
					const currPos = titles.indexOf(title);
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
	const list = this.getTiddlerList(listTitle);
	if(!array || array.length === 0) {
		return [];
	} else {
		var titles = []; let t; let title;
		// First place any entries that are present in the list
		for(t = 0;t < list.length;t++) {
			title = list[t];
			if(array.includes(title)) {
				titles.push(title);
			}
		}
		// Then place any remaining entries
		for(t = 0;t < array.length;t++) {
			title = array[t];
			if(!list.includes(title)) {
				titles.push(title);
			}
		}
		// Finally obey the list-before and list-after fields of each tiddler in turn
		const sortedTitles = [...titles];
		for(t = 0;t < sortedTitles.length;t++) {
			title = sortedTitles[t];
			moveItemInList(title);
		}
		return titles;
	}
};

exports.getSubTiddler = function(title,subTiddlerTitle) {
	const bundleInfo = this.getPluginInfo(title) || this.getTiddlerDataCached(title);
	if(bundleInfo && bundleInfo.tiddlers) {
		const subTiddler = bundleInfo.tiddlers[subTiddlerTitle];
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
	const tiddler = this.getTiddler(title);
	if(tiddler) {
		const fields = Object.create(null);
		$tw.utils.each(tiddler.fields,(value,name) => {
			fields[name] = tiddler.getFieldString(name);
		});
		return JSON.stringify(fields);
	} else {
		return JSON.stringify({title});
	}
};

exports.getTiddlersAsJson = function(filter,spaces) {
	const tiddlers = this.filterTiddlers(filter);
	var spaces = (spaces === undefined) ? $tw.config.preferences.jsonSpaces : spaces;
	const data = [];
	for(let t = 0;t < tiddlers.length;t++) {
		const tiddler = this.getTiddler(tiddlers[t]);
		if(tiddler) {
			const fields = new Object();
			for(const field in tiddler.fields) {
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
	const self = this;
	let tiddler = titleOrTiddler;
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = this.getTiddler(tiddler);
	}
	if(tiddler) {
		return this.getCacheForTiddler(tiddler.fields.title,"data",() => {
			// Return the frozen value
			const value = self.getTiddlerData(tiddler.fields.title,undefined);
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
	let tiddler = titleOrTiddler;
	let data;
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = this.getTiddler(tiddler);
	}
	if(tiddler && tiddler.fields.text) {
		switch(tiddler.fields.type) {
			case "application/json": {
				// JSON tiddler
				return $tw.utils.parseJSONSafe(tiddler.fields.text,defaultData);
			}
			case "application/x-tiddler-dictionary": {
				return $tw.utils.parseFields(tiddler.fields.text);
			}
		}
	}
	return defaultData;
};

/*
Extract an indexed field from within a data tiddler
*/
exports.extractTiddlerDataItem = function(titleOrTiddler,index,defaultText) {
	const data = this.getTiddlerDataCached(titleOrTiddler,Object.create(null));
	let text;
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
options: optional hashmap of options including:
	suppressTimestamp: if true, don't set the creation/modification timestamps
*/
exports.setTiddlerData = function(title,data,fields,options) {
	options = options || {};
	const existingTiddler = this.getTiddler(title);
	const creationFields = options.suppressTimestamp ? {} : this.getCreationFields();
	const modificationFields = options.suppressTimestamp ? {} : this.getModificationFields();
	const newFields = {
		title
	};
	if(existingTiddler && existingTiddler.fields.type === "application/x-tiddler-dictionary") {
		newFields.text = $tw.utils.makeTiddlerDictionary(data);
	} else {
		newFields.type = "application/json";
		newFields.text = JSON.stringify(data,null,$tw.config.preferences.jsonSpaces);
	}
	this.addTiddler(new $tw.Tiddler(creationFields,existingTiddler,fields,newFields,modificationFields));
};

/*
Return the content of a tiddler as an array containing each line
*/
exports.getTiddlerList = function(title,field,index) {
	if(index) {
		return $tw.utils.parseStringArray(this.extractTiddlerDataItem(title,index,""));
	}
	field = field || "list";
	const tiddler = this.getTiddler(title);
	if(tiddler) {
		return [...($tw.utils.parseStringArray(tiddler.fields[field]) || [])];
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
	let caches = this.caches[title];
	if(caches && caches[cacheName] !== undefined) {
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
	const self = this;
	$tw.modules.forEachModuleOfType("parser",(title,module) => {
		for(const f in module) {
			if($tw.utils.hop(module,f)) {
				$tw.Wiki.parsers[f] = module[f]; // Store the parser class
			}
		}
	});
	// Use the generic binary parser for any binary types not registered so far
	if($tw.Wiki.parsers["application/octet-stream"]) {
		Object.keys($tw.config.contentTypeInfo).forEach((type) => {
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
	let Parser = $tw.Wiki.parsers[type];
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
		_canonical_uri: options._canonical_uri,
		configTrimWhiteSpace: options.configTrimWhiteSpace
	});
};

/*
Parse a tiddler according to its MIME type
*/
exports.parseTiddler = function(title,options) {
	options = $tw.utils.extend({},options);
	const cacheType = options.parseAsInline ? "inlineParseTree" : "blockParseTree";
	const tiddler = this.getTiddler(title);
	const self = this;
	return tiddler ? this.getCacheForTiddler(title,cacheType,() => {
		if(tiddler.hasField("_canonical_uri")) {
			options._canonical_uri = tiddler.fields._canonical_uri;
		}
		return self.parseText(tiddler.fields.type,tiddler.fields.text,options);
	}) : null;
};

exports.parseTextReference = function(title,field,index,options) {
	let tiddler;
	let text;
	let parserInfo;
	if(!options.subTiddler) {
		tiddler = this.getTiddler(title);
		if(field === "text" || (!field && !index)) {
			this.getTiddlerText(title); // Force the tiddler to be lazily loaded
			return this.parseTiddler(title,options);
		}
	}
	parserInfo = this.getTextReferenceParserInfo(title,field,index,options);
	if(parserInfo.sourceText !== null) {
		return this.parseText(parserInfo.parserType,parserInfo.sourceText,options);
	} else {
		return null;
	}
};

exports.getTextReferenceParserInfo = function(title,field,index,options) {
	const defaultType = options.defaultType || "text/vnd.tiddlywiki";
	let tiddler;
	const parserInfo = {
		sourceText: null,
		parserType: defaultType
	};
	if(options.subTiddler) {
		tiddler = this.getSubTiddler(title,options.subTiddler);
	} else {
		tiddler = this.getTiddler(title);
	}
	if(field === "text" || (!field && !index)) {
		if(tiddler && tiddler.fields) {
			parserInfo.sourceText = tiddler.fields.text || "";
			if(tiddler.fields.type) {
				parserInfo.parserType = tiddler.fields.type;
			}
			parserInfo._canonical_uri = tiddler.fields._canonical_uri;
		}
	} else if(field) {
		if(field === "title") {
			parserInfo.sourceText = title;
		} else if(tiddler && tiddler.fields) {
			parserInfo.sourceText = tiddler.hasField(field) ? tiddler.fields[field].toString() : null;
		}
	} else if(index) {
		this.getTiddlerText(title); // Force the tiddler to be lazily loaded
		parserInfo.sourceText = this.extractTiddlerDataItem(tiddler,index,null);
	}
	if(parserInfo.sourceText === null) {
		parserInfo.parserType = null;
	}
	return parserInfo;
};

/*
Parse a block of text of a specified MIME type
	text: text on which to perform substitutions
	widget
	options: see below
Options include:
	substitutions: an optional array of substitutions
*/
exports.getSubstitutedText = function(text,widget,options) {
	options = options || {};
	text = text || "";
	const self = this;
	const substitutions = options.substitutions || [];
	let output;
	// Evaluate embedded filters and substitute with first result
	output = text.replace(/\$\{([\S\s]+?)\}\$/g,(match,filter) => {
		return self.filterTiddlers(filter,widget)[0] || "";
	});
	// Process any substitutions provided in options
	$tw.utils.each(substitutions,(substitute) => {
		output = $tw.utils.replaceString(output,new RegExp(String.raw`\$` + $tw.utils.escapeRegExp(substitute.name) + String.raw`\$`,"mg"),substitute.value);
	});
	// Substitute any variable references with their values
	return output.replace(/\$\((.+?)\)\$/g,(match,varname) => {
		return widget.getVariable(varname,{defaultValue: ""});
	});
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
	const widgetNode = {
		type: "widget",
		children: []
	};
	let currWidgetNode = widgetNode;
	// Create let variable widget for variables
	if($tw.utils.count(options.variables) > 0) {
		const letVariableWidget = {
			type: "let",
			attributes: {},
			children: []
		};
		$tw.utils.each(options.variables,(value,name) => {
			$tw.utils.addAttributeToParseTreeNode(letVariableWidget,name,`${value}`);
		});
		currWidgetNode.children = [letVariableWidget];
		currWidgetNode = letVariableWidget;
	}
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
	const parseTreeDiv = {
		tree: [{
			type: "element",
			tag: "div",
			children: []
		}]
	};
	const parseTreeImportVariables = {
		type: "importvariables",
		attributes: {
			filter: {
				name: "filter",
				type: "string"
			}
		},
		isBlock: false,
		children: []
	};
	const parseTreeTransclude = {
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
		isBlock: !options.parseAsInline
	};
	if(options.importVariables || options.importPageMacros) {
		if(options.importVariables) {
			parseTreeImportVariables.attributes.filter.value = options.importVariables;
		} else if(options.importPageMacros) {
			parseTreeImportVariables.attributes.filter.value = this.getTiddlerText("$:/core/config/GlobalImportFilter");
		}
		parseTreeDiv.tree[0].children.push(parseTreeImportVariables);
		parseTreeImportVariables.children.push(parseTreeTransclude);
	} else {
		parseTreeDiv.tree[0].children.push(parseTreeTransclude);
	}
	if(options.field) {
		parseTreeTransclude.attributes.field = {type: "string",value: options.field};
	}
	if(options.mode) {
		parseTreeTransclude.attributes.mode = {type: "string",value: options.mode};
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
	const parser = this.parseText(textType,text,options);
	const widgetNode = this.makeWidget(parser,options);
	const container = $tw.fakeDocument.createElement("div");
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
	const parser = this.parseTiddler(title,options);
	const widgetNode = this.makeWidget(parser,options);
	const container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return outputType === "text/html" ? container.innerHTML : (outputType === "text/plain-formatted" ? container.formattedTextContent : container.textContent);
};

/*
Return an array of tiddler titles that match a search string
	text: The text string to search for
	options: see below
Options available:
	source: an iterator function for the source tiddlers, called source(iterator),
		where iterator is called as iterator(tiddler,title)
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
		words: (default) treats search string as a list of tokens, and matches if all tokens are found, 
			regardless of adjacency or ordering
		some: treats search string as a list of tokens, and matches if at least ONE token is found
*/
exports.search = function(text,options) {
	options = options || {};
	const self = this;
	let t;
	let regExpStr = "";
	const invert = !!options.invert;
	// Convert the search string into a regexp for each term
	let terms; let searchTermsRegExps;
	const flags = options.caseSensitive ? "" : "i";
	const anchor = options.anchored ? "^" : "";
	if(options.literal) {
		if(text.length === 0) {
			searchTermsRegExps = null;
		} else {
			searchTermsRegExps = [new RegExp(`(${anchor}${$tw.utils.escapeRegExp(text)})`,flags)];
		}
	} else if(options.whitespace) {
		terms = [];
		$tw.utils.each(text.split(/\s+/g),(term) => {
			if(term) {
				terms.push($tw.utils.escapeRegExp(term));
			}
		});
		searchTermsRegExps = [new RegExp(`(${anchor}${terms.join(String.raw`\s+`)})`,flags)];
	} else if(options.regexp) {
		try {
			searchTermsRegExps = [new RegExp(`(${text})`,flags)];
		} catch(e) {
			searchTermsRegExps = null;
			console.log(`Regexp error parsing /(${text})/${flags}: `,e);
		}
	} else if(options.some) {
		terms = text.trim().split(/[^\S\xA0]+/);
		if(terms.length === 1 && terms[0] === "") {
			searchTermsRegExps = null;
		} else {
			searchTermsRegExps = [];
			for(t = 0;t < terms.length;t++) {
				regExpStr += (t === 0) ? anchor + $tw.utils.escapeRegExp(terms[t]) : `|${anchor}${$tw.utils.escapeRegExp(terms[t])}`;
			}
			searchTermsRegExps.push(new RegExp(`(${regExpStr})`,flags));
		}
	} else { // default: words
		terms = text.split(/[^\S\xA0]+/);
		if(terms.length === 1 && terms[0] === "") {
			searchTermsRegExps = null;
		} else {
			searchTermsRegExps = [];
			for(t = 0;t < terms.length;t++) {
				searchTermsRegExps.push(new RegExp(`(${anchor}${$tw.utils.escapeRegExp(terms[t])})`,flags));
			}
		}
	}
	// Accumulate the array of fields to be searched or excluded from the search
	const fields = [];
	if(options.field) {
		if($tw.utils.isArray(options.field)) {
			$tw.utils.each(options.field,(fieldName) => {
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
	const searchTiddler = function(title) {
		if(!searchTermsRegExps) {
			return true;
		}
		const notYetFound = [...searchTermsRegExps];

		let tiddler = self.getTiddler(title);
		if(!tiddler) {
			tiddler = new $tw.Tiddler({title,text: "",type: "text/vnd.tiddlywiki"});
		}
		const contentTypeInfo = $tw.config.contentTypeInfo[tiddler.fields.type] || $tw.config.contentTypeInfo["text/vnd.tiddlywiki"];
		let searchFields;
		// Get the list of fields we're searching
		if(options.excludeField) {
			searchFields = Object.keys(tiddler.fields);
			$tw.utils.each(fields,(fieldName) => {
				const p = searchFields.indexOf(fieldName);
				if(p !== -1) {
					searchFields.splice(p,1);
				}
			});
		} else {
			searchFields = fields;
		}
		for(let fieldIndex = 0;notYetFound.length > 0 && fieldIndex < searchFields.length;fieldIndex++) {
			// Don't search the text field if the content type is binary
			const fieldName = searchFields[fieldIndex];
			if(fieldName === "text" && contentTypeInfo.encoding !== "utf8") {
				break;
			}
			let str = tiddler.fields[fieldName];
			var t;
			if(str) {
				if($tw.utils.isArray(str)) {
					// If the field value is an array, test each regexp against each field array entry and fail if each regexp doesn't match at least one field array entry
					for(let s = 0;s < str.length;s++) {
						for(t = 0;t < notYetFound.length;) {
							if(notYetFound[t].test(str[s])) {
								notYetFound.splice(t,1);
							} else {
								t++;
							}
						}
					}
				} else {
					// If the field isn't an array, force it to a string and test each regexp against it and fail if any do not match
					str = tiddler.getFieldString(fieldName);
					for(t = 0;t < notYetFound.length;) {
						if(notYetFound[t].test(str)) {
							notYetFound.splice(t,1);
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
	const results = [];
	const source = options.source || this.each;
	source((tiddler,title) => {
		if(searchTiddler(title) !== invert) {
			results.push(title);
		}
	});
	// Remove any of the results we have to exclude
	if(options.exclude) {
		for(t = 0;t < options.exclude.length;t++) {
			const p = results.indexOf(options.exclude[t]);
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
	const tiddler = this.getTiddler(title);
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
	let text = this.getTiddlerText(title,"");
	if(!options.noTrim) {
		text = text.trim();
	}
	if(!options.caseSensitive) {
		text = text.toLowerCase();
		targetText = targetText.toLowerCase();
	}
	return text === targetText;
};

/*
Execute an action string without an associated context widget
*/
exports.invokeActionString = function(actions,event,variables,options) {
	const widget = this.makeWidget(null,{parentWidget: options.parentWidget});
	widget.invokeActionString(actions,null,event,variables);
};

/*
Read an array of browser File objects, invoking callback(tiddlerFieldsArray) once they're all read
*/
exports.readFiles = function(files,options) {
	let callback;
	if(typeof options === "function") {
		callback = options;
		options = {};
	} else {
		callback = options.callback;
	}
	const result = [];
	let outstanding = files.length;
	const readFileCallback = function(tiddlerFieldsArray) {
		result.push.apply(result,tiddlerFieldsArray);
		if(--outstanding === 0) {
			callback(result);
		}
	};
	for(let f = 0;f < files.length;f++) {
		this.readFile(files[f],$tw.utils.extend({},options,{callback: readFileCallback}));
	}
	return files.length;
};

/*
Read a browser File object, invoking callback(tiddlerFieldsArray) with an array of tiddler fields objects
*/
exports.readFile = function(file,options) {
	let callback;
	if(typeof options === "function") {
		callback = options;
		options = {};
	} else {
		callback = options.callback;
	}
	// Get the type, falling back to the filename extension
	const self = this;
	let {type} = file;
	if(type === "" || !type) {
		const dotPos = file.name.lastIndexOf(".");
		if(dotPos !== -1) {
			const fileExtensionInfo = $tw.utils.getFileExtensionInfo(file.name.substr(dotPos));
			if(fileExtensionInfo) {
				type = fileExtensionInfo.type;
			}
		}
	}
	// Figure out if we're reading a binary file
	const contentTypeInfo = $tw.config.contentTypeInfo[type];
	const isBinary = contentTypeInfo ? contentTypeInfo.encoding === "base64" : false;
	// Log some debugging information
	if($tw.log.IMPORT) {
		console.log(`Importing file '${file.name}', type: '${type}', isBinary: ${isBinary}`);
	}
	// Give the hook a chance to process the drag
	if($tw.hooks.invokeHook("th-importing-file",{
		file,
		type,
		isBinary,
		callback
	}) !== true) {
		this.readFileContent(file,type,isBinary,options.deserializer,callback);
	}
};

/*
Lower level utility to read the content of a browser File object, invoking callback(tiddlerFieldsArray) with an array of tiddler fields objects
*/
exports.readFileContent = function(file,type,isBinary,deserializer,callback) {
	const self = this;
	// Create the FileReader
	const reader = new FileReader();
	// Onload
	reader.onload = function(event) {
		let text = event.target.result;
		const tiddlerFields = {title: file.name || "Untitled"};
		if(isBinary) {
			const commaPos = text.indexOf(",");
			if(commaPos !== -1) {
				text = text.substr(commaPos + 1);
			}
		}
		// Check whether this is an encrypted TiddlyWiki file
		const encryptedJson = $tw.utils.extractEncryptedStoreArea(text);
		if(encryptedJson) {
			// If so, attempt to decrypt it with the current password
			$tw.utils.decryptStoreAreaInteractive(encryptedJson,(tiddlers) => {
				callback(tiddlers);
			});
		} else {
			// Otherwise, just try to deserialise any tiddlers in the file
			callback(self.deserializeTiddlers(type,text,tiddlerFields,{deserializer}));
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
	let draftTitle = undefined;
	this.forEachTiddler({includeSystem: true},(title,tiddler) => {
		if(tiddler.fields["draft.title"] && tiddler.fields["draft.of"] === targetTitle) {
			draftTitle = title;
		}
	});
	return draftTitle;
};

/*
Check whether the specified draft tiddler has been modified.
If the original tiddler doesn't exist, create  a vanilla tiddler variable,
to check if additional fields have been added.
*/
exports.isDraftModified = function(title) {
	const tiddler = this.getTiddler(title);
	if(!tiddler.isDraft()) {
		return false;
	}
	const ignoredFields = ["created","modified","title","draft.title","draft.of"];
	const origTiddler = this.getTiddler(tiddler.fields["draft.of"]) || new $tw.Tiddler({text: "",tags: []});
	const titleModified = tiddler.fields["draft.title"] !== tiddler.fields["draft.of"];
	return titleModified || !tiddler.isEqual(origTiddler,ignoredFields);
};

/*
Add a new record to the top of the history stack
title: a title string or an array of title strings
fromPageRect: page coordinates of the origin of the navigation
historyTitle: title of history tiddler (defaults to $:/HistoryList)
*/
exports.addToHistory = function(title,fromPageRect,historyTitle) {
	const story = new $tw.Story({wiki: this,historyTitle});
	story.addToHistory(title,fromPageRect);
	console.log("$tw.wiki.addToHistory() is deprecated since V5.1.23! Use the this.story.addToHistory() from the story-object!");
};

/*
Add a new tiddler to the story river
title: a title string or an array of title strings
fromTitle: the title of the tiddler from which the navigation originated
storyTitle: title of story tiddler (defaults to $:/StoryList)
options: see story.js
*/
exports.addToStory = function(title,fromTitle,storyTitle,options) {
	const story = new $tw.Story({wiki: this,storyTitle});
	story.addToStory(title,fromTitle,options);
	console.log("$tw.wiki.addToStory() is deprecated since V5.1.23! Use the this.story.addToStory() from the story-object!");
};

/*
Generate a title for the draft of a given tiddler
*/
exports.generateDraftTitle = function(title) {
	let c = 0;
	let draftTitle;
	const username = this.getTiddlerText("$:/status/UserName");
	const attribution = username ? ` by ${username}` : "";
	do {
		draftTitle = `Draft ${c ? `${c + 1} ` : ""}of '${title}'${attribution}`;
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
	const self = this;
	if(!this.upgraderModules) {
		this.upgraderModules = [];
		$tw.modules.forEachModuleOfType("upgrader",(title,module) => {
			if(module.upgrade) {
				self.upgraderModules.push(module);
			}
		});
	}
	// Invoke each upgrader in turn
	const messages = {};
	for(let t = 0;t < this.upgraderModules.length;t++) {
		const upgrader = this.upgraderModules[t];
		const upgraderMessages = upgrader.upgrade(this,titles,tiddlers);
		$tw.utils.extend(messages,upgraderMessages);
	}
	return messages;
};

// Determine whether a plugin by title is dynamically loadable
exports.doesPluginRequireReload = function(title) {
	const tiddler = this.getTiddler(title);
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
		let foundModule = false;
		$tw.utils.each(pluginInfo.tiddlers,(tiddler) => {
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
	const tiddler = this.getTiddler(title);
	let slug;
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
		const result = [];
		$tw.utils.each(title.split(""),(char) => {
			result.push(char.charCodeAt(0).toString());
		});
		slug = result.join("-");
	}
	return slug;
};
