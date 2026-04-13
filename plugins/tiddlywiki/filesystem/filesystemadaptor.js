/*\
title: $:/plugins/tiddlywiki/filesystem/filesystemadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with the local filesystem via node.js APIs

\*/

"use strict";

// Get a reference to the file system
var fs = $tw.node ? require("fs") : null;
var path = $tw.node ? require("path") : null;

function FileSystemAdaptor(options) {
	this.wiki = options.wiki;
	this.boot = options.boot || $tw.boot;
	this.logger = new $tw.utils.Logger("filesystem",{colour: "blue"});
	// Create the <wiki>/tiddlers folder if it doesn't exist
	if(this.boot.wikiTiddlersPath) {
		$tw.utils.createDirectory(this.boot.wikiTiddlersPath);
	}
	// Buffers for out-of-band file changes, drained by getUpdatedTiddlers
	this.modifications = Object.create(null);
	this.deletions = Object.create(null);
	this.pendingTimers = Object.create(null);
	this.watchers = [];
	this.setupWatchers();
}

FileSystemAdaptor.prototype.name = "filesystem";

FileSystemAdaptor.prototype.supportsLazyLoading = false;

FileSystemAdaptor.prototype.isReady = function() {
	return true;
};

FileSystemAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	var title = tiddler.fields.title;
	return this.boot.files[title];
};

/*
Find the dynamic store (if any) that a tiddler should be saved into.
Precedence: existing boot.files entry wins; otherwise first matching saveFilter.
*/
FileSystemAdaptor.prototype.findDynamicStoreForTiddler = function(tiddler) {
	var stores = this.boot.dynamicStores || [];
	if(stores.length === 0) {
		return null;
	}
	var title = tiddler.fields.title,
		existing = this.boot.files[title];
	if(existing && existing.dynamicStoreId) {
		for(var i=0; i<stores.length; i++) {
			if(stores[i].id === existing.dynamicStoreId) {
				return stores[i];
			}
		}
	}
	for(var j=0; j<stores.length; j++) {
		var store = stores[j];
		if(store.saveFilter) {
			var source = this.wiki.makeTiddlerIterator([title]),
				result = this.wiki.filterTiddlers(store.saveFilter,null,source);
			if(result.length > 0) {
				return store;
			}
		}
	}
	return null;
};

/*
Return a fileInfo object for a tiddler, creating it if necessary.
*/
FileSystemAdaptor.prototype.getTiddlerFileInfo = function(tiddler,callback) {
	if(!this.boot.wikiTiddlersPath) {
		return callback("filesystemadaptor requires a valid wiki folder");
	}
	var title = tiddler.fields.title, newInfo, pathFilters, extFilters,
		fileInfo = this.boot.files[title],
		store = this.findDynamicStoreForTiddler(tiddler),
		directory = store ? store.directory : this.boot.wikiTiddlersPath;
	if(this.wiki.tiddlerExists("$:/config/FileSystemPaths")) {
		pathFilters = this.wiki.getTiddlerText("$:/config/FileSystemPaths","").split("\n");
	}
	if(this.wiki.tiddlerExists("$:/config/FileSystemExtensions")) {
		extFilters = this.wiki.getTiddlerText("$:/config/FileSystemExtensions","").split("\n");
	}
	newInfo = $tw.utils.generateTiddlerFileInfo(tiddler,{
		directory: directory,
		pathFilters: pathFilters,
		extFilters: extFilters,
		wiki: this.wiki,
		fileInfo: fileInfo
	});
	if(store) {
		newInfo.dynamicStoreId = store.id;
	}
	callback(null,newInfo);
};


/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
FileSystemAdaptor.prototype.saveTiddler = function(tiddler,callback,options) {
	var self = this;
	var syncerInfo = options.tiddlerInfo || {};
	this.getTiddlerFileInfo(tiddler,function(err,fileInfo) {
		if(err) {
			return callback(err);
		}
		var dynamicStoreId = fileInfo && fileInfo.dynamicStoreId || null;
		$tw.utils.saveTiddlerToFile(tiddler,fileInfo,function(err,fileInfo) {
			if(err) {
				if((err.code == "EPERM" || err.code == "EACCES") && err.syscall == "open") {
					fileInfo = fileInfo || self.boot.files[tiddler.fields.title];
					fileInfo.writeError = true;
					self.boot.files[tiddler.fields.title] = fileInfo;
					$tw.syncer.logger.log("Sync failed for \""+tiddler.fields.title+"\" and will be retried with encoded filepath",encodeURIComponent(fileInfo.filepath));
					return callback(err);
				} else {
					return callback(err);
				}
			}
			if(dynamicStoreId && fileInfo) {
				fileInfo.dynamicStoreId = dynamicStoreId;
			}
			// Store new boot info only after successful writes
			self.boot.files[tiddler.fields.title] = fileInfo;
			// Cleanup duplicates if the file moved or changed extensions
			var options = {
				adaptorInfo: syncerInfo.adaptorInfo || {},
				bootInfo: fileInfo || {},
				title: tiddler.fields.title
			};
			$tw.utils.cleanupTiddlerFiles(options,function(err,fileInfo) {
				if(err) {
					return callback(err);
				}
				return callback(null,fileInfo);
			});
		});
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)

Most tiddlers are pre-loaded at boot, but the syncer may ask us to load
individual tiddlers in response to watcher-driven out-of-band changes.
*/
FileSystemAdaptor.prototype.loadTiddler = function(title,callback) {
	var fileInfo = this.boot.files[title];
	if(!fileInfo || !fileInfo.dynamicStoreId || !fs.existsSync(fileInfo.filepath)) {
		return callback(null,null);
	}
	var loaded;
	try {
		loaded = $tw.loadTiddlersFromFile(fileInfo.filepath,{});
	} catch(e) {
		return callback(e);
	}
	if(!loaded || !loaded.tiddlers) {
		return callback(null,null);
	}
	for(var i=0; i<loaded.tiddlers.length; i++) {
		if(loaded.tiddlers[i] && loaded.tiddlers[i].title === title) {
			return callback(null,loaded.tiddlers[i]);
		}
	}
	callback(null,null);
};

/*
Delete a tiddler and invoke the callback with (err)
*/
FileSystemAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	var self = this,
		fileInfo = this.boot.files[title];
	if(fileInfo) {
		$tw.utils.deleteTiddlerFile(fileInfo,function(err,fileInfo) {
			if(err) {
				if((err.code == "EPERM" || err.code == "EACCES") && err.syscall == "unlink") {
					$tw.syncer.displayError("Server desynchronized. Error deleting file for deleted tiddler \"" + title + "\"",err);
					return callback(null,fileInfo);
				} else {
					return callback(err);
				}
			}
			self.removeTiddlerFileInfo(title);
			return callback(null,null);
		});
	} else {
		callback(null,null);
	}
};

/*
Delete a tiddler in cache, without modifying file system.
*/
FileSystemAdaptor.prototype.removeTiddlerFileInfo = function(title) {
	if(this.boot.files[title]) {
		delete this.boot.files[title];
	}
};

/*
Syncer hook: return modifications/deletions that have occurred on disk
since the last poll.
*/
FileSystemAdaptor.prototype.getUpdatedTiddlers = function(syncer,callback) {
	var modifications = Object.keys(this.modifications),
		deletions = Object.keys(this.deletions);
	this.modifications = Object.create(null);
	this.deletions = Object.create(null);
	callback(null,{modifications: modifications, deletions: deletions});
};

/*
Set up chokidar watchers for each registered dynamic store.
*/
/*
Close all watchers and clear any pending debounce timers. Returns a promise
that resolves once chokidar has fully shut down, for clean teardown in tests.
*/
FileSystemAdaptor.prototype.close = function() {
	$tw.utils.each(this.pendingTimers,function(timer) { clearTimeout(timer); });
	this.pendingTimers = Object.create(null);
	var closes = (this.watchers || []).map(function(w) {
		try { return w.close(); } catch(e) { return null; }
	});
	this.watchers = [];
	return Promise.all(closes.filter(Boolean));
};

FileSystemAdaptor.prototype.setupWatchers = function() {
	var self = this,
		stores = (this.boot.dynamicStores || []).filter(function(s) { return s.watch; });
	if(stores.length === 0) {
		return;
	}
	var chokidar;
	try {
		chokidar = require("chokidar");
	} catch(e) {
		this.logger.log("chokidar not available; dynamic store watching disabled",e.message);
		return;
	}
	stores.forEach(function(store) {
		self.setupWatcher(chokidar,store);
	});
};

FileSystemAdaptor.prototype.setupWatcher = function(chokidar,store) {
	var self = this,
		fileRegExp = new RegExp(store.filesRegExp || "^.*$");
	var watcher = chokidar.watch(store.directory,{
		ignoreInitial: true,
		persistent: true,
		depth: store.searchSubdirectories ? undefined : 0,
		awaitWriteFinish: {stabilityThreshold: 100, pollInterval: 50},
		ignored: function(p) {
			// chokidar invokes `ignored` for the root too — don't ignore the root
			if(p === store.directory) return false;
			var base = path.basename(p);
			if(/\.meta$/.test(base)) return false;
			// Allow directories through so recursion works when enabled
			try {
				if(fs.existsSync(p) && fs.statSync(p).isDirectory()) return false;
			} catch(e) {}
			return !fileRegExp.test(base);
		}
	});
	watcher.on("add",function(filepath) { self.scheduleFileEvent(store,filepath,"change"); });
	watcher.on("change",function(filepath) { self.scheduleFileEvent(store,filepath,"change"); });
	watcher.on("unlink",function(filepath) { self.scheduleFileEvent(store,filepath,"unlink"); });
	watcher.on("error",function(err) {
		self.logger.log("chokidar error for " + store.directory,err && err.message);
	});
	this.watchers.push(watcher);
};

FileSystemAdaptor.prototype.scheduleFileEvent = function(store,filepath,eventType) {
	var self = this,
		key = filepath,
		delay = store.debounce || 400;
	// A .meta change should trigger re-read of its companion file
	var targetPath = filepath;
	if(/\.meta$/.test(filepath)) {
		targetPath = filepath.replace(/\.meta$/,"");
	}
	if(this.pendingTimers[key]) {
		clearTimeout(this.pendingTimers[key]);
	}
	var timer = setTimeout(function() {
		delete self.pendingTimers[key];
		try {
			self.processFileEvent(store,targetPath,eventType);
		} catch(e) {
			self.logger.log("Error processing file event for " + targetPath,e.message);
		}
	},delay);
	if(timer && typeof timer.unref === "function") {
		timer.unref();
	}
	this.pendingTimers[key] = timer;
};

FileSystemAdaptor.prototype.processFileEvent = function(store,filepath,eventType) {
	var self = this;
	// Deletion: look up any titles that mapped to this filepath and queue deletion.
	// Do NOT call wiki.deleteTiddler here — the syncer's SyncFromServerTask does that.
	if(eventType === "unlink" || !fs.existsSync(filepath)) {
		var deletedTitles = [];
		$tw.utils.each(this.boot.files,function(info,title) {
			if(info && info.filepath === filepath) {
				deletedTitles.push(title);
			}
		});
		deletedTitles.forEach(function(title) {
			delete self.boot.files[title];
			self.deletions[title] = true;
			delete self.modifications[title];
		});
		if(deletedTitles.length > 0) {
			this.logger.log("Dynamic store: detected removal of " + deletedTitles.length + " tiddler(s) at " + filepath);
		}
		return;
	}
	// Add/change: re-parse the file and queue modifications
	var loaded;
	try {
		loaded = $tw.loadTiddlersFromFile(filepath,{});
	} catch(e) {
		this.logger.log("Failed to load tiddler file " + filepath,e.message);
		return;
	}
	if(!loaded || !loaded.tiddlers) {
		return;
	}
	var newTitles = {};
	loaded.tiddlers.forEach(function(fields) {
		if(!fields || !fields.title) {
			return;
		}
		if(fields.type === "application/javascript" && fields["module-type"]) {
			self.logger.log("Skipping hot-reload of JS module tiddler " + fields.title + " (requires a restart)");
			return;
		}
		var title = fields.title;
		newTitles[title] = true;
		// Ensure boot.files tracks the file so loadTiddler can find it on demand
		self.boot.files[title] = {
			filepath: loaded.filepath,
			type: loaded.type,
			hasMetaFile: loaded.hasMetaFile,
			isEditableFile: true,
			dynamicStoreId: store.id
		};
		// Diff against the current wiki tiddler to suppress self-write echoes
		var existing = self.wiki.getTiddler(title);
		if(existing && self.tiddlerFieldsEqual(existing.fields,fields)) {
			return;
		}
		self.modifications[title] = true;
		delete self.deletions[title];
	});
	// Handle tiddlers that were previously in this file but have now disappeared
	$tw.utils.each(this.boot.files,function(info,title) {
		if(info && info.filepath === filepath && !newTitles[title]) {
			delete self.boot.files[title];
			self.deletions[title] = true;
			delete self.modifications[title];
		}
	});
};

FileSystemAdaptor.prototype.tiddlerFieldsEqual = function(existingFields,newFields) {
	// Ignore volatile fields that the syncer / server may add
	var ignore = {revision: 1, bag: 1};
	var keys = {};
	$tw.utils.each(existingFields,function(v,k) { if(!ignore[k]) keys[k] = true; });
	$tw.utils.each(newFields,function(v,k) { if(!ignore[k]) keys[k] = true; });
	for(var k in keys) {
		var a = existingFields[k],
			b = newFields[k];
		// Normalise arrays to string form
		if($tw.utils.isArray(a)) a = $tw.utils.stringifyList(a);
		if($tw.utils.isArray(b)) b = $tw.utils.stringifyList(b);
		if(a instanceof Date) a = $tw.utils.stringifyDate(a);
		if(b instanceof Date) b = $tw.utils.stringifyDate(b);
		if((a === undefined ? "" : String(a)) !== (b === undefined ? "" : String(b))) {
			return false;
		}
	}
	return true;
};

if(fs) {
	exports.adaptorClass = FileSystemAdaptor;
}
