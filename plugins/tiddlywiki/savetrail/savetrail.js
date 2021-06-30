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
var ENABLE_TIDDLER_TITLE = "$:/config/SaveTrailPlugin/enable",
	ENABLE_DRAFTS_TIDDLER_TITLE = "$:/config/SaveTrailPlugin/enable-drafts",
	SYNC_DRAFTS_FILTER_TIDDLER_TITLE = "$:/config/SaveTrailPlugin/sync-drafts-filter";

exports.startup = function() {
	$tw.savetrail = $tw.savetrail || {};
	// Create a syncer to handle autosaving
	$tw.savetrail.syncadaptor = new SaveTrailSyncAdaptor();
	$tw.savetrail.syncer = new $tw.Syncer({
		wiki: $tw.wiki,
		syncadaptor: $tw.savetrail.syncadaptor,
		titleSyncFilter: SYNC_DRAFTS_FILTER_TIDDLER_TITLE,
		logging: false,
		disableUI: true
	});
	// Add hooks for trapping user actions
	$tw.hooks.addHook("th-saving-tiddler",function(tiddler) {
		if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
			var oldTiddler = $tw.wiki.getTiddler(tiddler.fields.title);
			if(oldTiddler) {
				saveTiddlerFile(oldTiddler,{reason: "overwritten"});			
			}
			saveTiddlerFile(tiddler,{reason: "saved"});
		}
		return tiddler;
	});
	$tw.hooks.addHook("th-renaming-tiddler",function(newTiddler,oldTiddler) {
		if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
			if(oldTiddler) {
				saveTiddlerFile(oldTiddler,{reason: "deleted"});			
			}
			saveTiddlerFile(newTiddler,{reason: "renamed"});
		}
		return newTiddler;
	});
	$tw.hooks.addHook("th-relinking-tiddler",function(newTiddler,oldTiddler) {
		if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
			if(oldTiddler) {
				saveTiddlerFile(oldTiddler,{reason: "overwritten"});			
			}
			saveTiddlerFile(newTiddler,{reason: "relinked"});
		}
		return newTiddler;
	});
	$tw.hooks.addHook("th-importing-tiddler",function(tiddler) {
		if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
			var oldTiddler = $tw.wiki.getTiddler(tiddler.fields.title);
			if(oldTiddler) {
				saveTiddlerFile(oldTiddler,{reason: "overwritten"});			
			}
			saveTiddlerFile(tiddler,{reason: "imported"});
		}
		return tiddler;
	});
	$tw.hooks.addHook("th-deleting-tiddler",function(tiddler) {
		if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
			saveTiddlerFile(tiddler,{reason: "deleted"});
		}
		return tiddler;
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
SaveTrailSyncAdaptor.prototype.saveTiddler = function(tiddler,options,callback) {
	// Check for pre v5.2.0 method signature:
	if(typeof callback !== "function" && typeof options === "function"){
		var optionsArg = callback;
		callback = options;
		options = optionsArg;
	}
	options = options || {};
	if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
		var isDraft = $tw.utils.hop(tiddler.fields,"draft.of");
		if(!isDraft || $tw.wiki.checkTiddlerText(ENABLE_DRAFTS_TIDDLER_TITLE,"yes")) {
			saveTiddlerFile(tiddler,{reason: "modified"});
		}
	}
	callback(null,null);
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)
*/
SaveTrailSyncAdaptor.prototype.loadTiddler = function(title,options,callback) {
	// Check for pre v5.2.0 method signature:
	if(typeof callback !== "function" && typeof options === "function"){
		var optionsArg = callback;
		callback = options;
		options = optionsArg;
	}
	options = options || {};
	callback(null,null);
};

/*
Delete a tiddler and invoke the callback with (err)
*/
SaveTrailSyncAdaptor.prototype.deleteTiddler = function(title,options,callback) {
	// Check for pre v5.2.0 method signature:
	if(typeof callback !== "function" && typeof options === "function"){
		var optionsArg = callback;
		callback = options;
		options = optionsArg;
	}
	options = options || {};
	callback(null,null);
};

function saveTiddlerFile(tiddler,options) {
	options = options || {};
	var reason = options.reason || "changed",
		illegalFilenameCharacters = /<|>|\:|\"|\/|\\|\||\?|\*|\^|\s/g,
		fixedTitle = $tw.utils.transliterate(tiddler.fields.title).replace(illegalFilenameCharacters,"_"),
		formattedDate = $tw.utils.stringifyDate(new Date()),
		filename =  fixedTitle + "." + formattedDate + "." + reason + ".json",
		fields = new Object();
	for(var field in tiddler.fields) {
		fields[field] = tiddler.getFieldString(field);
	}
	var text = JSON.stringify([fields],null,$tw.config.preferences.jsonSpaces),
		link = document.createElement("a");
	link.setAttribute("target","_blank");
	link.setAttribute("rel","noopener noreferrer");
	if(Blob !== undefined) {
		var blob = new Blob([text],{type: "text/plain"});
		link.setAttribute("href",URL.createObjectURL(blob));
	} else {
		link.setAttribute("href","data:text/plain," + encodeURIComponent(text));
	}
	link.setAttribute("download",filename);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

})();
