/*\
title: $:/core/modules/savers/nodewebkit.js
type: application/javascript
module-type: saver

Handles saving changes in the node-webkit environment. Not required by TiddlyDesktop, which re-uses the TiddlyFox saver, but useful if you're embedding a single TiddlyWiki document into a node-webkit app.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false, netscape: false, Components: false */
"use strict";

var NodeWebKitSaver = function(wiki) {
};

NodeWebKitSaver.prototype.save = function(text,method,callback) {
	// Bail out unless this is a save (rather than a download)
	if(method !== "save") {
		return false;
	}
	// Get the pathname of this document
	var pathname = document.location.pathname;
	// Test for a Windows path of the form /x:/blah/blah
	if(/^\/[A-Z]\:\//i.test(pathname)) {
		// Remove the leading slash
		pathname = pathname.substr(1);
		// Convert slashes to backslashes
		pathname = pathname.replace(/\//g,"\\");
	}
	// Try to save
	var fs = require("fs");
	fs.writeFile(pathname,text,callback);
	return true;
};

/*
Information about this saver
*/
NodeWebKitSaver.prototype.info = {
	name: "nodewebkit",
	priority: 1700
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	// Check if we're running under node-webkit
	return (typeof process == "object");
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new NodeWebKitSaver(wiki);
};

})();
