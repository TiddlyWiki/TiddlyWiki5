/*\
title: $:/core/modules/savers/twedit.js
type: application/javascript
module-type: saver

Handles saving changes via the TWEdit iOS app

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false, netscape: false, Components: false */
"use strict";

var TWEditSaver = function(wiki) {
};

TWEditSaver.prototype.save = function(text,method,callback) {
	// Bail if we're not running under TWEdit
	if(typeof DeviceInfo !== "object") {
		return false;
	}
	// Get the pathname of this document
	var pathname = decodeURIComponent(document.location.pathname);
	// Strip any query or location part
	var p = pathname.indexOf("?");
	if(p !== -1) {
		pathname = pathname.substr(0,p);
	}
	p = pathname.indexOf("#");
	if(p !== -1) {
		pathname = pathname.substr(0,p);
	}
	// Remove the leading "/Documents" from path
	var prefix = "/Documents";
	if(pathname.indexOf(prefix) === 0) {
		pathname = pathname.substr(prefix.length);
	}
	// Error handler
	var errorHandler = function(event) {
    	// Error
    	callback("Error saving to TWEdit: " + event.target.error.code);
    };
	// Get the file system
    window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fileSystem) {
    	// Now we've got the filesystem, get the fileEntry
        fileSystem.root.getFile(pathname, {create: true}, function(fileEntry) {
        	// Now we've got the fileEntry, create the writer
        	fileEntry.createWriter(function(writer) {
		        writer.onerror = errorHandler;
		        writer.onwrite = function() {
		        	callback(null);
		        };
		        writer.position = 0;
		        writer.write(text);
        	},errorHandler);
        }, errorHandler);
    }, errorHandler);
    return true;
};

/*
Information about this saver
*/
TWEditSaver.prototype.info = {
	name: "twedit",
	priority: 1600,
	capabilities: ["save", "autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return true;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new TWEditSaver(wiki);
};

/////////////////////////// Hack
// HACK: This ensures that TWEdit recognises us as a TiddlyWiki document
if($tw.browser) {
	window.version = {title: "TiddlyWiki"};
}

})();
