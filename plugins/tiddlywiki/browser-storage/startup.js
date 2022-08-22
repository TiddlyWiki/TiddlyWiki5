/*\
title: $:/plugins/tiddlywiki/browser-storage/startup.js
type: application/javascript
module-type: startup

Startup initialisation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "browser-storage";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

var ENABLED_TITLE = "$:/config/BrowserStorage/Enabled",
	SAVE_FILTER_TITLE = "$:/config/BrowserStorage/SaveFilter",
	QUOTA_EXCEEDED_ALERT_TITLE = "$:/config/BrowserStorage/QuotaExceededAlert",
	DEFAULT_QUOTA_EXCEEDED_ALERT_PREFIX = "Quota exceeded attempting to store `",
	DEFAULT_QUOTA_EXCEEDED_ALERT_SUFFIX = "` in browser local storage";

exports.startup = function() {
	var self = this;
	// Compute our prefix for local storage keys
	var prefix = "tw5#" + window.location.pathname + "#";
	// Make a logger
	var logger = new $tw.utils.Logger("browser-storage",{
			colour: "cyan"
		});
	// Function to compile the filter
	var filterFn,
		compileFilter = function() {
			filterFn = $tw.wiki.compileFilter($tw.wiki.getTiddlerText(SAVE_FILTER_TITLE));
	}
	compileFilter();
	// Listen for tm-clear-browser-storage messages
	$tw.rootWidget.addEventListener("tm-clear-browser-storage",function(event) {
		$tw.wiki.addTiddler({title: ENABLED_TITLE, text: "no"});
		clearLocalStorage();
	});
	// Track tiddler changes
	$tw.wiki.addEventListener("change",function(changes) {
		// Bail if browser storage is disabled
		if($tw.wiki.getTiddlerText(ENABLED_TITLE) === "no") {
			return;
		}
		// Recompile the filter if it has changed
		if(changes[SAVE_FILTER_TITLE]) {
			compileFilter();
		}
		// Filter the changes
		var filteredChanges = filterFn.call($tw.wiki,function(iterator) {
			$tw.utils.each(changes,function(change,title) {
				var tiddler = $tw.wiki.getTiddler(title);
				iterator(tiddler,title);
			});
		});
		$tw.utils.each(filteredChanges,function(title) {
			// Don't try to save changes to our enabled status
			// (If it were enabled in the file but disabled in local storage then we might not realise that distributing a copy of the file would have local storage enabled for other users)
			if(title === ENABLED_TITLE) {
				return;
			}
			// Save the tiddler
			saveTiddlerToLocalStorage(title,{
				logger: logger,
				prefix: prefix
			});
		});
	});
};

function saveTiddlerToLocalStorage(title,options) {
	options = options || {};
	// Get the tiddler
	var tiddler = $tw.wiki.getTiddler(title);
	if(tiddler) {
		console.log("browser-storage: Saving",title);
		// Get the JSON of the tiddler				
		var json = JSON.stringify(tiddler.getFieldStrings());
		// Try to save it to local storage
		try {
			window.localStorage.setItem(options.prefix + title,json);
		} catch(e) {
			if(e.name === "QuotaExceededError") {
				// Complain if we failed
				var msg = $tw.wiki.getTiddlerText(QUOTA_EXCEEDED_ALERT_TITLE,DEFAULT_QUOTA_EXCEEDED_ALERT_PREFIX + title + DEFAULT_QUOTA_EXCEEDED_ALERT_SUFFIX);
				if(options.logger) {
					options.logger.alert(msg);
				}
				// No point in keeping old values around for this tiddler
				window.localStorage.removeItem(options.prefix + title);
			} else {
				console.log("Browser-storage error:",e);
			}
		}
	} else {
		// In local storage, use the special value of empty string to mark the tiddler as deleted
		// On future page loads, if the tiddler is already gone from startup then the blank entry
		// will be removed from localstorage. Otherwise, the tiddler will be deleted.
		console.log("browser-storage: Blanking",title);
		try {
			window.localStorage.setItem(options.prefix + title, "");
		} catch(e) {
			console.log("Browser-storage error:",e);
		}
	}
}

function clearLocalStorage() {
	var url = window.location.pathname,
		log = [];
	// Step through each browser storage item
	if(window.localStorage) {
		for(var index=window.localStorage.length - 1; index>=0; index--) {
			var key = window.localStorage.key(index),
				parts = key.split("#");
			// Delete it if it is ours
			if(parts[0] === "tw5" && parts[1] === url) {
				window.localStorage.removeItem(key);
			}
		}
	}
}

})();
