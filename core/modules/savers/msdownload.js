/*\
title: $:/core/modules/savers/msdownload.js
type: application/javascript
module-type: saver
\*/

"use strict";

var MsDownloadSaver = function(wiki) {
};

MsDownloadSaver.prototype.save = function(text,method,callback) {
	// Get the current filename
	var filename = "tiddlywiki.html",
		p = document.location.pathname.lastIndexOf("/");
	if(p !== -1) {
		filename = document.location.pathname.substr(p+1);
	}

	var blob = new Blob([text], {type: "text/html"});
	window.navigator.msSaveBlob(blob,filename);
	// Callback that we succeeded
	callback(null);
	return true;
};

MsDownloadSaver.prototype.info = {
	name: "msdownload",
	priority: 110,
	capabilities: ["save", "download"]
};

exports.canSave = function(wiki) {
	return !!window.navigator.msSaveBlob;
};

exports.create = function(wiki) {
	return new MsDownloadSaver(wiki);
};
