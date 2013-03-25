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
var fs = !$tw.browser ? require("fs") : null;

function FileSystemAdaptor(syncer) {
	this.syncer = syncer;
}

FileSystemAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	return {};
};

$tw.config.typeInfo = {
	"text/vnd.tiddlywiki": {
		fileType: "application/x-tiddler",
		extension: ".tid",
		template: "$:/core/templates/tid-tiddler"
	},
	"image/jpeg" : {
		fileType: "application/x-tiddler-binary",
		hasMetaFile: true
	}
};

$tw.config.typeTemplates = {
	"application/x-tiddler": "$:/core/templates/tid-tiddler"
};

FileSystemAdaptor.prototype.getTiddlerFileInfo = function(tiddler,callback) {
	// See if we've already got information about this file
	var self = this,
		title = tiddler.fields.title,
		fileInfo = $tw.boot.files[title];
	if(!fileInfo) {
		// If not, we'll need to generate it
		// Start by getting a list of the existing files in the directory
		fs.readdir($tw.boot.wikiTiddlersPath,function(err,files) {
			if(err) {
				return callback(err);
			}
			// Get information about how to save tiddlers of this type
			var type = tiddler.fields.type || "text/vnd.tiddlywiki",
				typeInfo = $tw.config.typeInfo[type];
			if(!typeInfo) {
				typeInfo = $tw.config.typeInfo["text/vnd.tiddlywiki"];
			}
			var extension = typeInfo.extension || "";
			// Assemble the new fileInfo
			fileInfo = {};
			fileInfo.filepath = $tw.boot.wikiTiddlersPath + "/" + self.generateTiddlerFilename(title,extension,files);
			fileInfo.type = typeInfo.fileType;
			fileInfo.hasMetaFile = typeInfo.hasMetaFile;
			// Save the newly created fileInfo
			$tw.boot.files[title] = fileInfo;
			// Pass it to the callback
			callback(null,fileInfo);
		});
	} else {
		// Otherwise just invoke the callback
		callback(null,fileInfo);
	}
};

/*
Given a tiddler title and an array of existing filenames, generate a new legal filename for the title, case insensitively avoiding the array of existing filenames
*/
FileSystemAdaptor.prototype.generateTiddlerFilename = function(title,extension,existingFilenames) {
	// First remove any of the characters that are illegal in Windows filenames
	var baseFilename = title.replace(/\<|\>|\:|\"|\/|\\|\||\?|\*|\^/g,"_");
	// Truncate the filename if it is too long
	if(baseFilename.length > 200) {
		baseFilename = baseFilename.substr(0,200) + extension;
	}
	// Start with the base filename plus the extension
	var filename = baseFilename + extension,
		count = 1;
	// Add a discriminator if we're clashing with an existing filename
	while(existingFilenames.indexOf(filename) !== -1) {
		filename = baseFilename + " " + (count++) + extension;
	}
	return filename;
};

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
FileSystemAdaptor.prototype.saveTiddler = function(tiddler,callback) {
	this.getTiddlerFileInfo(tiddler,function(err,fileInfo) {
		if(err) {
			return callback(err);
		}
		var template = $tw.config.typeTemplates[fileInfo.type];
console.log(fileInfo,template)
		var content = $tw.wiki.renderTiddler("text/plain",template,{tiddlerTitle: tiddler.fields.title});
		fs.writeFile(fileInfo.filepath,content,{encoding: "utf8"},function (err) {
			if(err) {
				return callback(err);
			}
console.log("FileSystem: Saved file",fileInfo.filepath);
			callback(null,{},0);
		});
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)
*/
FileSystemAdaptor.prototype.loadTiddler = function(title,callback) {
console.log("FileSystem: Loading",title);
	callback(null,{title: title, text: "Fake tiddler: " + title});
};

/*
Delete a tiddler and invoke the callback with (err)
*/
FileSystemAdaptor.prototype.deleteTiddler = function(title,callback) {
console.log("FileSystem: Deleting",title);
	callback(null);
};

if(fs) {
	exports.adaptorClass = FileSystemAdaptor;
}

})();
