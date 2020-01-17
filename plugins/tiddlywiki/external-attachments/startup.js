/*\
title: $:/plugins/tiddlywiki/external-attachments/startup.js
type: application/javascript
module-type: startup

Startup initialisation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ENABLE_EXTERNAL_ATTACHMENTS_TITLE = "$:/config/ExternalAttachments/Enable",
	USE_ABSOLUTE_FOR_DESCENDENTS_TITLE = "$:/config/ExternalAttachments/UseAbsoluteForDescendents",
	USE_ABSOLUTE_FOR_NON_DESCENDENTS_TITLE = "$:/config/ExternalAttachments/UseAbsoluteForNonDescendents";

// Export name and synchronous status
exports.name = "external-attachments";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	test_makePathRelative();
	$tw.hooks.addHook("th-importing-file",function(info) {
		if(document.location.protocol === "file:" && info.isBinary && info.file.path && $tw.wiki.getTiddlerText(ENABLE_EXTERNAL_ATTACHMENTS_TITLE,"") === "yes") {
			var locationPathParts = document.location.pathname.split("/").slice(0,-1),
				filePathParts = info.file.path.split(/[\\\/]/mg).map(encodeURIComponent);
			info.callback([
				{
					title: info.file.name,
					type: info.type,
					"_canonical_uri": makePathRelative(
						filePathParts.join("/"),
						locationPathParts.join("/"),
						{
							useAbsoluteForNonDescendents: $tw.wiki.getTiddlerText(USE_ABSOLUTE_FOR_NON_DESCENDENTS_TITLE,"") === "yes",
							useAbsoluteForDescendents: $tw.wiki.getTiddlerText(USE_ABSOLUTE_FOR_DESCENDENTS_TITLE,"") === "yes"
						}
					)
				}
			]);
			return true;
		} else {
			return false;
		}
	});
};

/*
Given a source absolute path and a root absolute path, returns the source path expressed as a relative path from the root path.
*/
function makePathRelative(sourcepath,rootpath,options) {
	options = options || {};
	var sourceParts = sourcepath.split("/"),
		rootParts = rootpath.split("/"),
		outputParts = [];
	// Check that each path started with a slash
	if(sourceParts[0] || rootParts[0]) {
		throw "makePathRelative: both paths must be absolute";
	}
	// Identify any common portion from the start
	var c = 1,
		p;
	while(c < sourceParts.length && c < rootParts.length && sourceParts[c] === rootParts[c]) {
		c += 1;
	}
	// Return "." if there's nothing left
	if(c === sourceParts.length && c === rootParts.length ) {
		return "."
	}
	// Use an absolute path if required
	if((options.useAbsoluteForNonDescendents && c < rootParts.length) || (options.useAbsoluteForDescendents && c === rootParts.length)) {
		return sourcepath;
	}
	// Move up a directory for each directory left in the root
	for(p = c; p < rootParts.length; p++) {
		outputParts.push("..");
	}		
	// Add on the remaining parts of the source path
	for(p = c; p < sourceParts.length; p++) {
		outputParts.push(sourceParts[p]);
	}
	return outputParts.join("/");
}

function test_makePathRelative() {
	var msg = "makePathRelative test failed";
	if(makePathRelative("/Users/me/something","/Users/you/something") !== "../../me/something") {
		throw msg;
	}
	if(makePathRelative("/Users/me/something","/Users/you/something",{useAbsoluteForNonDescendents: true}) !== "/Users/me/something") {
		throw msg;
	}
	if(makePathRelative("/Users/me/something/else","/Users/me/something") !== "else") {
		throw msg;
	}
	if(makePathRelative("/Users/me/something","/Users/me/something/new") !== "..") {
		throw msg;
	}
	if(makePathRelative("/Users/me/something","/Users/me/something/new",{useAbsoluteForNonDescendents: true}) !== "/Users/me/something") {
		throw msg;
	}
	if(makePathRelative("/Users/me/something","/Users/me/something") !== ".") {
		throw msg;
	}
}

})();
