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
exports.after = ["load-modules"];
exports.synchronous = true;

var SAVE_FILTER_TITLE = "$:/config/BrowserStorage/SaveFilter",
	QUOTA_EXCEEDED_ALERT_TITLE = "$:/config/BrowserStorage/QuotaExceededAlert",
	DEFAULT_QUOTA_EXCEEDED_ALERT_PREFIX = "Quota exceeded attempting to store `",
	DEFAULT_QUOTA_EXCEEDED_ALERT_SUFFIX = "` in browser local storage";

exports.startup = function() {
	var self = this;
	// Compute our prefix for local storage keys
	var url = window.location.protocol === "file:" ? window.location.pathname : "",
		prefix = "tw5#" + url + "#";
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
	// Track tiddler changes
	$tw.wiki.addEventListener("change",function(changes) {
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
console.log("Filtered changes",filteredChanges)
		$tw.utils.each(filteredChanges,function(title) {
			// Get the tiddler
			var tiddler = $tw.wiki.getTiddler(title);
			if(tiddler) {
				// Get the JSON of the tiddler				
				var json = JSON.stringify(tiddler.getFieldStrings());
				// Try to save it to local storage
				try {
					window.localStorage.setItem(prefix + title,json);
				} catch(e) {
					if(e.name === "QuotaExceededError") {
						// Complain if we failed
						var msg = $tw.wiki.getTiddlerText(QUOTA_EXCEEDED_ALERT_TITLE,DEFAULT_QUOTA_EXCEEDED_ALERT_PREFIX + title + DEFAULT_QUOTA_EXCEEDED_ALERT_SUFFIX);
						logger.alert(msg);
						// No point in keeping old values around for this tiddler
						window.localStorage.removeItem(prefix + title);
					} else {
						throw e;
					}
				}
				console.log("browser-storage: Saving",title);
			} else {
				window.localStorage.removeItem(prefix + title);
				console.log("browser-storage: Deleting",title);
			}
		});
	});
};

})();
