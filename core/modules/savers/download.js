/*\
title: $:/core/modules/savers/download.js
type: application/javascript
module-type: saver

Handles saving changes via HTML5's download APIs

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Select the appropriate saver module and set it up
*/
var DownloadSaver = function(wiki) {
};

DownloadSaver.prototype.save = function(text) {
	// Set up the link
	var link = document.createElement("a");
	link.setAttribute("target","_blank");
	link.setAttribute("href","data:text/html," + encodeURIComponent(text));
	link.setAttribute("download","tiddlywiki.html");
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	return true;
};

/*
Information about this saver
*/
DownloadSaver.prototype.info = {
	name: "download",
	priority: 100
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return document.createElement("a").download !== undefined;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new DownloadSaver(wiki);
};

})();
