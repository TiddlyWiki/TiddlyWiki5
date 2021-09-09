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

FileSystemAdaptor.prototype.setLoggerSaveBuffer = function(loggerForSaving) {
	this.logger.setSaveBuffer(loggerForSaving);
};

/*
Show a filesystem errorlog alert
*/
FileSystemAdaptor.prototype.displayError = function(msg,err) {
	// Check if there is an existing alert with the same title
	var self = this,
		alertTitle = "_filesytem/errors/alert",
		logTitle = "_filesytem/errors/log",
		alertTid = this.wiki.getTiddler(alertTitle),
		alertFields = alertTid? $tw.utils.extend({},alertTid.fields): null,
		existingCount,
		text = "<span style='float:left;margin:2pt 4pt 8pt 4pt'>{{$:/core/images/warning}}</span> " + msg + "; " + err.toString();
	this.logger.log(Array.prototype.join.call([$tw.language.getString("Error/WhileSaving") + ":",msg + ":",err.toString()]," "));
	if(alertFields) {
		alertFields.text = Array.prototype.join.call([alertFields.text,text],"\n\n")
		existingCount = alertFields.count || 1;
	} else {
		alertFields = {
			title: alertTitle,
			text: Array.prototype.join.call([$tw.language.getString("Error/WhileSaving") + ":",text],"\n\n"),
			tags: ["$:/tags/Alert"],
			component: this.logger.componentName
		};
		existingCount = 0;
	}
	alertFields.modified = new Date();
	if(++existingCount > 1) {
		alertFields.count = existingCount;
	} else {
		alertFields.count = undefined;
	}
	this.wiki.addTiddler(new $tw.Tiddler(alertFields));
	// Alerts are deleted when dismissed, save a copy as a log
	this.wiki.addTiddler(new $tw.Tiddler({
		title: logTitle,
		type: "text/plain",
		text: $tw.utils.getSystemInfo() + "\n\nLog:\n" + self.logger.getBuffer(),
		component: this.logger.componentName,
		modified: new Date()
	}));
};

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
	var title = tiddler.fields.title, newInfo, pathFilters, extFilters,
		fileInfo = this.boot.files[title];
	if(this.wiki.tiddlerExists("$:/config/FileSystemPaths")) {
		pathFilters = this.wiki.getTiddlerText("$:/config/FileSystemPaths","").split("\n");
	}
	if(this.wiki.tiddlerExists("$:/config/FileSystemExtensions")) {
		extFilters = this.wiki.getTiddlerText("$:/config/FileSystemExtensions","").split("\n");
	}
	newInfo = $tw.utils.generateTiddlerFileInfo(tiddler,{
		directory: this.boot.wikiTiddlersPath,
		pathFilters: pathFilters,
		extFilters: extFilters,
		wiki: this.wiki,
		fileInfo: fileInfo
	});
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
		$tw.utils.saveTiddlerToFile(tiddler,fileInfo,function(err,fileInfo) {
			if(err) {
				var message = "Save file failed for [["+tiddler.fields.title+"]] at path `"+(options.adaptorInfo.filepath || "undefined")+"`";
				if ((err.code == "EPERM" || err.code == "EACCES") && err.syscall == "open") {
					fileInfo = fileInfo || self.boot.files[tiddler.fields.title];
					fileInfo.writeError = true;
					self.boot.files[tiddler.fields.title] = fileInfo;
					message = message + " and will be retried with an encoded filepath";
				}
				self.displayError(message,err);
				return callback(err);
			}
			self.logger.log("Saved \'"+fileInfo.filepath+"\'");
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
					// Error deleting the previous file on disk, should fail gracefully
					self.displayError("Clean up of previous file failed for [["+options.title+"]] at path `"+(options.adaptorInfo.filepath || "undefined")+"`",err);
				}
				return callback(null,fileInfo);
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
		$tw.utils.deleteTiddlerFile(fileInfo,function(err) {
			if(err) {
				// Error deleting the file on disk, should fail gracefully
				self.displayError("Delete file failed for [[" + title + "]] at path `"+(fileInfo.filepath || "undefined")+"`",err);
			} else {
				self.logger.log("Deleted \'"+fileInfo.filepath+"\'");
			}
			// Remove the tiddler from self.boot.files & return null adaptorInfo
			delete self.boot.files[title];
			return callback(null,null);
		});
	} else {
		callback(null,null);
	}
};

if(fs) {
	exports.adaptorClass = FileSystemAdaptor;
}

})();
