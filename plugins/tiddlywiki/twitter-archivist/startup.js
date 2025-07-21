/*\
title: $:/plugins/tiddlywiki/twitter-archivist/startup.js
type: application/javascript
module-type: startup

Twitter initialisation

\*/

"use strict";

// Export name and synchronous status
exports.name = "twitter-archivist";
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-load-twitter-archive",(event) => {
		// Load tweets
		const archiveSource = new $tw.utils.TwitterArchivistSourceBrowser({});
		const archivist = new $tw.utils.TwitterArchivist({
			source: archiveSource
		});
		archivist.loadArchive({
			wiki: $tw.wiki
		}).then(() => {
			alert("Archived tweets imported");
		}).catch((err) => {
			alert(`Error importing archived tweets: ${err}`);
		});
	});
};
