/*\
title: $:/core/modules/savers/fsosaver.js
type: application/javascript
module-type: saver

Handles saving changes via MS FileSystemObject ActiveXObject

Note: Since TiddlyWiki's markup contains the MOTW, the FileSystemObject normally won't be available. 
However, if the wiki is loaded as an .HTA file (Windows HTML Applications) then the FSO can be used.

\*/

"use strict";

/*
Select the appropriate saver module and set it up
*/
var FSOSaver = function(wiki) {
};

FSOSaver.prototype.save = function(text,method,callback) {
	// Get the pathname of this document
	var pathname = unescape(document.location.pathname);
	// Test for a Windows path of the form /x:\blah...
	if(/^\/[A-Z]\:\\[^\\]+/i.test(pathname)) {	// ie: ^/[a-z]:/[^/]+
		// Remove the leading slash
		pathname = pathname.substr(1);
	} else if(document.location.hostname !== "" && /^\/\\[^\\]+\\[^\\]+/i.test(pathname)) {	// test for \\server\share\blah... - ^/[^/]+/[^/]+
		// Remove the leading slash
		pathname = pathname.substr(1);
		// reconstruct UNC path
		pathname = "\\\\" + document.location.hostname + pathname;
	} else {
		return false;
	}
	// Save the file (as UTF-16)
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var file = fso.OpenTextFile(pathname,2,-1,-1);
	file.Write(text);
	file.Close();
	// Callback that we succeeded
	callback(null);
	return true;
};

/*
Information about this saver
*/
FSOSaver.prototype.info = {
	name: "FSOSaver",
	priority: 120,
	capabilities: ["save", "autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	try {
		return (window.location.protocol === "file:") && !!(new ActiveXObject("Scripting.FileSystemObject"));
	} catch(e) { return false; }
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new FSOSaver(wiki);
};
