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

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
FileSystemAdaptor.prototype.saveTiddler = function(tiddler,callback) {
var filepathInfo = $tw.boot.files[tiddler.fields.title],
	filepath = filepathInfo ? $tw.boot.files[tiddler.fields.title].filepath : undefined;
console.log("FileSystem: Saving",filepath,tiddler.fields);
	callback(null,{},0);
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
