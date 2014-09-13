/*\
title: $:/core/modules/savers/tiddlyie.js
type: application/javascript
module-type: saver

Handles saving changes via Internet Explorer BHO extenion (TiddlyIE)

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Select the appropriate saver module and set it up
*/
var TiddlyIESaver = function(wiki) {
};

TiddlyIESaver.prototype.save = function(text,method,callback) {
	// Check existence of TiddlyIE BHO extension (note: only works after document is complete)
	if(typeof(window.TiddlyIE) != "undefined") {
		// Get the pathname of this document
		var pathname = unescape(document.location.pathname);
		// Test for a Windows path of the form /x:/blah...
		if(/^\/[A-Z]\:\/[^\/]+/i.test(pathname)) {	// ie: ^/[a-z]:/[^/]+ (is this better?: ^/[a-z]:/[^/]+(/[^/]+)*\.[^/]+ )
			// Remove the leading slash
			pathname = pathname.substr(1);
			// Convert slashes to backslashes
			pathname = pathname.replace(/\//g,"\\");
		} else if(document.hostname !== "" && /^\/[^\/]+\/[^\/]+/i.test(pathname)) {	// test for \\server\share\blah... - ^/[^/]+/[^/]+
			// Convert slashes to backslashes
			pathname = pathname.replace(/\//g,"\\");
			// reconstruct UNC path
			pathname = "\\\\" + document.location.hostname + pathname;
		} else return false;
		// Prompt the user to save the file
		window.TiddlyIE.save(pathname, text);
		// Callback that we succeeded
		callback(null);
		return true;
	} else {
		return false;
	}
};

/*
Information about this saver
*/
TiddlyIESaver.prototype.info = {
	name: "tiddlyiesaver",
	priority: 1500,
	capabilities: ["save"]
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
	return new TiddlyIESaver(wiki);
};

})();
