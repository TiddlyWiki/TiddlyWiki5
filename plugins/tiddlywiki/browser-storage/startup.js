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
		prefix = "tw5#" + url + "#"
	// Track tiddler changes
	$tw.wiki.addEventListener("change",function(changes) {
		$tw.utils.each(changes,function(change,title) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(tiddler) {
				var json = JSON.stringify(tiddler.getFieldStrings());
				window.localStorage.setItem(prefix + title,json);
				console.log("browser-storage: Saving",title);
			} else {
				window.localStorage.removeItem(prefix + title);
				console.log("browser-storage: Deleting",title);
			}
		});
	});
};

})();
