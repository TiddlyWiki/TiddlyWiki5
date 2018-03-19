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
		var result = {
			title: getTextContent(noteNode,"title"),
			type: "text/html",
			tags: [],
			text: getTextContent(noteNode,"content"),
			modified: convertDate(getTextContent(noteNode,"created")),
			created:  convertDate(getTextContent(noteNode,"created"))

		};
		$tw.utils.each(noteNode.querySelectorAll("tag"),function(tagNode) {
			result.tags.push(tagNode.textContent);
		});
		// If there's an update date, set modifiy date accordingly
		var update = getTextContent(noteNode,"updated");
		if(update) {
			result.modified = convertDate(update);
		}
		$tw.utils.each(noteNode.querySelectorAll("note-attributes>*"),function(attrNode) {
			result[attrNode.tagName] = attrNode.textContent;
		});
		results.push(result);
		$tw.utils.each(noteNode.querySelectorAll("resource"),function(resourceNode) {
			results.push({
				title: getTextContent(resourceNode,"resource-attributes>file-name"),
				type: getTextContent(resourceNode,"mime"),
				width: getTextContent(resourceNode,"width"),
				height: getTextContent(resourceNode,"height"),
				text: getTextContent(resourceNode,"data")
			});
		});
	});
	// Return the output tiddlers
	return results;
};

function getTextContent(node,selector) {
	return (node.querySelector(selector) || {}).textContent;
}

function convertDate(isoDate) {
	return (isoDate || "").replace("T","").replace("Z","") + "000"
}

})();
