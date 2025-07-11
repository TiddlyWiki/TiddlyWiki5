/*\
title: $:/plugins/tiddlywiki/savetrail/savetrail.js
type: application/javascript
module-type: startup

A startup module to download every changed tiddler as a JSON file

\*/

"use strict";

// Export name and synchronous status
exports.name = "savetrail";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Favicon tiddler
const ENABLE_TIDDLER_TITLE = "$:/config/SaveTrailPlugin/enable";
const ENABLE_DRAFTS_TIDDLER_TITLE = "$:/config/SaveTrailPlugin/enable-drafts";
const SYNC_DRAFTS_FILTER_TIDDLER_TITLE = "$:/config/SaveTrailPlugin/sync-drafts-filter";

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
	$tw.hooks.addHook("th-saving-tiddler",(tiddler) => {
		if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
			const oldTiddler = $tw.wiki.getTiddler(tiddler.fields.title);
			if(oldTiddler) {
				saveTiddlerFile(oldTiddler,{reason: "overwritten"});
			}
			saveTiddlerFile(tiddler,{reason: "saved"});
		}
		return tiddler;
	});
	$tw.hooks.addHook("th-renaming-tiddler",(newTiddler,oldTiddler) => {
		if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
			if(oldTiddler) {
				saveTiddlerFile(oldTiddler,{reason: "deleted"});
			}
			saveTiddlerFile(newTiddler,{reason: "renamed"});
		}
		return newTiddler;
	});
	$tw.hooks.addHook("th-relinking-tiddler",(newTiddler,oldTiddler) => {
		if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
			if(oldTiddler) {
				saveTiddlerFile(oldTiddler,{reason: "overwritten"});
			}
			saveTiddlerFile(newTiddler,{reason: "relinked"});
		}
		return newTiddler;
	});
	$tw.hooks.addHook("th-importing-tiddler",(tiddler) => {
		if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
			const oldTiddler = $tw.wiki.getTiddler(tiddler.fields.title);
			if(oldTiddler) {
				saveTiddlerFile(oldTiddler,{reason: "overwritten"});
			}
			saveTiddlerFile(tiddler,{reason: "imported"});
		}
		return tiddler;
	});
	$tw.hooks.addHook("th-deleting-tiddler",(tiddler) => {
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
SaveTrailSyncAdaptor.prototype.saveTiddler = function(tiddler,callback) {
	if($tw.wiki.checkTiddlerText(ENABLE_TIDDLER_TITLE,"yes")) {
		const isDraft = $tw.utils.hop(tiddler.fields,"draft.of");
		if(!isDraft || $tw.wiki.checkTiddlerText(ENABLE_DRAFTS_TIDDLER_TITLE,"yes")) {
			saveTiddlerFile(tiddler,{reason: "modified"});
		}
	}
	callback(null,null);
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)
*/
SaveTrailSyncAdaptor.prototype.loadTiddler = function(title,callback) {
	callback(null,null);
};

/*
Delete a tiddler and invoke the callback with (err)
*/
SaveTrailSyncAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	callback(null,null);
};

function saveTiddlerFile(tiddler,options) {
	options = options || {};
	const reason = options.reason || "changed";
	const illegalFilenameCharacters = /<|>|\:|\"|\/|\\|\||\?|\*|\^|\s/g;
	const fixedTitle = $tw.utils.transliterate(tiddler.fields.title).replace(illegalFilenameCharacters,"_");
	const formattedDate = $tw.utils.stringifyDate(new Date());
	const filename = `${fixedTitle}.${formattedDate}.${reason}.json`;
	const fields = new Object();
	for(const field in tiddler.fields) {
		fields[field] = tiddler.getFieldString(field);
	}
	const text = JSON.stringify([fields],null,$tw.config.preferences.jsonSpaces);
	const link = document.createElement("a");
	link.setAttribute("target","_blank");
	link.setAttribute("rel","noopener noreferrer");
	if(Blob !== undefined) {
		const blob = new Blob([text],{type: "text/plain"});
		link.setAttribute("href",URL.createObjectURL(blob));
	} else {
		link.setAttribute("href",`data:text/plain,${encodeURIComponent(text)}`);
	}
	link.setAttribute("download",filename);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
