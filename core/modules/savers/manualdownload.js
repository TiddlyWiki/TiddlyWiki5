/*\
title: $:/core/modules/savers/manualdownload.js
type: application/javascript
module-type: saver
\*/

"use strict";

// Title of the tiddler containing the download message
var downloadInstructionsTitle = "$:/language/Modals/Download";

var ManualDownloadSaver = function(wiki) {
};

ManualDownloadSaver.prototype.save = function(text,method,callback) {
	$tw.modal.display(downloadInstructionsTitle,{
		downloadLink: "data:text/html," + encodeURIComponent(text)
	});
	// Callback that we succeeded
	callback(null);
	return true;
};

ManualDownloadSaver.prototype.info = {
	name: "manualdownload",
	priority: 0,
	capabilities: ["save", "download"]
};

exports.canSave = function(wiki) {
	return true;
};

exports.create = function(wiki) {
	return new ManualDownloadSaver(wiki);
};
