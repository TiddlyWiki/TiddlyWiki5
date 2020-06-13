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
	return {};
};

/*
Return a fileInfo object for a tiddler, creating it if necessary:
  filepath: the absolute path to the file containing the tiddler
  type: the type of the tiddler file (NOT the type of the tiddler -- see below)
  hasMetaFile: true if the file also has a companion .meta file

The boot process populates this.boot.files for each of the tiddler files that it loads. The type is found by looking up the extension in $tw.config.fileExtensionInfo (eg "application/x-tiddler" for ".tid" files).

It is the responsibility of the filesystem adaptor to update this.boot.files for new files that are created.
*/
FileSystemAdaptor.prototype.getTiddlerFileInfo = function(tiddler,callback) {
	// See if we've already got information about this file
	var title = tiddler.fields.title,
		fileInfo = this.boot.files[title];
	if(!fileInfo) {
		// Otherwise, we'll need to generate it
		fileInfo = $tw.utils.generateTiddlerFileInfo(tiddler,{
			directory: this.boot.wikiTiddlersPath,
			pathFilters: this.wiki.getTiddlerText("$:/config/FileSystemPaths","").split("\n"),
			wiki: this.wiki
		});
		this.boot.files[title] = fileInfo;
	}
	callback(null,fileInfo);
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
		$tw.utils.saveTiddlerToFile(tiddler,fileInfo,callback);
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
		// Delete the file
		fs.unlink(fileInfo.filepath,function(err) {
			if(err) {
				return callback(err);
			}
			// Delete the metafile if present
			if(fileInfo.hasMetaFile) {
				fs.unlink(fileInfo.filepath + ".meta",function(err) {
					if(err) {
						return callback(err);
					}
					return $tw.utils.deleteEmptyDirs(path.dirname(fileInfo.filepath),callback);
				});
			} else {
				return $tw.utils.deleteEmptyDirs(path.dirname(fileInfo.filepath),callback);
			}
		});
	} else {
		callback(null);
	}
};

if(fs) {
	exports.adaptorClass = FileSystemAdaptor;
}

})();
