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
	// Fingerprints of files written by this adaptor. Watch notifications are
	// asynchronous, so comparing the file with the current wiki tiddler is not
	// sufficient: the tiddler may already contain a newer edit by the time the
	// notification arrives.
	this.lastWriteStats = Object.create(null);
	// Reverse index from an absolute filepath to the titles loaded from it.
	// Watch events can therefore update only the affected titles without
	// scanning every entry in boot.files.
	this.filesByPath = Object.create(null);
	this.ignoredPathRegExps = Object.create(null);
	this.initialiseFileIndex();
	this.watcherProviders = options.watcherProviders || $tw.modules.getModulesByTypeAsHashmap("filesystemwatcher");
	this.watchers = [];
	this.watcherSetups = [];
	this.watchersReady = true;
	this.closed = false;
	this.setupWatchers();
	// Only advertise getUpdatedTiddlers (and so opt into syncer polling) when
	// there is actually a dynamic store to report changes from. Otherwise the
	// syncer would reschedule its poll forever and keep node alive past the
	// natural end of headless commands like --build.
	if(!(this.boot.dynamicStores && this.boot.dynamicStores.length > 0)) {
		this.getUpdatedTiddlers = undefined;
	}
}

FileSystemAdaptor.prototype.name = "filesystem";

FileSystemAdaptor.prototype.supportsLazyLoading = false;

FileSystemAdaptor.prototype.isReady = function() {
	return this.watchersReady;
};

FileSystemAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	var title = tiddler.fields.title;
	return this.boot.files[title];
};

FileSystemAdaptor.prototype.normaliseFilepath = function(filepath) {
	return path.resolve(filepath);
};

FileSystemAdaptor.prototype.initialiseFileIndex = function() {
	var self = this;
	$tw.utils.each(this.boot.files,function(fileInfo,title) {
		self.indexTiddlerFileInfo(title,fileInfo);
	});
};

FileSystemAdaptor.prototype.indexTiddlerFileInfo = function(title,fileInfo) {
	if(!fileInfo || !fileInfo.filepath) {
		return;
	}
	var filepath = this.normaliseFilepath(fileInfo.filepath),
		titles = this.filesByPath[filepath] || (this.filesByPath[filepath] = Object.create(null));
	titles[title] = true;
};

FileSystemAdaptor.prototype.unindexTiddlerFileInfo = function(title,fileInfo) {
	if(!fileInfo || !fileInfo.filepath) {
		return;
	}
	var filepath = this.normaliseFilepath(fileInfo.filepath),
		titles = this.filesByPath[filepath];
	if(titles) {
		delete titles[title];
		if(Object.keys(titles).length === 0) {
			delete this.filesByPath[filepath];
		}
	}
};

FileSystemAdaptor.prototype.setTiddlerFileInfo = function(title,fileInfo) {
	this.unindexTiddlerFileInfo(title,this.boot.files[title]);
	if(fileInfo) {
		this.boot.files[title] = fileInfo;
		this.indexTiddlerFileInfo(title,fileInfo);
	} else {
		delete this.boot.files[title];
	}
};

FileSystemAdaptor.prototype.getTitlesForFilepath = function(filepath) {
	var titles = this.filesByPath[this.normaliseFilepath(filepath)];
	return titles ? Object.keys(titles) : [];
};

FileSystemAdaptor.prototype.getDynamicStoreById = function(storeId) {
	var stores = this.boot.dynamicStores || [];
	for(var i=0; i<stores.length; i++) {
		if(stores[i].id === storeId) {
			return stores[i];
		}
	}
	return null;
};

FileSystemAdaptor.prototype.isFileLockError = function(error) {
	return error && ["EBUSY","EPERM","EACCES","EAGAIN"].indexOf(error.code) !== -1;
};

FileSystemAdaptor.prototype.getWriteRetryOptions = function(fileInfo) {
	var store = fileInfo && this.getDynamicStoreById(fileInfo.dynamicStoreId),
		storeOptions = store && store.writeRetry || {},
		getNumber = function(value,fallback) {
			var number = Number(value);
			return isFinite(number) && number >= 0 ? number : fallback;
		};
	return {
		attempts: Math.max(1,Math.floor(getNumber(
			storeOptions.attempts,
			this.wiki.getTiddlerText("$:/config/FileSystem/WriteRetryAttempts","10")
		))),
		initialDelay: getNumber(
			storeOptions.initialDelay,
			this.wiki.getTiddlerText("$:/config/FileSystem/WriteRetryInitialDelay","50")
		),
		maxDelay: getNumber(
			storeOptions.maxDelay,
			this.wiki.getTiddlerText("$:/config/FileSystem/WriteRetryMaxDelay","2000")
		)
	};
};

FileSystemAdaptor.prototype.notifyFileSystemError = function(operation,title,fileInfo,error,attempts) {
	var info = {
		adaptor: this,
		operation: operation,
		title: title,
		fileInfo: fileInfo,
		error: error,
		attempts: attempts
	};
	this.logger.alert("Filesystem " + operation + " failed for \"" + title + "\" at " + (fileInfo && fileInfo.filepath || "unknown path"),error);
	if($tw.hooks) {
		$tw.hooks.invokeHook("th-filesystem-error",info);
	}
};

FileSystemAdaptor.prototype.notifyFileSystemChange = function(operation,title,fileInfo) {
	if($tw.hooks) {
		$tw.hooks.invokeHook("th-filesystem-change",{
			adaptor: this,
			operation: operation,
			title: title,
			fileInfo: fileInfo
		});
	}
};

FileSystemAdaptor.prototype.saveTiddlerToFileWithRetry = function(tiddler,fileInfo,callback) {
	var self = this,
		retryOptions = this.getWriteRetryOptions(fileInfo),
		attempt = 0;
	var save = function() {
		attempt++;
		$tw.utils.saveTiddlerToFile(tiddler,fileInfo,function(error,savedFileInfo) {
			if(!error) {
				return callback(null,savedFileInfo);
			}
			if(self.isFileLockError(error) && attempt < retryOptions.attempts) {
				var delay = Math.min(
					retryOptions.initialDelay * Math.pow(2,attempt - 1),
					retryOptions.maxDelay
				);
				self.logger.log("File is locked; retrying save for \"" + tiddler.fields.title + "\" (" + attempt + "/" + retryOptions.attempts + ")");
				return setTimeout(save,delay);
			}
			self.notifyFileSystemError("save",tiddler.fields.title,fileInfo,error,attempt);
			callback(error,savedFileInfo);
		});
	};
	save();
};

FileSystemAdaptor.prototype.loadDynamicStoreFile = function(store,filepath,fallbackFields) {
	var filename = path.relative(store.directory,filepath),
		fields = $tw.utils.extend({},store.fields || {},fallbackFields || {});
	return $tw.loadTiddlersFromFileSpecification(
		store.directory,
		filename,
		store.isTiddlerFile,
		fields,
		true,
		".",
		store.id
	);
};

FileSystemAdaptor.prototype.getExternalAttachmentLocation = function(fileInfo) {
	var store = fileInfo && fileInfo.dynamicStoreId && this.getDynamicStoreById(fileInfo.dynamicStoreId);
	if(store) {
		return store.externalAttachments || null;
	}
	if(!this.boot.wikiPath) {
		return null;
	}
	return {
		basePath: this.boot.wikiPath,
		pathPrefix: this.wiki.getTiddlerText("$:/config/ExternalAttachments/WikiFolderToMove","files"),
		moveOnRoute: false
	};
};

FileSystemAdaptor.prototype.isPathWithin = function(basePath,filepath) {
	var relativePath = path.relative(path.resolve(basePath),path.resolve(filepath));
	return relativePath !== ".." && relativePath.indexOf(".." + path.sep) !== 0 && !path.isAbsolute(relativePath);
};

FileSystemAdaptor.prototype.moveExternalAttachment = function(tiddler,oldFileInfo,newFileInfo,callback) {
	var self = this,
		canonicalUri = tiddler.fields._canonical_uri;
	if(typeof canonicalUri !== "string" || !canonicalUri || /^[a-z][a-z0-9+.-]*:\/\//i.test(canonicalUri)) {
		return callback();
	}
	var decodedUri = $tw.utils.decodeURIComponentSafe(canonicalUri);
	if(path.isAbsolute(decodedUri)) {
		return callback();
	}
	var oldLocation = this.getExternalAttachmentLocation(oldFileInfo),
		newLocation = this.getExternalAttachmentLocation(newFileInfo);
	if(!oldLocation || !newLocation || !(oldLocation.moveOnRoute || newLocation.moveOnRoute)) {
		return callback();
	}
	if(path.resolve(oldLocation.basePath) === path.resolve(newLocation.basePath)) {
		return callback();
	}
	var oldPrefix = (oldLocation.pathPrefix || "files").replace(/\\/g,"/").replace(/^\/+|\/+$/g,""),
		newPrefix = (newLocation.pathPrefix || "files").replace(/\\/g,"/").replace(/^\/+|\/+$/g,""),
		normalisedUri = decodedUri.replace(/\\/g,"/").replace(/^\/+/,"");
	if(oldPrefix !== newPrefix || normalisedUri.indexOf(oldPrefix + "/") !== 0) {
		return callback();
	}
	var sourcePath = path.resolve(oldLocation.basePath,normalisedUri),
		targetPath = path.resolve(newLocation.basePath,normalisedUri);
	if(!this.isPathWithin(oldLocation.basePath,sourcePath) || !this.isPathWithin(newLocation.basePath,targetPath) || !fs.existsSync(sourcePath)) {
		return callback();
	}
	if(fs.existsSync(targetPath)) {
		this.notifyFileSystemError("move external attachment",tiddler.fields.title,newFileInfo,new Error("Target already exists: " + targetPath),1);
		return callback();
	}
	$tw.utils.createDirectory(path.dirname(targetPath));
	fs.rename(sourcePath,targetPath,function(error) {
		if(!error) {
			return callback();
		}
		if(error.code !== "EXDEV") {
			self.notifyFileSystemError("move external attachment",tiddler.fields.title,newFileInfo,error,1);
			return callback();
		}
		fs.copyFile(sourcePath,targetPath,function(copyError) {
			if(copyError) {
				self.notifyFileSystemError("move external attachment",tiddler.fields.title,newFileInfo,copyError,1);
				return callback();
			}
			fs.unlink(sourcePath,function(unlinkError) {
				if(unlinkError) {
					self.notifyFileSystemError("move external attachment",tiddler.fields.title,newFileInfo,unlinkError,1);
				}
				callback();
			});
		});
	});
};

/*
Find the dynamic store (if any) that a tiddler should be saved into.
Precedence: an existing boot.files entry wins unless its store opts into
reselectOnSave; otherwise the first matching saveFilter wins.
*/
FileSystemAdaptor.prototype.findDynamicStoreForTiddler = function(tiddler) {
	var stores = this.boot.dynamicStores || [];
	if(stores.length === 0) {
		return null;
	}
	var title = tiddler.fields.title,
		existing = this.boot.files[title],
		existingStore = null;
	if(existing && existing.dynamicStoreId) {
		for(var i=0; i<stores.length; i++) {
			if(stores[i].id === existing.dynamicStoreId) {
				existingStore = stores[i];
				break;
			}
		}
		if(existingStore && !existingStore.reselectOnSave) {
			return existingStore;
		}
	}
	for(var j=0; j<stores.length; j++) {
		var store = stores[j];
		if(store.saveFilter) {
			var source = this.wiki.makeTiddlerIterator([title]),
				result = this.wiki.filterTiddlers(store.saveFilter,null,source);
			if(result.indexOf(title) !== -1) {
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
		var requestedFileInfo = fileInfo,
			dynamicStoreId = fileInfo && fileInfo.dynamicStoreId || null;
		self.saveTiddlerToFileWithRetry(tiddler,fileInfo,function(err,fileInfo) {
			if(err) {
				if((err.code == "EPERM" || err.code == "EACCES") && err.syscall == "open") {
					fileInfo = fileInfo || requestedFileInfo || self.boot.files[tiddler.fields.title];
					self.setTiddlerFileInfo(tiddler.fields.title,fileInfo);
					// EPERM/EACCES commonly means that another Windows process
					// temporarily holds the file. Keep the same filepath for the
					// syncer's later retry instead of setting writeError, which
					// would encode the path and create a second file.
					return callback(err);
				} else {
					return callback(err);
				}
			}
			if(dynamicStoreId && fileInfo) {
				fileInfo.dynamicStoreId = dynamicStoreId;
			}
			var oldFileInfo = self.boot.files[tiddler.fields.title] || syncerInfo.adaptorInfo;
			// Store new boot info only after successful writes
			self.setTiddlerFileInfo(tiddler.fields.title,fileInfo);
			self.moveExternalAttachment(tiddler,oldFileInfo,fileInfo,function() {
				// Cleanup duplicates if the file moved or changed extensions
				var cleanupOptions = {
					adaptorInfo: syncerInfo.adaptorInfo || {},
					bootInfo: fileInfo || {},
					title: tiddler.fields.title
				};
				$tw.utils.cleanupTiddlerFiles(cleanupOptions,function(err,fileInfo) {
					if(err) {
						return callback(err);
					}
					self.recordFileWrite(fileInfo);
					self.notifyFileSystemChange("save",tiddler.fields.title,fileInfo);
					return callback(null,fileInfo);
				});
			});
		});
	});
};

/*
Record the mtime and size of files written by the adaptor so that the
corresponding asynchronous watcher notifications can be discarded without
comparing them with a potentially newer in-memory tiddler.
*/
FileSystemAdaptor.prototype.recordFileWrite = function(fileInfo) {
	var self = this;
	if(!fileInfo || !fileInfo.filepath) {
		return;
	}
	[fileInfo.filepath,fileInfo.hasMetaFile ? fileInfo.filepath + ".meta" : null].forEach(function(filepath) {
		if(!filepath) {
			return;
		}
		try {
			var stat = fs.statSync(filepath);
			self.lastWriteStats[path.resolve(filepath)] = {
				mtime: stat.mtimeMs,
				size: stat.size,
				expires: Date.now() + 30000
			};
		} catch(e) {
			// The companion file may have been removed while the save completed.
		}
	});
};

/*
Return true when a watcher event describes the exact file version most
recently written by this adaptor.
*/
FileSystemAdaptor.prototype.isSelfWriteEvent = function(filepath,eventType) {
	if(eventType === "unlink") {
		return false;
	}
	var resolvedPath = path.resolve(filepath),
		lastWrite = this.lastWriteStats[resolvedPath];
	if(!lastWrite) {
		return false;
	}
	if(Date.now() > lastWrite.expires) {
		delete this.lastWriteStats[resolvedPath];
		return false;
	}
	try {
		var stat = fs.statSync(resolvedPath);
		if(stat.mtimeMs === lastWrite.mtime && stat.size === lastWrite.size) {
			// Keep the fingerprint for duplicate notifications of the same
			// write. It expires quickly and is replaced by the next save.
			return true;
		}
		delete this.lastWriteStats[resolvedPath];
		return false;
	} catch(e) {
		delete this.lastWriteStats[resolvedPath];
		return false;
	}
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)

Most tiddlers are pre-loaded at boot, but the syncer may ask us to load
individual tiddlers in response to watcher-driven out-of-band changes.
*/
FileSystemAdaptor.prototype.loadTiddler = function(title,callback) {
	var fileInfo = this.boot.files[title],
		store = fileInfo && this.getDynamicStoreById(fileInfo.dynamicStoreId);
	if(!fileInfo || !fileInfo.dynamicStoreId || !fs.existsSync(fileInfo.filepath)) {
		return callback(null,null);
	}
	var loaded;
	try {
		// The companion .meta file may have been removed since boot. Preserve
		// the known tiddler identity while allowing all other metadata fields
		// to be removed by the reload.
		loaded = store ?
			this.loadDynamicStoreFile(store,fileInfo.filepath,store.isTiddlerFile ? null : {title: title}) :
			$tw.loadTiddlersFromFile(fileInfo.filepath,{title: title});
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
			self.notifyFileSystemChange("delete",title,fileInfo);
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
	this.setTiddlerFileInfo(title,null);
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
Close all watchers and clear any pending debounce timers. Returns a promise
that resolves once every provider has fully shut down, for clean teardown in
tests.
*/
FileSystemAdaptor.prototype.close = function() {
	var self = this;
	this.closed = true;
	$tw.utils.each(this.pendingTimers,function(timer) { clearTimeout(timer); });
	this.pendingTimers = Object.create(null);
	this.lastWriteStats = Object.create(null);
	return Promise.all(this.watcherSetups).then(function() {
		var closes = (self.watchers || []).map(function(watcher) {
			try {
				return watcher.close();
			} catch(e) {
				return null;
			}
		});
		self.watchers = [];
		return Promise.all(closes.filter(Boolean));
	});
};

FileSystemAdaptor.prototype.setupWatchers = function() {
	var self = this,
		stores = (this.boot.dynamicStores || []).filter(function(s) { return s.watch; });
	stores.forEach(function(store) {
		self.setupWatcher(store);
	});
};

FileSystemAdaptor.prototype.setupWatcher = function(store) {
	var self = this,
		providerName = store.watcherProvider || "chokidar",
		provider = this.watcherProviders[providerName];
	if(!provider || typeof provider.create !== "function") {
		this.handleWatcherError(store,new Error("Filesystem watcher provider \"" + providerName + "\" is not available"));
		return;
	}
	var watcherOptions = {
			directory: store.directory,
			searchSubdirectories: !!store.searchSubdirectories,
			followSymlinks: store.followSymlinks !== false,
			isIgnored: function(filepath,stats) {
				return self.isPathIgnored(store,filepath,stats);
			},
			onEvent: function(filepath,eventType) {
				self.scheduleFileEvent(store,filepath,eventType);
			},
			onError: function(error) {
				self.handleWatcherError(store,error);
			}
		},
		watcher;
	try {
		watcher = provider.create(watcherOptions);
	} catch(e) {
		this.handleWatcherError(store,e);
		return;
	}
	if(watcher && typeof watcher.then === "function") {
		this.watchersReady = false;
		var setup = watcher.then(function(resolvedWatcher) {
			if(resolvedWatcher) {
				self.watchers.push(resolvedWatcher);
			}
		},function(error) {
			self.handleWatcherError(store,error);
		}).then(function() {
			self.watchersReady = self.watcherSetups.every(function(item) {
				return item.settled;
			});
		});
		setup.settled = false;
		setup.then(function() {
			setup.settled = true;
			self.watchersReady = self.watcherSetups.every(function(item) {
				return item.settled;
			});
		});
		this.watcherSetups.push(setup);
	} else if(watcher) {
		this.watchers.push(watcher);
	}
};

FileSystemAdaptor.prototype.handleWatcherError = function(store,error) {
	var info = {
		adaptor: this,
		store: store,
		error: error
	};
	this.logger.log("Filesystem watcher error for " + store.directory,error && error.message);
	if($tw.hooks) {
		$tw.hooks.invokeHook("th-filesystem-watcher-error",info);
	}
};

FileSystemAdaptor.prototype.notifyWatcherChange = function(operation,store,filepath,title,fields) {
	if($tw.hooks) {
		$tw.hooks.invokeHook("th-filesystem-watcher-change",{
			adaptor: this,
			operation: operation,
			store: store,
			filepath: filepath,
			title: title,
			fields: fields
		});
	}
};

FileSystemAdaptor.prototype.isPathIgnored = function(store,filepath,stats) {
	var storePath = path.resolve(store.directory),
		resolvedPath = path.resolve(filepath),
		relativePath = path.relative(storePath,resolvedPath);
	if(relativePath === "") {
		return false;
	}
	if(relativePath === ".." || relativePath.indexOf(".." + path.sep) === 0 || path.isAbsolute(relativePath)) {
		return true;
	}
	var ignoredRegExp = this.ignoredPathRegExps[store.id];
	if(ignoredRegExp === undefined) {
		try {
			ignoredRegExp = store.ignoredPathRegExp ? new RegExp(store.ignoredPathRegExp) : null;
		} catch(e) {
			this.handleWatcherError(store,new Error("Invalid ignoredPathRegExp: " + e.message));
			ignoredRegExp = null;
		}
		this.ignoredPathRegExps[store.id] = ignoredRegExp;
	}
	if(ignoredRegExp) {
		ignoredRegExp.lastIndex = 0;
		if(ignoredRegExp.test(relativePath.split(path.sep).join("/"))) {
			return true;
		}
	}
	try {
		stats = stats || fs.lstatSync(resolvedPath);
		if(stats.isDirectory()) {
			return false;
		}
		if(store.followSymlinks === false && stats.isSymbolicLink()) {
			return true;
		}
	} catch(e) {
		// Unlink events have no stat. Continue matching their basename.
	}
	var basename = path.basename(resolvedPath).replace(/\.meta$/,""),
		filesRegExp = new RegExp(store.filesRegExp || "^.*$");
	filesRegExp.lastIndex = 0;
	return !filesRegExp.test(basename);
};

FileSystemAdaptor.prototype.scheduleFileEvent = function(store,filepath,eventType) {
	var self = this,
		delay = store.debounce || 400;
	if(this.isPathIgnored(store,filepath)) {
		return;
	}
	var eventInfo = {
		adaptor: this,
		store: store,
		filepath: filepath,
		eventType: eventType,
		ignore: false
	};
	if($tw.hooks) {
		eventInfo = $tw.hooks.invokeHook("th-filesystem-watcher-event",eventInfo) || eventInfo;
	}
	if(eventInfo === false || eventInfo.ignore) {
		return;
	}
	filepath = eventInfo.filepath;
	eventType = eventInfo.eventType;
	if(this.isPathIgnored(store,filepath)) {
		return;
	}
	if(this.isSelfWriteEvent(filepath,eventType)) {
		return;
	}
	// A .meta change should trigger re-read of its companion file
	var targetPath = path.resolve(filepath);
	if(/\.meta$/.test(filepath)) {
		targetPath = path.resolve(filepath.replace(/\.meta$/,""));
	}
	// Coalesce body and companion metadata notifications, as well as
	// unlink/add pairs emitted for atomic replacement of the same file.
	var key = targetPath;
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
	var self = this,
		previousTitles = this.getTitlesForFilepath(filepath);
	// Deletion: look up any titles that mapped to this filepath and queue deletion.
	// Do NOT call wiki.deleteTiddler here — the syncer's SyncFromServerTask does that.
	// Test actual existence after the debounce delay. Editors and git commonly
	// replace files with an unlink/rename followed by an add.
	if(!fs.existsSync(filepath)) {
		previousTitles.forEach(function(title) {
			self.removeTiddlerFileInfo(title);
			self.deletions[title] = true;
			delete self.modifications[title];
			self.notifyWatcherChange("delete",store,filepath,title);
		});
		if(previousTitles.length > 0) {
			this.logger.log("Dynamic store: detected removal of " + previousTitles.length + " tiddler(s) at " + filepath);
		}
		return;
	}
	// Add/change: re-parse the file and queue modifications
	var loaded;
	try {
		// If a companion .meta file was removed, retain only the identity of the
		// previously mapped tiddler. All other removed metadata fields should
		// disappear when the tiddler is reloaded.
		var fallbackFields = !store.isTiddlerFile && previousTitles.length === 1 ? {title: previousTitles[0]} : null;
		loaded = this.loadDynamicStoreFile(store,filepath,fallbackFields);
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
		newTitles[fields.title] = true;
		if(fields.type === "application/javascript" && fields["module-type"]) {
			self.logger.log("Skipping hot-reload of JS module tiddler " + fields.title + " (requires a restart)");
			return;
		}
		var originalTitle = fields.title,
			currentTiddler = self.wiki.getTiddler(originalTitle),
			updateInfo = {
				adaptor: self,
				store: store,
				filepath: filepath,
				eventType: eventType,
				fields: fields,
				currentTiddler: currentTiddler,
				ignore: false
			};
		if($tw.hooks) {
			updateInfo = $tw.hooks.invokeHook("th-filesystem-watcher-tiddler",updateInfo) || updateInfo;
		}
		if(updateInfo === false || updateInfo.ignore) {
			return;
		}
		fields = updateInfo.fields;
		var title = fields.title;
		if(title !== originalTitle) {
			delete newTitles[originalTitle];
		}
		newTitles[title] = true;
		currentTiddler = self.wiki.getTiddler(title);
		var operation = currentTiddler ? "change" : "add";
		// Ensure boot.files tracks the file so loadTiddler can find it on demand
		self.setTiddlerFileInfo(title,{
			filepath: loaded.filepath,
			type: loaded.type,
			hasMetaFile: loaded.hasMetaFile,
			isEditableFile: true,
			dynamicStoreId: store.id
		});
		// Diff against the current wiki tiddler to suppress self-write echoes
		if(currentTiddler && self.tiddlerFieldsEqual(currentTiddler.fields,fields)) {
			return;
		}
		self.modifications[title] = true;
		delete self.deletions[title];
		self.notifyWatcherChange(operation,store,filepath,title,fields);
	});
	// Handle tiddlers that were previously in this file but have now disappeared
	previousTitles.forEach(function(title) {
		if(!newTitles[title]) {
			self.removeTiddlerFileInfo(title);
			self.deletions[title] = true;
			delete self.modifications[title];
			self.notifyWatcherChange("delete",store,filepath,title);
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
