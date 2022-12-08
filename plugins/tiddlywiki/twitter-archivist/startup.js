/*\
title: $:/plugins/tiddlywiki/twitter-archivist/startup.js
type: application/javascript
module-type: startup

Twitter initialisation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "twitter-archivist";
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-load-twitter-archive",function(event) {
		// Load tweets
		var archiveSource = new $tw.utils.TwitterArchivistSourceBrowser({
		}),
		archivist = new $tw.utils.TwitterArchivist({
			source: archiveSource
		});
		archivist.loadArchive({
			wiki: $tw.wiki
		}).then(function() {
			alert("Archived tweets imported");
		}).catch(function(err) {
			alert("Error importing archived tweets: " + err);
		});
	});
};

})();
