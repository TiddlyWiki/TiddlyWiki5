/*\
title: $:/plugins/tiddlywiki/evernote/modules/enex-deserializer.js
type: application/javascript
module-type: tiddlerdeserializer

ENEX file deserializer

For details see: https://blog.evernote.com/tech/2013/08/08/evernote-export-format-enex/

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// DOMParser = require("$:/plugins/tiddlywiki/xmldom/dom-parser").DOMParser;

/*
Parse an ENEX file into tiddlers
*/
exports["application/enex+xml"] = function(text,fields) {
	// Collect output tiddlers in an array
	var results = [];
	// Parse the XML document
	var parser = new DOMParser(),
		doc = parser.parseFromString(text,"application/xml");
	// Output a report tiddler with information about the import
	var enex = doc.querySelector("en-export");
	results.push({
		title: "Evernote Import Report",
		text: "Evernote file imported on " + enex.getAttribute("export-date") + " from " + enex.getAttribute("application") + " (" + enex.getAttribute("version") + ")"
	})
	// Get all the "note" nodes
	var noteNodes = doc.querySelectorAll("note");
	$tw.utils.each(noteNodes,function(noteNode) {
		results.push({
			title: noteNode.querySelector("title").textContent,
			type: "text/html",
			text: noteNode.querySelector("content").textContent
		});
	});
	// Return the output tiddlers
	return results;
};

})();
