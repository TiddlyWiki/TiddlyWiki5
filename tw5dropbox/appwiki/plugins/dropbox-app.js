/*\
title: $:/plugins/dropbox/dropbox-app.js
type: application/javascript
module-type: dropbox-startup

Startup the Dropbox wiki app

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.startup = function(loggedIn) {
	// Load any tiddlers embedded in the index file
	var index = $tw.wiki.getTiddlerData($tw.plugins.dropbox.titleTiddlerIndex);
	if(index) {
		$tw.wiki.addTiddlers(index.tiddlers);
		$tw.wiki.addTiddlers(index.shadows,true);
		$tw.plugins.dropbox.fileInfo = index.fileInfo;
	}
	if(loggedIn) {
		// Figure out the wiki name
		var url = (window.location.protocol + "//" + window.location.host + window.location.pathname),
			wikiName;
		if(url.indexOf($tw.plugins.dropbox.userInfo.publicAppUrl) === 0) {
			var p = url.indexOf("/",$tw.plugins.dropbox.userInfo.publicAppUrl.length + 1);
			if(p !== -1 && url.substr(p) === "/index.html") {
				wikiName = decodeURIComponent(url.substring($tw.plugins.dropbox.userInfo.publicAppUrl.length + 1,p));
			}
		}
		if(wikiName) {
			// Save the wiki name for later
			$tw.plugins.dropbox.wikiName = wikiName;
			$tw.wiki.addTiddler({title: $tw.plugins.dropbox.titleWikiName, text: $tw.plugins.dropbox.wikiName},true);
			// Check for later versions of files on Dropbox
			$tw.plugins.dropbox.refreshTiddlerFiles("/" + $tw.plugins.dropbox.wikiName + "/tiddlers",function(hadChanges) {
				// Save the tiddler index if we had changes
				if(hadChanges) {
					$tw.plugins.dropbox.saveTiddlerIndex("/" + $tw.plugins.dropbox.wikiName + "/index.html",function(error) {
						console.log("Saved tiddler index");
						// Sync any subsequent tiddler changes
						$tw.plugins.dropbox.setupSyncer($tw.wiki);
					});
				}
			});
		} else {
			alert("This TiddlyWiki file must be in Dropbox");
		}
	}
};

})();
