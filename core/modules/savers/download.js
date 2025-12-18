/*\
title: $:/core/modules/savers/download.js
type: application/javascript
module-type: saver

Handles saving changes via HTML5's download APIs

\*/

"use strict";

/*
Select the appropriate saver module and set it up
*/
var DownloadSaver = function(wiki) {
};

DownloadSaver.prototype.save = function(text,method,callback,options) {
	options = options || {};
	// Get the current filename
	var filename = options.variables.filename;
	var type = options.variables.type;
	if(!filename) {
		var p = document.location.pathname.lastIndexOf("/");
		if(p !== -1) {
			// We decode the pathname because document.location is URL encoded by the browser
			filename = $tw.utils.decodeURIComponentSafe(document.location.pathname.substr(p+1));
		}
	}
	if(!filename) {
		filename = "tiddlywiki.html";
	}
	if(!type) {
		type = "text/html";
	}
	// Set up the link
	var link = document.createElement("a");
	// We prefer Blobs if they're available, unless we're dealing with a tiddler type declaring itself full of base64 encoded content.
	// Then we use data urls, because browsers will know to decode the stream and download the actual binary file as intended.
	if(Blob !== undefined && !type.includes(";base64")) {
		var blob = new Blob([text], {type: type});
		link.setAttribute("href", URL.createObjectURL(blob));
	} else {
		link.setAttribute("href","data:" + type + "," + encodeURIComponent(text));
	}
	link.setAttribute("download",filename);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	// Callback that we succeeded
	callback(null);
	return true;
};

/*
Information about this saver
*/
DownloadSaver.prototype.info = {
	name: "download",
	priority: 100
};

Object.defineProperty(DownloadSaver.prototype.info, "capabilities", {
	get: function() {
		var capabilities = ["save", "download"];
		if(($tw.wiki.getTextReference("$:/config/DownloadSaver/AutoSave") || "").toLowerCase() === "yes") {
			capabilities.push("autosave");
		}
		return capabilities;
	}
});

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
