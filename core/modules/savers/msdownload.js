/*\
title: $:/core/modules/savers/msdownload.js
type: application/javascript
module-type: saver

Handles saving changes via window.navigator.msSaveBlob()

\*/

"use strict";

/*
Select the appropriate saver module and set it up
*/
const MsDownloadSaver = function(wiki) {};

MsDownloadSaver.prototype.save = function(text,method,callback) {
	// Get the current filename
	let filename = "tiddlywiki.html";
	const p = document.location.pathname.lastIndexOf("/");
	if(p !== -1) {
		filename = document.location.pathname.substr(p + 1);
	}
	// Set up the link
	const blob = new Blob([text],{type: "text/html"});
	window.navigator.msSaveBlob(blob,filename);
	// Callback that we succeeded
	callback(null);
	return true;
};

/*
Information about this saver
*/
MsDownloadSaver.prototype.info = {
	name: "msdownload",
	priority: 110,
	capabilities: ["save","download"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return !!window.navigator.msSaveBlob;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new MsDownloadSaver(wiki);
};
