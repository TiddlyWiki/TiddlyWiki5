/*\
title: $:/plugins/tiddlywiki/filesystem/filesystemadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with the local filesystem via node.js APIs

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Get a reference to the file system
var fs = $tw.node ? require("fs") : null,
	path = $tw.node ? require("path") : null;

function FileSystemAdaptor(options) {
	var self = this;
	this.wiki = options.wiki;
	this.boot = options.boot || $tw.boot;
	this.logger = new $tw.utils.Logger("filesystem",{colour: "blue"});
	// Create the <wiki>/tiddlers folder if it doesn't exist
	$tw.utils.createDirectory(this.boot.wikiTiddlersPath);
}

FileSystemAdaptor.prototype.name = "filesystem";

FileSystemAdaptor.prototype.supportsLazyLoading = false;

FileSystemAdaptor.prototype.isReady = function() {
	// The file system adaptor is always ready
	return true;
};

FileSystemAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	//Returns the existing fileInfo for the tiddler. To regenerate, call getTiddlerFileInfo().
	var title = tiddler.fields.title;
	return this.boot.files[title];
};

/*
Return a fileInfo object for a tiddler, creating it if necessary:
  filepath: the absolute path to the file containing the tiddler
  type: the type of the tiddler file (NOT the type of the tiddler -- see below)
  hasMetaFile: true if the file also has a companion .meta file

The boot process populates this.boot.files for each of the tiddler files that it loads.
The type is found by looking up the extension in $tw.config.fileExtensionInfo (eg "application/x-tiddler" for ".tid" files).

It is the responsibility of the filesystem adaptor to update this.boot.files for new files that are created.
*/
FileSystemAdaptor.prototype.getTiddlerFileInfo = function(tiddler,callback) {
	// Always generate a fileInfo object when this fuction is called
	var title = tiddler.fields.title, newInfo, pathFilters, extFilters;
	if(this.wiki.tiddlerExists("$:/config/FileSystemPaths")){
		pathFilters = this.wiki.getTiddlerText("$:/config/FileSystemPaths","").split("\n");
	}
	if(this.wiki.tiddlerExists("$:/config/FileSystemExtensions")){
		extFilters = this.wiki.getTiddlerText("$:/config/FileSystemExtensions","").split("\n");
	}
	newInfo = $tw.utils.generateTiddlerFileInfo(tiddler,{
		directory: this.boot.wikiTiddlersPath,
		pathFilters: pathFilters,
		extFilters: extFilters,
		wiki: this.wiki,
		fileInfo: this.boot.files[title],
		originalpath: this.wiki.extractTiddlerDataItem("$:/config/OriginalTiddlerPaths",title, "")
	});
	this.boot.files[title] = newInfo;
	callback(null,newInfo);
};


/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
FileSystemAdaptor.prototype.saveTiddler = function(tiddler,callback) {
	var self = this;
	this.getTiddlerFileInfo(tiddler,function(err,fileInfo) {
		if(err) {
			return callback(err);
		}
		$tw.utils.saveTiddlerToFile(tiddler,fileInfo,function(err) {
			if(err) {
				if ((err.code == "EPERM" || err.code == "EACCES") && err.syscall == "open") {
					var bootInfo = self.boot.files[tiddler.fields.title];
					bootInfo.writeError = true;
					self.boot.files[tiddler.fields.title] = bootInfo;
					$tw.syncer.displayError("Sync for tiddler [["+tiddler.fields.title+"]] will be retried with encoded filepath", encodeURIComponent(bootInfo.filepath));
					return callback(err);
				} else {
					return callback(err);
				}
			}
			// Cleanup duplicates if the file moved or changed extensions
			var options = {
				adaptorInfo: ($tw.syncer.tiddlerInfo[tiddler.fields.title] || {adaptorInfo: {} }).adaptorInfo,
				bootInfo: self.boot.files[tiddler.fields.title] || {},
				title: tiddler.fields.title
			};
			$tw.utils.cleanupTiddlerFiles(options, function(err){
				if(err) {
					return callback(err);
				}
				return callback(null, self.boot.files[tiddler.fields.title]);
			});
		});
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)

We don't need to implement loading for the file system adaptor, because all the tiddler files will have been loaded during the boot process.
*/
FileSystemAdaptor.prototype.loadTiddler = function(title,callback) {
	callback(null,null);
};

/*
Delete a tiddler and invoke the callback with (err)
*/
FileSystemAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	var self = this,
		fileInfo = this.boot.files[title];
	// Only delete the tiddler if we have writable information for the file
	if(fileInfo) {
		$tw.utils.deleteTiddlerFile(fileInfo, function(err){
			if(err) {
				if ((err.code == "EPERM" || err.code == "EACCES") && err.syscall == "unlink") {
					// Error deleting the file on disk, should fail gracefully
					$tw.syncer.displayError("Server desynchronized. Error deleting file for deleted tiddler: "+title, err);
					return callback(null);
				} else {
					return callback(err);
				}
			}
			return callback(null);
		});
	} else {
		callback(null);
	}
};

if(fs) {
	exports.adaptorClass = FileSystemAdaptor;
}

})();
