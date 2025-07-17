/*\
title: $:/plugins/tiddlywiki/browser-storage/util.js
type: application/javascript
module-type: library

Utility methods for browser-storage plugin

\*/

"use strict";

function BrowserStorageUtil(wiki,options) {
	this.options = options || {};
	this.wiki = wiki;
	this.cachedTiddlers = [];
	this.QUOTA_EXCEEDED_ALERT_TITLE = "$:/config/BrowserStorage/QuotaExceededAlert";
	this.DEFAULT_QUOTA_EXCEEDED_ALERT_PREFIX = "Quota exceeded attempting to store `";
	this.DEFAULT_QUOTA_EXCEEDED_ALERT_SUFFIX = "` in browser local storage";
}

BrowserStorageUtil.prototype.isEnabled = function() {
	return $tw.wiki.getTiddlerText(this.options.enabledTitle) === "yes";
};

BrowserStorageUtil.prototype.cachePreloadTiddlers = function() {
	const self = this;
	$tw.utils.each($tw.boot.preloadDirty,(item) => {
		const tiddler = $tw.wiki.getTiddler(item);
		self.cachedTiddlers.push(tiddler);
	});
};

BrowserStorageUtil.prototype.addCachedTiddlers = function() {
	const self = this;
	if(this.cachedTiddlers.length > 0) {
		$tw.utils.each(this.cachedTiddlers,(item) => {
			$tw.wiki.addTiddler(item);
		});
		this.cachedTiddlers.length = 0;
	}
};

BrowserStorageUtil.prototype.removeTiddlerFromLocalStorage = function(title) {
	console.log("browser-storage: Removing",title);
	window.localStorage.removeItem(this.options.prefix + title);
};

BrowserStorageUtil.prototype.saveTiddlerToLocalStorage = function(title) {
	// Get the tiddler
	const tiddler = $tw.wiki.getTiddler(title);
	if(tiddler) {
		if(this.wiki.tiddlerExists(title)) {
			// This is not a shadow tiddler
			console.log("browser-storage: Saving",title);
			// Get the JSON of the tiddler
			const json = JSON.stringify(tiddler.getFieldStrings());
			// Try to save it to local storage
			try {
				window.localStorage.setItem(this.options.prefix + title,json);
			} catch(e) {
				if(e.name === "QuotaExceededError") {
					// Complain if we failed
					const msg = $tw.wiki.getTiddlerText(this.QUOTA_EXCEEDED_ALERT_TITLE,this.DEFAULT_QUOTA_EXCEEDED_ALERT_PREFIX + title + this.DEFAULT_QUOTA_EXCEEDED_ALERT_SUFFIX);
					if(this.options.logger) {
						this.options.logger.alert(msg);
					}
					// No point in keeping old values around for this tiddler
					window.localStorage.removeItem(this.options.prefix + title);
				} else {
					console.log("Browser-storage error:",e);
				}
			}
		} else {
			// Shadow tiddler which is no longer overwritten (or never was)
			// Ensure it is not in local storage
			this.removeTiddlerFromLocalStorage(title);
		}
	} else {
		// In local storage, use the special value of empty string to mark the tiddler as deleted
		// On future page loads, if the tiddler is already gone from startup then the blank entry
		// will be removed from localstorage. Otherwise, the tiddler will be deleted.
		console.log("browser-storage: Blanking",title);
		try {
			window.localStorage.setItem(this.options.prefix + title,"");
		} catch(e) {
			console.log("Browser-storage error:",e);
		}
	}
};

BrowserStorageUtil.prototype.clearLocalStorage = function() {
	const url = window.location.pathname;
	const log = [];
	// Step through each browser storage item
	if(window.localStorage) {
		for(let index = window.localStorage.length - 1;index >= 0;index--) {
			const key = window.localStorage.key(index);
			const parts = key.split("#");
			// Delete it if it is ours
			if(parts[0] === "tw5" && parts[1] === url) {
				window.localStorage.removeItem(key);
			}
		}
	}
};

exports.BrowserStorageUtil = BrowserStorageUtil;
