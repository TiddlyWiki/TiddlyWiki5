/*\
title: $:/plugins/tiddlywiki/savetrail/savetrail.js
type: application/javascript
module-type: startup

A startup module to download every changed tiddler as a JSON file

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "savetrail";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Favicon tiddler
var SAVE_FILTER_TIDDLER_TITLE = "$:/config/SaveTrailPlugin/save-filter",
	ENABLE_TIDDLER_TITLE = "$:/config/SaveTrailPlugin/enable",
	ENABLE_DRAFTS_TIDDLER_TITLE = "$:/config/SaveTrailPlugin/enable-drafts";

exports.startup = function() {
	$tw.savetrail = $tw.savetrail || {};
	$tw.savetrail.syncadaptor = new SaveTrailSyncAdaptor();
	$tw.savetrail.syncer = new $tw.Syncer({
		wiki: $tw.wiki,
		syncadaptor: $tw.savetrail.syncadaptor,
		titleSyncFilter: SAVE_FILTER_TIDDLER_TITLE,
		logging: false
	});
};

function SaveTrailSyncAdaptor(options) {
	this.logger = new $tw.utils.Logger("SaveTrail");
}

SaveTrailSyncAdaptor.prototype.name = "savetrail";

SaveTrailSyncAdaptor.prototype.isReady = function() {
	// The savetrail adaptor is always ready
	return true;
};

SaveTrailSyncAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	return {};
};

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
SaveTrailSyncAdaptor.prototype.saveTiddler = function(tiddler,callback) {
	if($tw.wiki.getTiddlerText(ENABLE_TIDDLER_TITLE).toLowerCase() === "yes") {
		var isDraft = $tw.utils.hop(tiddler.fields,"draft.of");
		if(!isDraft || $tw.wiki.getTiddlerText(ENABLE_DRAFTS_TIDDLER_TITLE).toLowerCase() === "yes") {
			saveTiddlerFile(tiddler);
		}
	}
	callback(null);
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)

We don't need to implement loading for the file system adaptor, because all the tiddler files will have been loaded during the boot process.
*/
SaveTrailSyncAdaptor.prototype.loadTiddler = function(title,callback) {
	callback(null,null);
};

/*
Delete a tiddler and invoke the callback with (err)
*/
SaveTrailSyncAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	callback(null);
};

function saveTiddlerFile(tiddler) {
	var illegalFilenameCharacters = /<|>|\:|\"|\/|\\|\||\?|\*|\^|\s/g,
		fixedTitle = tiddler.fields.title.replace(illegalFilenameCharacters,"_"),
		formattedDate = $tw.utils.stringifyDate(new Date()),
		filename =  fixedTitle + "." + formattedDate + ".json",
		fields = new Object();
	for(var field in tiddler.fields) {
		fields[field] = tiddler.getFieldString(field);
	}
	var text = JSON.stringify([fields],null,$tw.config.preferences.jsonSpaces),
		link = document.createElement("a");
	link.setAttribute("target","_blank");
	link.setAttribute("rel","noopener noreferrer");
	if(Blob !== undefined) {
		var blob = new Blob([text], {type: "text/plain"});
		link.setAttribute("href", URL.createObjectURL(blob));
	} else {
		link.setAttribute("href","data:text/plain," + encodeURIComponent(text));
	}
	link.setAttribute("download",filename);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

})();
