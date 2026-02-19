/*\
title: $:/core/modules/savers/fsosaver.js
type: application/javascript
module-type: saver
\*/

"use strict";

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

	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var file = fso.OpenTextFile(pathname,2,-1,-1);
	file.Write(text);
	file.Close();
	// Callback that we succeeded
	callback(null);
	return true;
};

FSOSaver.prototype.info = {
	name: "FSOSaver",
	priority: 120,
	capabilities: ["save", "autosave"]
};

exports.canSave = function(wiki) {
	try {
		return (window.location.protocol === "file:") && !!(new ActiveXObject("Scripting.FileSystemObject"));
	} catch(e) { return false; }
};

exports.create = function(wiki) {
	return new FSOSaver(wiki);
};
