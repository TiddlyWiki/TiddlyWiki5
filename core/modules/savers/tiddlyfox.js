/*\
title: $:/core/modules/savers/tiddlyfox.js
type: application/javascript
module-type: saver

Handles saving changes via the TiddlyFox file extension

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false, netscape: false, Components: false */
"use strict";

var TiddlyFoxSaver = function(wiki) {
};

TiddlyFoxSaver.prototype.save = function(text,method,callback) {
	var messageBox = document.getElementById("tiddlyfox-message-box");
	if(messageBox) {
		// Get the pathname of this document
		var pathname = document.location.toString().split("#")[0];
		// Replace file://localhost/ with file:///
		if(pathname.indexOf("file://localhost/") == 0) {
			pathname = "file://" + pathname.substr(16);
		}
		// Windows path file:///x:/blah/blah --> x:\blah\blah
		if(/^file\:\/\/\/[A-Z]\:\//i.test(pathname)) {
			// Remove the leading slash and convert slashes to backslashes
			pathname = pathname.substr(8).replace(/\//g,"\\");
		// Firefox Windows network path file://///server/share/blah/blah --> //server/share/blah/blah
		} else if(pathname.indexOf("file://///") === 0) {
			pathname = "\\\\" + unescape(pathname.substr(10)).replace(/\//g,"\\");
		// Mac/Unix local path file:///path/path --> /path/path
		} else if(pathname.indexOf("file:///") == 0) {
			pathname = unescape(pathname.substr(7));
		// Mac/Unix local path file:/path/path --> /path/path
		} else if(pathname.indexOf("file:/") == 0) {
			pathname = unescape(pathname.substr(5));
		// Otherwise Windows networth path file://server/share/path/path --> \\server\share\path\path
		} else {
			pathname = "\\\\" + unescape(pathname.substr(7)).replace(new RegExp("/","g"),"\\");
		}
		// Create the message element and put it in the message box
		var message = document.createElement("div");
		message.setAttribute("data-tiddlyfox-path",decodeURIComponent(pathname));
		message.setAttribute("data-tiddlyfox-content",text);
		messageBox.appendChild(message);
		// Add an event handler for when the file has been saved
		message.addEventListener("tiddlyfox-have-saved-file",function(event) {
			callback(null);
		}, false);
		// Create and dispatch the custom event to the extension
		var event = document.createEvent("Events");
		event.initEvent("tiddlyfox-save-file",true,false);
		message.dispatchEvent(event);
		return true;
	} else {
		return false;
	}
};

/*
Information about this saver
*/
TiddlyFoxSaver.prototype.info = {
	name: "tiddlyfox",
	priority: 1500,
	capabilities: ["save", "autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return (window.location.protocol === "file:");
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new TiddlyFoxSaver(wiki);
};

})();
