/*\
title: $:/core/modules/savers/manualdownload.js
type: application/javascript
module-type: saver

Handles saving changes via HTML5's download APIs

\*/

"use strict";

// Title of the tiddler containing the download message
var downloadInstructionsTitle = "$:/language/Modals/Download";

/*
Select the appropriate saver module and set it up
*/
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

/*
Information about this saver
*/
ManualDownloadSaver.prototype.info = {
	name: "manualdownload",
	priority: 0,
	capabilities: ["save", "download"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return true;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new ManualDownloadSaver(wiki);
};
