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

exports.startup = function() {
	// Compute our prefix for local storage keys
	var url = window.location.protocol === "file:" ? window.location.pathname : "",
		prefix = "tw5#" + url + "#";
	// Make a logger
	var logger = new $tw.utils.Logger("browser-storage",{
			colour: "cyan"
		});
	// Track tiddler changes
	$tw.wiki.addEventListener("change",function(changes) {
		$tw.utils.each(changes,function(change,title) {
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
						logger.alert("Quota exceeded trying to store '" + title + "' in browser local storage");
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
